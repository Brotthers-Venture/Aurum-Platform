import { NextResponse, type NextRequest } from "next/server";
import { gleifGet } from "@/lib/gleif-server";
import { isLei, normalize } from "@/lib/gleif";

/** GET /api/gleif/search?q=<name or LEI>&funds=1 — up to 10 matching LEI records. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const fundsOnly = req.nextUrl.searchParams.get("funds") === "1";
  if (q.length < 3) return NextResponse.json({ results: [], total: 0 });

  try {
    if (isLei(q)) {
      const one = await gleifGet(`/lei-records/${q.toUpperCase()}`);
      return NextResponse.json({ results: one?.data ? [normalize(one.data)] : [], total: one?.data ? 1 : 0 });
    }
    const params = new URLSearchParams({ "filter[fulltext]": q, "page[size]": "10" });
    if (fundsOnly) params.set("filter[entity.category]", "FUND");
    const json = await gleifGet(`/lei-records?${params}`);
    return NextResponse.json({
      results: (json?.data ?? []).map(normalize),
      total: json?.meta?.pagination?.total ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "GLEIF is unavailable right now. Try again, or enter the vehicle manually." }, { status: 502 });
  }
}
