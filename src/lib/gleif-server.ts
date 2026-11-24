import "server-only";
import { cacheLife } from "next/cache";

const GLEIF_BASE = process.env.GLEIF_API_BASE ?? "https://api.gleif.org/api/v1";

/** Cached GLEIF GET (LEI data changes slowly; an hour is plenty). Returns null on 404. */
export async function gleifGet(path: string) {
  "use cache";
  cacheLife("hours");
  const res = await fetch(`${GLEIF_BASE}${path}`, { headers: { Accept: "application/vnd.api+json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GLEIF ${res.status}`);
  return res.json();
}
