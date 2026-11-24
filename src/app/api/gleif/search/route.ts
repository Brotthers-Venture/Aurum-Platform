import { NextResponse, type NextRequest } from "next/server";
import { gleifGet } from "@/lib/gleif-server";
import { isLei, normalize, simplify, type GleifEntity } from "@/lib/gleif";

/* eslint-disable @typescript-eslint/no-explicit-any */
const fuzzyLeis = (json: any): string[] =>
  (json?.data ?? json ?? [])
    .map((it: any) => it?.relationships?.["lei-records"]?.data?.id ?? it?.relationships?.["lei-records"]?.id)
    .filter((id: unknown): id is string => typeof id === "string");
/* eslint-enable @typescript-eslint/no-explicit-any */

/** How well a legal name answers the query: exact > starts with > contains every word > partial. */
function score(e: GleifEntity, q: string) {
  const name = simplify(e.legalName);
  const words = q.split(" ").filter(Boolean);
  let s = 0;
  if (name === q) s += 100;
  else if (name.startsWith(q)) s += 70;
  else if (name.includes(q)) s += 55;
  const hit = words.filter((w) => name.includes(w)).length;
  s += (hit / words.length) * 40;
  if (e.fundLike) s += 8;
  if (e.registrationStatus === "ISSUED") s += 2;
  return s;
}

/**
 * GET /api/gleif/search?q=<name or LEI>
 * Combines GLEIF's fuzzy name matcher (tolerant of hyphens, punctuation and typos) with its
 * full-text index (which also matches addresses and "c/o" lines, e.g. the manager's name),
 * then ranks by how closely the legal name matches. No category filter: many funds are
 * registered in GLEIF as general entities.
 */
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (raw.length < 3) return NextResponse.json({ results: [], total: 0 });

  try {
    if (isLei(raw)) {
      const one = await gleifGet(`/lei-records/${raw.toUpperCase()}`);
      return NextResponse.json({ results: one?.data ? [normalize(one.data)] : [], total: one?.data ? 1 : 0 });
    }

    const q = simplify(raw);
    const [fuzzy, full] = await Promise.all([
      gleifGet(`/fuzzycompletions?${new URLSearchParams({ field: "entity.legalName", q: raw })}`).catch(() => null),
      gleifGet(`/lei-records?${new URLSearchParams({ "filter[fulltext]": raw, "page[size]": "15" })}`).catch(() => null),
    ]);
    if (!fuzzy && !full) throw new Error("unavailable");

    const leis = fuzzyLeis(fuzzy).slice(0, 15);
    const fuzzyRecs = leis.length
      ? await gleifGet(`/lei-records?${new URLSearchParams({ "filter[lei]": leis.join(","), "page[size]": "15" })}`).catch(() => null)
      : null;

    const byLei = new Map<string, GleifEntity>();
    for (const rec of [...(fuzzyRecs?.data ?? []), ...(full?.data ?? [])]) {
      const e = normalize(rec);
      if (e.lei && !byLei.has(e.lei)) byLei.set(e.lei, e);
    }
    const ranked = [...byLei.values()].sort((a, b) => score(b, q) - score(a, q));
    return NextResponse.json({ results: ranked.slice(0, 10), total: ranked.length });
  } catch {
    return NextResponse.json({ error: "GLEIF is unavailable right now. Try again, or enter the vehicle manually." }, { status: 502 });
  }
}
