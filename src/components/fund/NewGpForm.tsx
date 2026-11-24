"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, CircleCheck, ImageUp, X } from "lucide-react";
import { Button, ButtonLink, cx } from "@/components/ui";
import { contrast, inkFor } from "@/lib/gps";

const input =
  "h-10 w-full rounded-[3px] border border-stone-300 bg-white px-3 text-[13px] text-ink-900 placeholder:text-stone-400 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900";

const ENTITY_SUFFIX = /,?\s+(inc\.?|incorporated|llc|l\.l\.c\.|ltd\.?|limited|lp|l\.p\.|corp\.?|corporation|group)$/i;
const displayFrom = (legal: string) => {
  let s = legal.trim();
  for (let i = 0; i < 3; i++) s = s.replace(ENTITY_SUFFIX, "");
  return s;
};
const slugFrom = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

type Logo = { url: string; name: string; kb: number } | null;

function Section({ n, title, desc, children }: { n: number; title: string; desc: string; children: ReactNode }) {
  return (
    <section className="rounded-[4px] border border-stone-200 bg-white">
      <header className="flex gap-4 border-b border-stone-200 px-6 py-4">
        <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-900 text-[11px] font-semibold">{n}</span>
        <div>
          <h2 className="text-[14px] font-semibold">{title}</h2>
          <p className="text-[12px] text-stone-500">{desc}</p>
        </div>
      </header>
      <div className="space-y-5 p-6">{children}</div>
    </section>
  );
}

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold">
        {label}
        {required && <span className="ml-0.5 text-negative">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error ? <span className="mt-1 block text-[12px] text-negative">{error}</span> : hint ? <span className="mt-1 block text-[12px] text-stone-500">{hint}</span> : null}
    </label>
  );
}

function LogoDrop({ label, hint, surface, value, onChange, error }: { label: string; hint: string; surface: string; value: Logo; onChange: (l: Logo) => void; error?: string | null }) {
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <div>
      <div className="text-[12px] font-semibold">
        {label}
        <span className="ml-0.5 text-negative">*</span>
      </div>
      <div
        className={cx("relative mt-1.5 flex h-[120px] items-center justify-center overflow-hidden rounded-[3px] border", error || problem ? "border-negative" : "border-stone-300")}
        style={{ background: surface }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.url} alt="" className="max-h-[72px] max-w-[80%] object-contain" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-stone-600 hover:text-ink-900"
              aria-label="Remove logo"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-1.5 text-[12px]" style={{ color: inkFor(surface) === "#FFFFFF" ? "rgba(255,255,255,0.75)" : "#5A5A53" }}>
            <ImageUp size={20} strokeWidth={1.5} />
            <span className="font-semibold">Upload SVG or PNG</span>
            <input
              type="file"
              accept="image/svg+xml,image/png"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!["image/svg+xml", "image/png"].includes(f.type)) return setProblem("Use SVG or PNG.");
                if (f.size > 2 * 1024 * 1024) return setProblem("Maximum 2 MB.");
                setProblem(null);
                onChange({ url: URL.createObjectURL(f), name: f.name, kb: Math.round(f.size / 1024) });
              }}
            />
          </label>
        )}
      </div>
      <div className="mt-1 text-[12px]">
        {problem || error ? (
          <span className="text-negative">{problem ?? error}</span>
        ) : value ? (
          <span className="text-stone-500">
            {value.name} · {value.kb} KB
          </span>
        ) : (
          <span className="text-stone-500">{hint}</span>
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <Field label={label} required hint={hint} error={isHex(value) ? null : "Enter a 6-digit hex colour, e.g. #1F3A5F"}>
      <div className="flex gap-2">
        <input type="color" value={isHex(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-[3px] border border-stone-300 bg-white p-1" aria-label={`${label} picker`} />
        <input className={`${input} font-mono uppercase`} value={value} onChange={(e) => onChange(e.target.value.trim())} maxLength={7} />
      </div>
    </Field>
  );
}

function Check2({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2.5 text-[12px]">
      {ok ? <CircleCheck size={15} className="mt-px shrink-0 text-positive" /> : <CircleAlert size={15} className="mt-px shrink-0 text-caution" />}
      <span>
        <span className="font-semibold text-ink-900">{label}</span> <span className="text-stone-500">{detail}</span>
      </span>
    </div>
  );
}

export function NewGpForm() {
  const [legal, setLegal] = useState("");
  const [display, setDisplay] = useState("");
  const [displayTouched, setDisplayTouched] = useState(false);
  const [entityType, setEntityType] = useState("Corporation");
  const [jurisdiction, setJurisdiction] = useState("");
  const [regulatory, setRegulatory] = useState("Exempt reporting adviser");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [logoLight, setLogoLight] = useState<Logo>(null);
  const [logoDark, setLogoDark] = useState<Logo>(null);
  const [primary, setPrimary] = useState("#1F3A5F");
  const [secondary, setSecondary] = useState("#C9A94B");
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const shown = displayTouched ? display : displayFrom(legal);
  const slug = subdomain || slugFrom(shown);
  const domain = contactEmail.split("@")[1]?.toLowerCase() ?? "";
  const ok = { primary: isHex(primary), secondary: isHex(secondary) };
  const ink = ok.primary ? inkFor(primary) : "#FFFFFF";
  const textRatio = ok.primary ? contrast(primary, ink) : 0;
  const accentRatio = ok.primary && ok.secondary ? contrast(primary, secondary) : 0;
  const onWhite = ok.primary ? contrast(primary, "#FFFFFF") : 0;

  const errors = {
    legal: legal.trim().length < 3 ? "Enter the full legal name as registered." : null,
    jurisdiction: !jurisdiction.trim() ? "Required for client due diligence." : null,
    contactName: !contactName.trim() ? "Required." : null,
    contactEmail: !/^\S+@\S+\.\S+$/.test(contactEmail) ? "Enter a valid business email." : null,
    logoLight: !logoLight ? "Required — used on white pages, reports and notices." : null,
    logoDark: !logoDark ? "Required — used on brand-coloured surfaces such as sign-in." : null,
    colors: !ok.primary || !ok.secondary ? "Both colours are required." : null,
  };
  const valid = Object.values(errors).every((e) => !e);
  const err = (k: keyof typeof errors) => (showErrors ? errors[k] : null);

  if (submitted) {
    return (
      <div className="mx-auto max-w-[680px] space-y-6 py-6">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: primary }}>
            <Check size={22} strokeWidth={2.4} />
          </span>
          <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.015em]">{legal} has been set up</h1>
          <p className="mt-2 text-[14px] text-stone-600">
            Portal reserved at <span className="font-mono text-[12px] text-ink-900">{slug}.portal.aurumasset.us</span>. Portals stay closed
            to the GP and investors until the steps below are complete.
          </p>
        </div>
        <div className="rounded-[4px] border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-3 text-[13px] font-semibold">Before the portals go live</div>
          <ol className="divide-y divide-stone-100">
            {[
              ["Client due diligence on the GP", "KYB: formation documents, beneficial owners, regulatory status, sanctions screening — Compliance officer"],
              ["Engagement letter signed", "Administration agreement and fee schedule"],
              ["First fund created", "Then upload its LPA for the economics review"],
              ["GP users invited", `${contactName} as GP principal; sign-in domain ${domain}`],
              ["Brand approved by the GP", "The GP confirms logos and colours in its portal preview"],
              ...(customDomain ? [["Custom domain verified", `DNS records for ${customDomain}`]] : []),
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 px-5 py-3">
                <span className="num flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-300 text-[10px] text-stone-500">{i + 1}</span>
                <span>
                  <span className="block text-[13px] font-semibold">{t}</span>
                  <span className="block text-[12px] text-stone-500">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-center text-[12px] text-stone-500">Preview: the record is held in this session only. It is stored permanently once the database is connected.</p>
        <div className="flex justify-center gap-2">
          <ButtonLink href="/admin/fund/gps" variant="secondary">
            Back to GPs
          </ButtonLink>
          <Button onClick={() => setSubmitted(false)}>Edit details</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/fund/gps" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> GPs
      </Link>
      <div className="border-b border-stone-200 pb-6">
        <div className="eyebrow">Fund Solution</div>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.015em]">New GP client</h1>
        <p className="mt-1.5 max-w-[680px] text-[14px] text-stone-600">
          Set up a fund manager as a client. Their logos and colours brand the GP portal, the investor portal, notices and reports;
          Aurum appears only as administrator.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setShowErrors(true);
            if (valid) setSubmitted(true);
          }}
        >
          <Section n={1} title="Legal identity" desc="As it appears on the certificate of formation. Used for KYB and the administration agreement.">
            <Field label="Legal name" required error={err("legal")} hint="e.g. Arbor Partners Inc.">
              <input className={input} value={legal} onChange={(e) => setLegal(e.target.value)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Display name" required hint="Shown in portals and on reports. Defaults to the legal name without the entity suffix.">
                <input
                  className={input}
                  value={shown}
                  onChange={(e) => {
                    setDisplayTouched(true);
                    setDisplay(e.target.value);
                  }}
                />
              </Field>
              <Field label="Entity type" required>
                <select className={input} value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                  {["Corporation", "Limited liability company", "Limited partnership", "Other"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Jurisdiction of formation" required error={err("jurisdiction")}>
                <input className={input} placeholder="e.g. Delaware, US" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
              </Field>
              <Field label="Regulatory status" required>
                <select className={input} value={regulatory} onChange={(e) => setRegulatory(e.target.value)}>
                  {["Registered investment adviser (SEC)", "Exempt reporting adviser", "State-registered adviser", "Non-US manager", "Not registered"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section n={2} title="Primary contact" desc="Becomes the first GP principal and receives the portal invitation.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required error={err("contactName")}>
                <input className={input} value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </Field>
              <Field label="Business email" required error={err("contactEmail")} hint={domain ? `GP sign-in domain: ${domain}` : undefined}>
                <input className={input} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section n={3} title="Brand" desc="Transparent SVG or PNG files work best. Both logo versions are required.">
            <div className="grid gap-5 sm:grid-cols-2">
              <LogoDrop
                label="Logo — light backgrounds"
                hint="Dark artwork for white pages, reports and notices."
                surface="#FFFFFF"
                value={logoLight}
                onChange={setLogoLight}
                error={err("logoLight")}
              />
              <LogoDrop
                label="Logo — dark backgrounds"
                hint="Light artwork, shown on your primary colour."
                surface={ok.primary ? primary : "#0B1519"}
                value={logoDark}
                onChange={setLogoDark}
                error={err("logoDark")}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <ColorField label="Primary colour" value={primary} onChange={setPrimary} hint="Buttons, navigation and brand surfaces." />
              <ColorField label="Secondary colour" value={secondary} onChange={setSecondary} hint="Accents: rules, highlights and labels." />
            </div>
            <div className="space-y-2 rounded-[3px] bg-stone-50 p-4">
              <Check2
                ok={textRatio >= 4.5}
                label={`Text on primary: ${ink === "#FFFFFF" ? "white" : "dark"} · ${textRatio.toFixed(1)}:1`}
                detail={textRatio >= 4.5 ? "meets WCAG AA for button and heading text." : "below 4.5:1 — choose a darker or lighter primary."}
              />
              <Check2
                ok={onWhite >= 3}
                label={`Primary on white: ${onWhite.toFixed(1)}:1`}
                detail={onWhite >= 3 ? "visible as links and active states." : "too light to use for navigation on white pages."}
              />
              <Check2
                ok={accentRatio >= 1.5}
                label={`Secondary against primary: ${accentRatio.toFixed(1)}:1`}
                detail={accentRatio >= 1.5 ? "distinct enough to read as an accent." : "too close to the primary to stand out."}
              />
            </div>
          </Section>

          <Section n={4} title="Portal address" desc="Investors sign in here. A custom domain can be added once DNS is verified.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Portal address" required hint="Lowercase letters, numbers and hyphens.">
                <div className="flex items-center rounded-[3px] border border-stone-300 bg-white focus-within:border-ink-900">
                  <input className="h-10 w-full rounded-[3px] px-3 font-mono text-[13px] focus:outline-none" value={slug} onChange={(e) => setSubdomain(slugFrom(e.target.value))} />
                  <span className="whitespace-nowrap pr-3 font-mono text-[12px] text-stone-500">.portal.aurumasset.us</span>
                </div>
              </Field>
              <Field label="Custom domain" hint="Optional, e.g. investors.yourfirm.com">
                <input className={`${input} font-mono`} value={customDomain} onChange={(e) => setCustomDomain(e.target.value.trim().toLowerCase())} />
              </Field>
            </div>
            <div className="text-[12px] text-stone-500">
              Notices are sent as <span className="font-mono text-ink-900">{shown || "Display name"} via Aurum &lt;notices@portal.aurumasset.us&gt;</span>; a sender on the
              GP’s own domain can be configured after DNS verification.
            </div>
          </Section>

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-stone-500">{showErrors && !valid ? "Complete the highlighted fields." : "Fields marked * are required."}</span>
            <Button type="submit" size="lg">
              Create GP client
            </Button>
          </div>
        </form>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Live preview</div>
          <div className="overflow-hidden rounded-[4px] border border-stone-200 bg-white">
            <div className="h-[3px]" style={{ background: ok.secondary ? secondary : "#ddd" }} />
            <div className="flex h-12 items-center gap-5 px-4">
              {logoLight ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoLight.url} alt="" className="max-h-7 max-w-[110px] object-contain" />
              ) : (
                <span className="text-[13px] font-semibold">{shown || "Your logo"}</span>
              )}
              <span className="border-b-2 pb-[13px] pt-[15px] text-[11px] font-semibold" style={{ borderColor: ok.primary ? primary : "#ddd" }}>
                Overview
              </span>
              <span className="text-[11px] text-stone-500">Documents</span>
            </div>
            <div className="border-t border-stone-100 bg-stone-50 px-4 py-4">
              <div className="h-2 w-24 rounded-full bg-stone-200" />
              <div className="mt-3 flex gap-2">
                <span className="rounded-[3px] px-3 py-1.5 text-[11px] font-semibold" style={{ background: ok.primary ? primary : "#0B1519", color: ink }}>
                  Primary action
                </span>
                <span className="rounded-[3px] border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-semibold">Secondary</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[4px] border border-stone-200">
            <div className="grid grid-cols-[1.1fr_1fr]">
              <div className="flex min-h-[170px] flex-col justify-between p-4" style={{ background: ok.primary ? primary : "#0B1519", color: ink }}>
                {logoDark ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoDark.url} alt="" className="max-h-9 max-w-[130px] object-contain" />
                ) : (
                  <span className="text-[13px] font-semibold">{shown || "Logo (dark)"}</span>
                )}
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: ok.secondary ? secondary : undefined }}>
                    Investor Portal
                  </div>
                  <div className="mt-2 text-[9px] opacity-60">Administered by AURUM Asset Management</div>
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="text-[12px] font-semibold">Sign in</div>
                <div className="mt-3 h-6 rounded-[2px] border border-stone-200" />
                <div className="mt-2 h-6 rounded-[2px] border border-stone-200" />
                <div className="mt-3 flex h-7 items-center justify-center rounded-[2px] text-[10px] font-semibold" style={{ background: ok.primary ? primary : "#0B1519", color: ink }}>
                  Continue
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-stone-500">
            Investor sign-in shown with the dark-background logo on the primary colour; portal pages use the light-background logo.
          </p>
        </aside>
      </div>
    </div>
  );
}
