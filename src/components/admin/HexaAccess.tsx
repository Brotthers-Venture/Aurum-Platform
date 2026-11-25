"use client";

import { Fragment, useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { cx } from "@/components/ui";
import { useBrand } from "@/components/brand/BrandProvider";
import { usePreviewRole } from "@/components/admin/PreviewRole";
import { HexGlyph } from "@/components/shell/HexaRoom";
import { moduleName } from "@/lib/brand";
import { GRANTS_EVENT, HEXAS, MAIN_ADMIN, TODAY_ISO, canInvite, isDefault, readInvites, writeInvites, type HexaId, type Invitation } from "@/lib/hexa";
import { MEMBERS, PARTY_LABEL, TENANTS, type Member, type PartyType } from "@/lib/parties";
import { emit } from "@/lib/spine";

const ORDER: PartyType[] = ["employee", "tenant", "gp", "client", "lp", "guest"];
const GUEST_DAYS = 90;
const plusDays = (iso: string, d: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);
const short = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * Who opens which hexagon. Defaults come from the person's party (locked); everything else is an invitation,
 * recorded with who invited and — for guests — an end date. The main administrator invites anyone; a tenant's
 * administrator invites its own people and clients into the tenant's hexagons.
 */
export function HexaAccess() {
  const { brand } = useBrand();
  const { member: me } = usePreviewRole();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setInvites(readInvites());
    read();
    window.addEventListener(GRANTS_EVENT, read);
    return () => window.removeEventListener(GRANTS_EVENT, read);
  }, []);
  const name = (id: HexaId) => {
    const h = HEXAS.find((x) => x.id === id)!;
    return h.firm ? moduleName(brand, h.firm) : h.name;
  };
  const isMain = me.role === MAIN_ADMIN;
  const tenantAdmin = me.party === "tenant" && me.orgAdmin;
  // a tenant administrator only sees their own organisation and clients
  const people = MEMBERS.filter((m) => isMain || me.party === "employee" || (tenantAdmin && ((m.party === "tenant" && m.org === me.org) || (m.party === "client" && m.tenantId === me.org))));

  const toggle = (m: Member, h: HexaId) => {
    const has = invites.find((i) => i.email === m.email && i.hexa === h);
    const next = has ? invites.filter((i) => i !== has) : [...invites, { email: m.email, hexa: h, by: me.name, at: TODAY_ISO, ...(m.party === "guest" ? { expires: plusDays(TODAY_ISO, GUEST_DAYS) } : {}) }];
    writeInvites(next);
    emit({ actor: me.name, type: has ? "access.revoked" : "access.invited", ref: { kind: "person", id: m.email }, text: `${me.name} ${has ? "removed" : "invited"} ${m.name} ${has ? "from" : "to"} ${name(h)}${!has && m.party === "guest" ? ` until ${short(plusDays(TODAY_ISO, GUEST_DAYS))}` : ""}.` });
    setFlash(`${m.name} ${has ? "removed from" : "invited to"} ${name(h)}`);
    window.setTimeout(() => setFlash(null), 2600);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-[8px] border border-stone-200 bg-white px-4 py-3 text-[12.5px] text-stone-600">
        {isMain || tenantAdmin ? <Check size={15} className="mt-px shrink-0 text-ink-900" /> : <Lock size={14} className="mt-px shrink-0 text-stone-500" />}
        <p>
          <span className="font-semibold text-ink-900">Defaults by party:</span> {name("communication")} for everyone; {name("pmo")} for employees, general partners and tenants; tenants
          also Corporate Solution and Multi-Family Office; clients Corporate Solution, then their client portal once a company is formed. Everything else is by invitation
          {" — "}
          {isMain
            ? "you are the main administrator: select a cell to invite or remove. Guests are invited for 90 days."
            : tenantAdmin
              ? `you administer ${me.orgName}: you can invite your own people and clients into ${name("corporate")} and Multi-Family Office.`
              : "only the main administrator, or a tenant's administrator for its own people, can change this."}
        </p>
      </div>
      <div className="overflow-x-auto rounded-[8px] border border-stone-200 bg-white">
        <table className="w-full min-w-[980px] text-[12.5px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-stone-500">Person</th>
              {HEXAS.map((h) => (
                <th key={h.id} className="px-1.5 py-2.5 text-center text-[11px] font-medium text-stone-500">
                  <span className="inline-flex flex-col items-center gap-1">
                    <HexGlyph color={h.color} size={15} />
                    {name(h.id)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDER.map((party) => {
              const rows = people.filter((m) => m.party === party);
              if (!rows.length) return null;
              return (
                <Fragment key={party}>
                  <tr className="border-b border-stone-100 bg-stone-25">
                    <td colSpan={HEXAS.length + 1} className="px-4 py-1.5 text-[11px] font-semibold text-stone-500">
                      {PARTY_LABEL[party]}s
                    </td>
                  </tr>
                  {rows.map((m) => {
                    const tenant = m.tenantId ? TENANTS.find((t) => t.id === m.tenantId)?.name : undefined;
                    return (
                      <tr key={m.id} className="border-b border-stone-100 last:border-0">
                        <td className="px-4 py-2">
                          <div className="font-medium text-ink-900">{m.name}</div>
                          <div className="text-[11px] text-stone-500">
                            {m.orgName}
                            {m.orgAdmin ? " · administrator" : ""}
                            {tenant ? ` · client of ${tenant}` : ""}
                            {m.role === MAIN_ADMIN ? " · main administrator" : ""}
                          </div>
                        </td>
                        {HEXAS.map((h) => {
                          const def = isDefault(m, h.id);
                          const inv = invites.find((i) => i.email === m.email && i.hexa === h.id);
                          const expired = inv?.expires && inv.expires < TODAY_ISO;
                          const on = def || (!!inv && !expired);
                          const editable = !def && canInvite(me, m, h.id);
                          return (
                            <td key={h.id} className="px-1.5 py-2 text-center">
                              <button
                                type="button"
                                disabled={!editable}
                                onClick={() => toggle(m, h.id)}
                                aria-pressed={on}
                                aria-label={`${name(h.id)} for ${m.name}: ${def ? "default" : on ? "invited" : "not invited"}`}
                                title={def ? `Default for ${PARTY_LABEL[m.party].toLowerCase()}s` : inv ? `Invited by ${inv.by} on ${short(inv.at)}${inv.expires ? ` · until ${short(inv.expires)}` : ""}` : editable ? "Invite" : "Not invited"}
                                className={cx("inline-flex h-7 w-7 items-center justify-center rounded-[6px] border transition-colors", on ? "border-transparent" : "border-stone-200", editable ? "cursor-pointer hover:border-stone-400" : "cursor-default")}
                                style={on ? { background: def ? "var(--color-stone-100)" : `color-mix(in srgb, ${h.color} 18%, transparent)` } : undefined}
                              >
                                {on && (def ? <Lock size={11} className="text-stone-400" /> : <Check size={13} strokeWidth={2.6} style={{ color: h.color }} />)}
                                {!on && inv && expired && <span className="text-[9px] text-stone-400">exp</span>}
                              </button>
                              {inv?.expires && on && <div className="mt-0.5 text-[9.5px] text-stone-400">to {short(inv.expires).replace(/, \d{4}$/, "")}</div>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11.5px] text-stone-500">
        <Lock size={11} className="mr-1 inline" /> default for the person&apos;s party · <Check size={11} className="mr-1 inline" /> invitation (hover for who invited and until when). Limited partners and clients use
        their own portals; their {name("communication")} shows only their own conversations.
      </p>
      {flash && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lift">{flash}</div>}
    </div>
  );
}
