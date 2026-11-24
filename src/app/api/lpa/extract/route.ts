import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, TERM_KEYS, VERIFY_PROMPT, recordTermsTool, recordVerificationTool } from "@/lib/lpa/prompt";

/**
 * POST /api/lpa/extract
 * Body: { fundId: string, documents: { name: string, base64: string }[] }  (PDFs)
 *
 * Runs two passes against the Anthropic Messages API: extraction, then an
 * independent verification of every quote. Results are saved as a draft
 * review; nothing is applied to the fund without human approval.
 *
 * Requires ANTHROPIC_API_KEY (set in Vercel as an encrypted environment variable).
 * Not yet exercised against the live API — needs a key and sample LPA to test.
 */
const MODEL = "claude-opus-5-5";

type Doc = { name: string; base64: string };

async function callClaude(apiKey: string, system: string, documents: Doc[], text: string, tool: object, toolName: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: toolName },
      messages: [
        {
          role: "user",
          content: [
            ...documents.map((d) => ({
              type: "document",
              title: d.name,
              source: { type: "base64", media_type: "application/pdf", data: d.base64 },
              cache_control: { type: "ephemeral" },
            })),
            { type: "text", text },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const block = json.content?.find((b: { type: string }) => b.type === "tool_use");
  if (!block) throw new Error("No structured result returned");
  return block.input;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "LPA review is not configured. Add ANTHROPIC_API_KEY to the environment." }, { status: 503 });
  }
  const body = (await req.json()) as { fundId?: string; documents?: Doc[] };
  if (!body.fundId || !body.documents?.length) {
    return NextResponse.json({ error: "fundId and at least one PDF are required." }, { status: 400 });
  }

  try {
    const checklist = TERM_KEYS.map(([k, l]) => `- ${k}: ${l}`).join("\n");
    const extracted = await callClaude(
      apiKey,
      SYSTEM_PROMPT,
      body.documents,
      `Record each of these terms. Use status "not_found" for any the documents do not state.\n${checklist}`,
      recordTermsTool,
      "record_terms",
    );
    const verification = await callClaude(
      apiKey,
      VERIFY_PROMPT,
      body.documents,
      `Terms to verify:\n${JSON.stringify(extracted.terms, null, 2)}`,
      recordVerificationTool,
      "record_verification",
    );
    // Phase 2: persist as a draft review in Supabase (lpa_reviews / lpa_terms) with prepared_by = current user.
    return NextResponse.json({ fundId: body.fundId, model: MODEL, extracted, verification, status: "draft" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
