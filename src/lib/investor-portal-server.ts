import { PORTAL_INVESTOR_ID, investorById } from "@/lib/data";
import { ptaxTable, rateOn } from "@/lib/fx-server";
import { investorView } from "@/lib/investor-portal";

/** The sample investor's view of a sponsor's portal, with BRL at PTAX for each date. */
export async function loadInvestorView(gpId: string) {
  const me = investorById(PORTAL_INVESTOR_ID)!;
  const table = await ptaxTable();
  return { me, v: investorView(gpId, me.id, me.name, (d) => rateOn(table, d).rate) };
}
