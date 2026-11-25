"use client";

import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { HexGlyph } from "@/components/shell/HexaRoom";
import { moduleName } from "@/lib/brand";
import { roleById, users } from "@/lib/access";
import { ALWAYS, GRANTABLE, GRANTS_EVENT, HEXAS, MAIN_ADMIN, readGrants, writeGrant, type HexaId } from "@/lib/hexa";
import { emit } from "@/lib/spine";

/**
 * Which hexagons each person opens. Chat, PMO and their solution are always on; everything else is granted
 * person by person, and only the main administrator can grant or remove it. Every change is logged.
 */
export function HexaAccess() {
  const { brand } = useBrand();
  const { role, user } = usePreviewRole();
  const [grants, setGrants] = useState<Record<string, HexaId[]>>({});
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setGrants(readGrants());
    read();
    window.addEventListener(GRANTS_EVENT, read);
    return () => window.removeEventListener(GRANTS_EVENT, read);
  }, []);
  const isAdmin = role === MAIN_ADMIN;
  const people = users.filter((u) => !u.role.startsWith("investor"));
  const cols = HEXAS;
  const name = (id: HexaId) => {
    const h = HEXAS.find((x) => x.id === id)!;
    return h.firm ? moduleName(brand, h.firm) : h.name;
  };

  const toggle = (email: string, person: string, id: HexaId) => {
    const cur = grants[email] ?? [];
    const on = cur.includes(id);
    const next = on ? cur.filter((x) => x !== id) : [...cur, id];
    writeGrant(email, next);
    emit({ actor: user.name, type: on ? "access.revoked" : "access.granted", ref: { kind: "person", id: email }, text: `${user.name} ${on ? "removed" : "granted"} ${name(id)} ${on ? "from" : "to"} ${person}.` });
    setFlash(`${name(id)} ${on ? "removed from" : "granted to"} ${person}`);
    window.setTimeout(() => setFlash(null), 2600);
  };

  return (
    <div className="space-y-3">
      <div className={cx("flex items-start gap-3 rounded-[8px] border px-4 py-3 text-[12.5px]", isAdmin ? "border-stone-200 bg-white" : "border-stone-200 bg-stone-25")}>
        {isAdmin ? <Check size={15} className="mt-px shrink-0 text-ink-900" /> : <Lock size={14} className="mt-px shrink-0 text-stone-500" />}
        <p className="text-stone-600">
          <span className="font-semibold text-ink-900">Everyone opens {name("communication")}, {name("pmo")} and their solution.</span> Every other hexagon is granted person by person.{" "}
          {isAdmin ? "You are the main administrator — select a cell to grant or remove access. Each change is logged." : `Only the main administrator (${roleById(MAIN_ADMIN).name}) can change this.`}
        </p>
      </div>
      <div className="overflow-x-auto rounded-[8px] border border-stone-200 bg-white">
        <table className="w-full min-w-[900px] text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-stone-500">Person</th>
              {cols.map((h) => (
                <th key={h.id} className="px-2 py-2.5 text-center text-[11.5px] font-medium text-stone-500">
                  <span className="inline-flex flex-col items-center gap-1">
                    <HexGlyph color={h.color} size={15} />
                    {name(h.id)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map((p) => {
              const admin = p.role === MAIN_ADMIN;
              const g = grants[p.email] ?? [];
              return (
                <tr key={p.email} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-ink-900">{p.name}</div>
                    <div className="text-[11.5px] text-stone-500">{roleById(p.role).name}</div>
                  </td>
                  {cols.map((h) => {
                    const always = admin || ALWAYS.includes(h.id);
                    const on = always || g.includes(h.id);
                    const editable = isAdmin && !always && GRANTABLE.includes(h.id);
                    return (
                      <td key={h.id} className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => toggle(p.email, p.name, h.id)}
                          aria-pressed={on}
                          aria-label={`${name(h.id)} for ${p.name}: ${always ? "always on" : on ? "granted" : "not granted"}`}
                          title={always ? (admin ? "Main administrator — everything" : "Always on") : editable ? (on ? "Remove access" : "Grant access") : on ? "Granted" : "Not granted"}
                          className={cx(
                            "inline-flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors",
                            on ? "border-transparent" : "border-stone-200",
                            editable ? "cursor-pointer hover:border-stone-400" : "cursor-default",
                          )}
                          style={on ? { background: always ? "var(--color-stone-100)" : `color-mix(in srgb, ${h.color} 18%, transparent)` } : undefined}
                        >
                          {on && (always ? <Lock size={11} className="text-stone-400" /> : <Check size={13} strokeWidth={2.6} style={{ color: h.color }} />)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11.5px] text-stone-500">
        <Lock size={11} className="mr-1 inline" /> always on · <Check size={11} className="mr-1 inline" /> granted by the main administrator. Investors use their own portal and do not open hexagons.
      </p>
      {flash && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lift">{flash}</div>}
    </div>
  );
}
