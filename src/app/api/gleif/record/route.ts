import { NextResponse, type NextRequest } from "next/server";
import { gleifGet } from "@/lib/gleif-server";
import { isLei, normalize, officeKey, type GleifDetail } from "@/lib/gleif";

/**
 * GET /api/gleif/record?lei=<LEI>
 * The full record plus the resolved legal-form name, the fund manager (for funds)
 * and managed funds (for managers).
 * &match=LEI1,LEI2 — known GP LEIs; when GLEIF has no fund-manager link, report which of them
 * shares the vehicle's principal office (a common sign the GP filed it, to be confirmed).
 */
export async function GET(req: NextRequest) {
  const lei = (req.nextUrl.searchParams.get("lei") ?? "").trim().toUpperCase();
  if (!isLei(lei)) return NextResponse.json({ error: "Not a valid LEI" }, { status: 400 });

  try {
    const rec = await gleifGet(`/lei-records/${lei}`);
    if (!rec?.data) return NextResponse.json({ error: "LEI not found" }, { status: 404 });
    const base = normalize(rec.data);

    const [elf, manager, managed] = await Promise.all([
      base.legalFormCode && !base.legalFormName ? gleifGet(`/entity-legal-forms/${base.legalFormCode}`).catch(() => null) : null,
      base.hasFundManager ? gleifGet(`/lei-records/${lei}/fund-manager`).catch(() => null) : null,
      base.hasManagedFunds ? gleifGet(`/lei-records/${lei}/managed-funds?page[size]=50`).catch(() => null) : null,
    ]);

    let addressMatch: string | null = null;
    const candidates = (req.nextUrl.searchParams.get("match") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter((c) => isLei(c) && c !== lei);
    const key = officeKey(base.hqAddress) ?? officeKey(base.legalAddress);
    if (!manager?.data && key && candidates.length) {
      const recs = await Promise.all(candidates.slice(0, 10).map((c) => gleifGet(`/lei-records/${c}`).catch(() => null)));
      addressMatch = recs.map((r) => (r?.data ? normalize(r.data) : null)).find((m) => m && officeKey(m.hqAddress) === key)?.lei ?? null;
    }

    const names = elf?.data?.attributes?.names;
    const detail: GleifDetail = {
      ...base,
      legalFormName: base.legalFormName ?? names?.[0]?.transliteratedName ?? names?.[0]?.localName ?? null,
      fundManager: manager?.data ? normalize(manager.data) : null,
      managedFunds: Array.isArray(managed?.data) ? managed.data.map(normalize) : [],
      addressMatch,
    };
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json({ error: "GLEIF is unavailable right now." }, { status: 502 });
  }
}
