/**
 * Lets prototype scripts import the demo data in src/lib/*.ts directly (Node --experimental-strip-types), so every
 * figure in a design prototype comes from the same source as the app. Usage:
 *   node --experimental-strip-types --no-warnings --import ./tools/stitch/ts-loader.mjs <script>
 */
import { register } from "node:module";

const hooks = `
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const SRC = ${JSON.stringify(new URL("../../src/", import.meta.url).href)};
export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@/")) spec = SRC + spec.slice(2);
  if ((spec.startsWith(".") || spec.startsWith("file:")) && !/\\.\\w+$/.test(spec)) {
    const base = new URL(spec, ctx.parentURL);
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const u = new URL(base.href + ext);
      if (existsSync(fileURLToPath(u))) return next(u.href, ctx);
    }
  }
  return next(spec, ctx);
}`;
register("data:text/javascript," + encodeURIComponent(hooks), import.meta.url);
