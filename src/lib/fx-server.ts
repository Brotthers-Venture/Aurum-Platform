import "server-only";
import { cacheLife } from "next/cache";
import { TODAY } from "@/lib/accounting/engine";

/**
 * USD/BRL from the Banco Central do Brasil — PTAX, the official reference rate used by
 * Brazilian funds, auditors and the CVM. Public Olinda OData service, no key.
 * We use the closing PTAX *selling* rate (cotacaoVenda).
 *
 * Policy: current consolidated totals use the latest bulletin; historical figures use the
 * PTAX of their own date (latest bulletin on or before it — weekends and holidays roll back).
 * If the BCB cannot be reached we never substitute silently: rates come back flagged
 * "indicative" and the UI says so.
 */

const BCB = process.env.BCB_API_BASE ?? "https://olinda.bcb.gov.br";
import { INDICATIVE_BRL_USD } from "@/lib/data";
export { INDICATIVE_BRL_USD };

export type Ptax = { date: string; buy: number; sell: number; at: string };
export type FxRate = { rate: number; date: string | null; source: "PTAX" | "indicative" };

const mdy = (iso: string) => `${iso.slice(5, 7)}-${iso.slice(8, 10)}-${iso.slice(0, 4)}`;

/**
 * Cached PTAX history. Failures are caught inside the cache scope (an error here would abort a
 * prerender) and cached only for minutes, so an outage never sticks; good data is kept for hours.
 */
async function fetchSeries(from: string, to: string): Promise<Ptax[] | null> {
  "use cache";
  try {
    const url =
      `${BCB}/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
      `?@dataInicial='${mdy(from)}'&@dataFinalCotacao='${mdy(to)}'&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao&$top=5000`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`BCB PTAX ${res.status}`);
    const json = (await res.json()) as { value?: { cotacaoCompra: number; cotacaoVenda: number; dataHoraCotacao: string }[] };
    const rows = (json.value ?? [])
      .filter((r) => r.cotacaoVenda > 0 && r.dataHoraCotacao)
      .map((r) => ({ date: r.dataHoraCotacao.slice(0, 10), buy: r.cotacaoCompra, sell: r.cotacaoVenda, at: r.dataHoraCotacao }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) throw new Error("BCB PTAX returned no bulletins");
    cacheLife("hours");
    return rows;
  } catch {
    cacheLife("minutes");
    return null;
  }
}

/** Daily closing PTAX since 2022, or null when the BCB is unreachable. */
export async function ptaxTable(): Promise<Ptax[] | null> {
  return fetchSeries("2022-01-01", TODAY);
}

/** PTAX selling rate for a date: the latest bulletin on or before it. */
export function rateOn(table: Ptax[] | null, date: string): FxRate {
  if (table) {
    let lo = 0;
    let hi = table.length - 1;
    let hit = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (table[mid].date <= date) {
        hit = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    if (hit >= 0) return { rate: table[hit].sell, date: table[hit].date, source: "PTAX" };
  }
  return { rate: INDICATIVE_BRL_USD, date: null, source: "indicative" };
}

/** Latest reporting rate (for current consolidated totals). */
export async function reportingRate(date: string = TODAY): Promise<FxRate> {
  return rateOn(await ptaxTable(), date);
}

export const fxLabel = (fx: FxRate) =>
  fx.source === "PTAX" ? `BRL at PTAX ${fx.rate.toFixed(4)} · ${fx.date}` : `BRL at indicative ${fx.rate.toFixed(2)} · PTAX unavailable`;
