import { NextResponse, type NextRequest } from "next/server";
import { gleifGet } from "@/lib/gleif-server";
import { isLei, normalize, type GleifDetail } from "@/lib/gleif";

/**
 * GET /api/gleif/record?lei=<LEI>
 * The full record plus the resolved legal-form name, the fund manager (for funds)
 * and managed funds (for managers).
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

    const names = elf?.data?.attributes?.names;
    const detail: GleifDetail = {
      ...base,
      legalFormName: base.legalFormName ?? names?.[0]?.transliteratedName ?? names?.[0]?.localName ?? null,
      fundManager: manager?.data ? normalize(manager.data) : null,
      managedFunds: Array.isArray(managed?.data) ? managed.data.map(normalize) : [],
    };
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json({ error: "GLEIF is unavailable right now." }, { status: 502 });
  }
}
