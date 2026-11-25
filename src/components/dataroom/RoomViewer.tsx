"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Folder,
  Lock,
  LogOut,
  MessageSquareText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { cx } from "@/components/ui";
import { AurumMark } from "@/components/brand/Logo";
import { TenantName } from "@/components/brand/TenantName";
import { GpLogo } from "@/components/brand/GpLogo";
import { gpById } from "@/lib/gps";
import { pageCount, pageText, type FolderAccess, type Question, type Room, type RoomBrand, type RoomDoc, type RoomSettings, type ShareLink } from "@/lib/dataroom";
import { addLocalQuestion, trackPage } from "@/lib/dataroom-local";
import { ENTRY_TONES, loadRoomBrands } from "@/lib/dataroom-extras";
import { roomCover } from "@/lib/covers";

type Step = "email" | "verify" | "password" | "questions" | "nda" | "room";

const isSheet = (n: string) => /\.(xlsx|csv)$/i.test(n);
const codeFor = (email: string) => {
  let h = 7;
  for (const c of email.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 900_000;
  return String(100_000 + h);
};
const stamp = () => new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

function BrandMark({ brand, light }: { brand: RoomBrand; light?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (brand.logo) return <img src={brand.logo} alt={brand.wordmark} className="h-[26px] w-auto max-w-[180px] object-contain" />;
  const gp = brand.gpId ? gpById(brand.gpId) : undefined;
  if (gp) return <GpLogo gp={gp} height={26} tone={light ? "dark" : "light"} compact />;
  if (brand.wordmark === "Aurum")
    return (
      <span className="flex items-center gap-2">
        <AurumMark size={22} />
        <span className={cx("font-serif text-[19px] tracking-[0.04em]", light ? "text-white" : "text-ink-900")}>AURUM</span>
      </span>
    );
  return (
    <span className="leading-none">
      <span className={cx("block font-serif text-[19px] tracking-[0.02em]", light ? "text-white" : "text-ink-900")}>{brand.wordmark}</span>
      <span className={cx("block text-[9px] font-semibold uppercase tracking-[0.22em]", light ? "text-white/70" : "text-stone-500")}>{brand.tagline}</span>
    </span>
  );
}

/** Repeating diagonal watermark: viewer email, IP and time on every page. */
function Watermark({ text, id }: { text: string; id: string }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <pattern id={`wm-${id}`} width="640" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
          <text x="10" y="90" fontSize="12.5" fontWeight="600" fill="rgba(15,35,64,0.11)" fontFamily="ui-sans-serif, system-ui">
            {text}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#wm-${id})`} />
    </svg>
  );
}

export function RoomViewer({
  room,
  link,
  docs,
  brand: baseBrand,
  ip,
  preview,
  settings,
}: {
  room: Room;
  link: ShareLink;
  docs: RoomDoc[];
  brand: RoomBrand;
  ip: string;
  preview: boolean;
  settings: RoomSettings;
}) {
  const [override, setOverride] = useState<RoomBrand | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverride(loadRoomBrands()[room.id] ?? null);
  }, [room.id]);
  const brand: RoomBrand = override ? { ...baseBrand, ...override, gpId: override.logo ? undefined : baseBrand.gpId } : baseBrand;
  const steps: Step[] = useMemo(
    () => [
      "email",
      ...(link.verifyEmail ? ["verify" as const] : []),
      ...(link.password ? ["password" as const] : []),
      ...(link.questions.length ? ["questions" as const] : []),
      ...(link.nda !== "off" ? ["nda" as const] : []),
      "room",
    ],
    [link],
  );
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const next = () => {
    setErr(null);
    setStep(steps[steps.indexOf(step) + 1]);
  };

  const expired = link.revoked || (link.expires && link.expires < "2026-11-24");
  if (expired)
    return (
      <Shell brand={brand} room={room} settings={settings}>
        <GateCard title={link.revoked ? "Access has been revoked" : "This link has expired"}>
          <p className="text-[13px] text-stone-600">Ask the person who shared it for a new link.</p>
        </GateCard>
      </Shell>
    );

  if (step === "room") return <RoomInside room={room} link={link} docs={docs} brand={brand} email={email} ip={ip} settings={settings} />;

  return (
    <Shell
      brand={brand}
      room={room}
      settings={settings}
      inside={Object.entries(
        docs.filter((d) => (link.folders[d.folder] ?? "view") !== "none").reduce<Record<string, number>>((m, d) => ((m[d.folder] = (m[d.folder] ?? 0) + 1), m), {}),
      ).map(([folder, n]) => ({ folder, n }))}
      notes={["Every visit is logged", ...(link.watermark ? ["Pages carry your name"] : []), link.download ? "Downloads allowed" : "View only"]}
      demo={step === "verify" ? `Email isn’t connected yet — the code for ${email} is ${codeFor(email)}` : preview ? "Preview — this is exactly what your viewers see" : undefined}
    >
      <StepDots steps={steps.slice(0, -1)} current={step} />
      {step === "email" && (
        <EmailGate
          link={link}
          room={room}
          err={err}
          onSubmit={(e) => {
            const v = e.trim().toLowerCase();
            const domain = v.split("@")[1] ?? "";
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return setErr("Enter a valid email address.");
            if (link.blockDomains.includes(domain)) return setErr("Please use your work email — personal addresses can’t open this room.");
            if (link.allowDomains.length && !link.allowDomains.includes(domain)) return setErr("This room is limited to approved organisations.");
            if (link.mode === "invite" && !link.invited.includes(v)) return setErr("This email hasn’t been invited. Ask the sender for access.");
            setEmail(v);
            next();
          }}
        />
      )}
      {step === "verify" && (
        <CodeGate
          email={email}
          err={err}
          onBack={() => setStep("email")}
          onSubmit={(c) => (c === codeFor(email) ? next() : setErr("That code doesn’t match. Check the latest email."))}
        />
      )}
      {step === "password" && <PasswordGate err={err} onSubmit={(p) => (p === link.password ? next() : setErr("Incorrect password."))} />}
      {step === "questions" && <QuestionsGate questions={link.questions} onSubmit={next} />}
      {step === "nda" && <NdaGate mode={link.nda} brand={brand} room={room} email={email} onSubmit={next} />}
    </Shell>
  );
}

/* ───────────────────────── entry ───────────────────────── */

function Shell({
  brand,
  room,
  settings,
  demo,
  inside,
  notes,
  children,
}: {
  brand: RoomBrand;
  room: Room;
  settings: RoomSettings;
  demo?: string;
  inside?: { folder: string; n: number }[];
  notes?: string[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {demo && <div className="bg-ink-900 px-4 py-2 text-center text-[12px] font-medium text-white">{demo}</div>}
      <div className="grid flex-1 lg:grid-cols-[minmax(380px,44%)_1fr]">
        {/* sponsor panel */}
        <aside className="relative overflow-hidden text-white" style={{ background: brand.primary }}>
          {settings.showCover &&
            (brand.banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={roomCover(room)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ))}
          {settings.showCover && (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to top, ${brand.primary} 0%, ${brand.primary}EB 38%, ${brand.primary}66 70%, ${brand.primary}1A 100%)` }}
            />
          )}
          <div className="relative flex h-full flex-col px-10 py-9 lg:px-14">
            {settings.showLogo ? <BrandMark brand={brand} light /> : <span />}
            <div className="mt-16 lg:mt-auto">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">{room.purpose}</div>
              <h1 className="mt-2 max-w-[440px] text-[32px] font-semibold leading-[1.15] tracking-[-0.015em]">{room.name}</h1>
              {inside && inside.length > 0 && (
                <div className="mt-8 max-w-[420px] border-t border-white/20 pt-5">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/60">What’s inside</div>
                  <ul className="mt-3 space-y-2 text-[13.5px]">
                    {inside.map((f, i) => (
                      <li key={f.folder} className="flex items-baseline gap-3">
                        <span className="num w-5 text-white/50">{i + 1}</span>
                        <span className="flex-1">{f.folder.replace(/^\d+ /, "")}</span>
                        <span className="num text-[12px] text-white/60">
                          {f.n} {f.n === 1 ? "file" : "files"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-10 lg:mt-12">
              {notes && (
                <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-white/70">
                  {notes.map((n) => (
                    <li key={n} className="flex items-center gap-1.5">
                      <ShieldCheck size={12} /> {n}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
        {/* steps */}
        <main
          className={cx("flex flex-col", brand.entry && (brand.entry === "slate" || brand.entry === "dark" ? "ws ws-bridge" : "ws ws-light ws-bridge"))}
          style={brand.entry ? { background: ENTRY_TONES.find((t) => t.id === brand.entry)?.bg } : undefined}
        >
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <div className="w-full max-w-[420px]">{children}</div>
          </div>
          <footer className="flex items-center justify-center gap-2 pb-6 text-[11px] text-stone-400">
            <Lock size={11} /> Secured by <AurumMark size={11} /> <TenantName />
          </footer>
        </main>
      </div>
    </div>
  );
}

function GateCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-[-0.015em] text-ink-900">{title}</h2>
      {sub && <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{sub}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

const input = "h-11 w-full rounded-[10px] border border-stone-300 bg-white px-3.5 text-[14px] text-ink-900 placeholder:text-stone-400 focus:border-ink-900 focus:outline-none";
const primary = "flex h-11 w-full items-center justify-center rounded-[10px] bg-ink-900 text-[14px] font-semibold text-white hover:bg-ink-700 disabled:opacity-40";
const Err = ({ e }: { e: string | null }) => (e ? <p className="mt-2 text-[12.5px] text-[#9A4422]">{e}</p> : null);

function EmailGate({ link, room, err, onSubmit }: { link: ShareLink; room: Room; err: string | null; onSubmit: (e: string) => void }) {
  const [v, setV] = useState("");
  return (
    <GateCard title="Enter the data room" sub={link.welcome}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(v);
        }}
      >
        <label className="mb-1.5 block text-[12px] font-semibold text-stone-600">Work email</label>
        <input autoFocus type="email" value={v} onChange={(e) => setV(e.target.value)} placeholder="you@company.com" className={input} />
        <Err e={err} />
        <button className={cx(primary, "mt-4")}>Continue</button>
      </form>
      <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-stone-500">
        <ShieldCheck size={14} className="mt-px shrink-0" /> Access is logged. Documents stay in this secure viewer{link.download ? "" : " and can’t be downloaded"}. Open until{" "}
        {new Date(`${room.expires}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}.
      </p>
    </GateCard>
  );
}

function CodeGate({ email, err, onBack, onSubmit }: { email: string; err: string | null; onBack: () => void; onSubmit: (c: string) => void }) {
  const [d, setD] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length > 1) {
      const all = digits.slice(0, 6).split("");
      setD([...all, ...Array(6 - all.length).fill("")]);
      refs.current[Math.min(all.length, 5)]?.focus();
      if (all.length === 6) onSubmit(all.join(""));
      return;
    }
    const nd = [...d];
    nd[i] = digits;
    setD(nd);
    if (digits && i < 5) refs.current[i + 1]?.focus();
    if (nd.every(Boolean)) onSubmit(nd.join(""));
  };
  return (
    <GateCard title="Check your email" sub={`We sent a 6-digit code to ${email}.`}>
      <div className="flex justify-between gap-2">
        {d.map((x, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={x}
            inputMode="numeric"
            autoFocus={i === 0}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => e.key === "Backspace" && !x && i > 0 && refs.current[i - 1]?.focus()}
            aria-label={`Digit ${i + 1}`}
            className="num h-14 w-full rounded-[10px] border border-stone-300 text-center text-[22px] font-semibold text-ink-900 focus:border-ink-900 focus:outline-none"
          />
        ))}
      </div>
      <Err e={err} />
      <button onClick={onBack} className="mt-4 text-[12.5px] font-semibold text-stone-500 hover:text-ink-900">
        Use a different email
      </button>
    </GateCard>
  );
}

function PasswordGate({ err, onSubmit }: { err: string | null; onSubmit: (p: string) => void }) {
  const [v, setV] = useState("");
  return (
    <GateCard title="Password required" sub="The sender protected this room with a password.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(v);
        }}
      >
        <input autoFocus type="password" value={v} onChange={(e) => setV(e.target.value)} placeholder="Password" className={input} />
        <Err e={err} />
        <button className={cx(primary, "mt-4")}>Continue</button>
      </form>
    </GateCard>
  );
}

function QuestionsGate({ questions, onSubmit }: { questions: string[]; onSubmit: () => void }) {
  const [a, setA] = useState<string[]>(questions.map(() => ""));
  return (
    <GateCard title="A few details" sub="The sender asks every visitor these before entry.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
      >
        {questions.map((q, i) => (
          <label key={q} className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-stone-600">{q}</span>
            <input required value={a[i]} onChange={(e) => setA((x) => x.map((y, j) => (j === i ? e.target.value : y)))} className={input} />
          </label>
        ))}
        <button className={cx(primary, "mt-2")}>Continue</button>
      </form>
    </GateCard>
  );
}

function NdaGate({ mode, brand, room, email, onSubmit }: { mode: "acknowledge" | "esign" | "off"; brand: RoomBrand; room: Room; email: string; onSubmit: () => void }) {
  const [read, setRead] = useState(false);
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState("");
  const ok = agree && (mode !== "esign" || name.trim().split(/\s+/).length >= 2);
  return (
    <GateCard title="Confidentiality agreement" sub={mode === "esign" ? "Please read and sign before entering." : "Please read and accept before entering."}>
      <div
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setRead(true);
        }}
        className="h-[220px] space-y-3 overflow-y-auto rounded-[10px] border border-stone-200 bg-stone-50 p-4 text-[12.5px] leading-relaxed text-stone-700"
      >
        <p className="font-semibold text-ink-900">Non-disclosure agreement — {room.name}</p>
        <p>
          You are receiving confidential information about {room.name} from {brand.wordmark} and its administrator, <TenantName legal /> (“Disclosing Parties”), for the sole
          purpose of evaluating a potential transaction.
        </p>
        <p>1. You will keep the information confidential and use it only for that purpose. You may share it with your advisers who need it and are bound by equivalent duties.</p>
        <p>2. You will not copy, photograph, record or redistribute the information, and will not attempt to remove or obscure watermarks.</p>
        <p>3. Information that is public, already known to you, or independently developed is not confidential.</p>
        <p>4. On request you will destroy any notes containing the information. Your obligations last two years from today.</p>
        <p>5. Your access, the pages you read and the time spent are recorded.</p>
        <p className="text-stone-500">Sample wording for the platform demo — each room uses the NDA its sponsor provides.</p>
      </div>
      {!read && <p className="mt-2 text-[11.5px] text-stone-500">Scroll to the end to continue.</p>}
      <label className={cx("mt-3 flex items-start gap-2 text-[13px]", read ? "text-ink-900" : "text-stone-400")}>
        <input type="checkbox" disabled={!read} checked={agree} onChange={() => setAgree((x) => !x)} className="mt-0.5 h-4 w-4" />I have read and agree to these terms on behalf of
        myself and my organisation.
      </label>
      {mode === "esign" && (
        <div className="mt-3">
          <label className="mb-1.5 block text-[12px] font-semibold text-stone-600">Type your full name to sign</label>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!read} placeholder="Full name" className={cx(input, "font-serif text-[18px]")} />
          {name.trim() && (
            <p className="mt-1.5 text-[11px] text-stone-500">
              Signed electronically by {name.trim()} ({email}) · {stamp()}
            </p>
          )}
        </div>
      )}
      <button disabled={!ok} onClick={onSubmit} className={cx(primary, "mt-4")}>
        {mode === "esign" ? "Sign and enter" : "Accept and enter"}
      </button>
    </GateCard>
  );
}

const STEP_LABEL: Record<string, string> = { email: "Email", verify: "Code", password: "Password", questions: "About you", nda: "Agreement" };
function StepDots({ steps, current }: { steps: Step[]; current: Step }) {
  if (steps.length < 2) return null;
  const i = steps.indexOf(current);
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 whitespace-nowrap text-[11.5px]">
      {steps.map((s, j) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={cx(
              "flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-bold",
              j < i ? "bg-ink-900 text-white" : j === i ? "border-2 border-ink-900 text-ink-900" : "border border-stone-300 text-stone-400",
            )}
          >
            {j < i ? "✓" : j + 1}
          </span>
          <span className={cx(j === i ? "font-semibold text-ink-900" : "text-stone-500")}>{STEP_LABEL[s] ?? s}</span>
          {j < steps.length - 1 && <span className="h-px w-5 bg-stone-300" />}
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────── inside the room ───────────────────────── */

function RoomInside({
  room,
  link,
  docs,
  brand,
  email,
  ip,
  settings,
}: {
  room: Room;
  link: ShareLink;
  docs: RoomDoc[];
  brand: RoomBrand;
  email: string;
  ip: string;
  settings: RoomSettings;
}) {
  const access = (d: RoomDoc): FolderAccess => {
    const a = link.folders[d.folder] ?? "view";
    if (a === "none") return "none";
    return link.download && (a === "download" || a === "upload") ? "download" : "view";
  };
  const visible = docs.filter((d) => access(d) !== "none");
  const folders = [...new Set(visible.map((d) => d.folder))];
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(folders.map((f) => [f, true])));
  const [docId, setDocId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [shield, setShield] = useState(false);
  const [asking, setAsking] = useState(false);
  const [mine, setMine] = useState<Question[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const doc = visible.find((d) => d.id === docId);
  const pages = doc ? pageCount(doc.name) : 0;
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const [wmTime] = useState(stamp);
  const wm = `${email} · ${ip} · ${wmTime} · Confidential`;
  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };

  // Screenshot protection: hide content whenever the window loses focus or a capture shortcut is pressed.
  useEffect(() => {
    if (!link.screenshot && link.print) return;
    const hide = () => link.screenshot && setShield(true);
    const onVis = () => document.visibilityState === "hidden" && hide();
    const onKey = (e: KeyboardEvent) => {
      if (link.screenshot && (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && ["3", "4", "5", "s", "S"].includes(e.key)))) {
        e.preventDefault();
        setShield(true);
      }
      if (!link.print && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setToast("Printing is turned off for this room");
        setTimeout(() => setToast(null), 2600);
      }
    };
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKey);
    };
  }, [link.screenshot, link.print]);

  // Page tracking: the most visible page accrues a second while the window is in focus.
  useEffect(() => {
    if (!doc) return;
    const ratios = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(Number((e.target as HTMLElement).dataset.page), e.intersectionRatio);
        let best = 1;
        let r = -1;
        ratios.forEach((v, k) => v > r && ((r = v), (best = k)));
        setPage(best);
      },
      { root: scroller.current, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    pageRefs.current.forEach((el) => el && io.observe(el));
    let current = 1;
    const unsub = setInterval(() => {
      if (!document.hasFocus()) return;
      let r = -1;
      ratios.forEach((v, k) => v > r && ((r = v), (current = k)));
      trackPage(doc.id, email, "", current, 1);
    }, 1000);
    return () => {
      io.disconnect();
      clearInterval(unsub);
    };
  }, [doc, email, zoom]);

  const goPage = (n: number) => pageRefs.current[n - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const results = q ? visible.filter((d) => d.name.toLowerCase().includes(q.toLowerCase())) : null;
  const firstOf = folders.map((f) => visible.find((d) => d.folder === f)!);

  return (
    <div
      className={cx("flex h-screen flex-col bg-stone-100", !link.print && "vdr-noprint", link.screenshot && "select-none")}
      onContextMenu={(e) => link.screenshot && e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="vdr-print-msg hidden p-10 text-center text-[16px]">Printing is turned off for this data room.</div>
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-stone-200 bg-white px-5">
        <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: brand.secondary }} />
        {settings.showLogo && (
          <>
            <BrandMark brand={brand} />
            <span className="h-6 w-px bg-stone-200" />
          </>
        )}
        <span className="truncate text-[14px] font-semibold text-ink-900">{room.name}</span>
        <div className="ml-auto flex items-center gap-3">
          {settings.visitorQa && (
            <button
              onClick={() => setAsking(true)}
              className="flex h-9 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold text-white"
              style={{ background: brand.primary }}
            >
              <MessageSquareText size={15} /> Ask a question
            </button>
          )}
          <span className="hidden items-center gap-2 rounded-full bg-stone-100 py-1 pl-1 pr-3 text-[12px] text-stone-600 md:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: brand.primary }}>
              {email[0]?.toUpperCase()}
            </span>
            {email}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-stone-400 hover:bg-stone-100 hover:text-ink-900"
            aria-label="Leave room"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="scroll-quiet flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-white">
          <div className="p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search documents"
                className="h-9 w-full rounded-[9px] border border-stone-200 bg-stone-50 pl-8 pr-3 text-[13px] focus:border-ink-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => setDocId(null)}
            className={cx(
              "mx-2 flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[13px]",
              !doc ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-600 hover:bg-stone-50",
            )}
          >
            <ShieldCheck size={14} style={{ color: brand.primary }} /> Welcome
          </button>
          <nav className="flex-1 px-2 pb-6 pt-1">
            {(results ? [["Results", results] as const] : folders.map((f) => [f, visible.filter((d) => d.folder === f)] as const)).map(([f, list]) => (
              <div key={f} className="mt-2">
                {!results && (
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [f]: !o[f] }))}
                    className="flex w-full items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-left text-[12.5px] font-semibold text-ink-900 hover:bg-stone-50"
                  >
                    {open[f] ? <ChevronDown size={13} className="text-stone-400" /> : <ChevronRight size={13} className="text-stone-400" />}
                    <Folder size={14} className="text-stone-500" />
                    <span className="truncate">{settings.indexNumbers ? f.replace(/^(\d+) /, "$1  ") : f.replace(/^\d+ /, "")}</span>
                  </button>
                )}
                {(results || open[f]) &&
                  list.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDocId(d.id);
                        setPage(1);
                        scroller.current?.scrollTo({ top: 0 });
                      }}
                      className={cx(
                        "flex w-full items-center gap-2 rounded-[8px] py-1.5 pl-7 pr-2 text-left text-[12.5px]",
                        docId === d.id ? "bg-stone-100 font-semibold text-ink-900" : "text-stone-600 hover:bg-stone-50",
                      )}
                    >
                      {settings.indexNumbers && <span className="num w-7 shrink-0 text-[11px] text-stone-400">{d.index}</span>}
                      <span className="min-w-0 flex-1 truncate">{d.name.replace(/\.[a-z]+$/i, "")}</span>
                      {access(d) === "view" && <Lock size={11} className="shrink-0 text-stone-300" aria-label="View only" />}
                    </button>
                  ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col">
          {!doc ? (
            <div className="flex-1 overflow-y-auto">
              <div className="relative h-[180px] overflow-hidden" style={{ background: brand.primary }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.banner ?? roomCover(room)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <div className="absolute bottom-4 left-8 text-white">
                  <div className="text-[20px] font-semibold tracking-[-0.01em]">{room.name}</div>
                  <div className="text-[12px] text-white/80">Updated {new Date(room.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
              </div>
              <div className="mx-auto max-w-[760px] px-8 py-10">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: brand.primary }}>
                  {room.purpose}
                </div>
                <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.015em] text-ink-900">{room.name}</h1>
                <p className="mt-3 text-[15px] leading-relaxed text-stone-600">{link.welcome || brand.welcome}</p>
                <div className="mt-6 flex flex-wrap gap-2 text-[12px] text-stone-600">
                  <Chip>{visible.length} documents</Chip>
                  <Chip>{folders.length} folders</Chip>
                  {link.watermark && <Chip>Watermarked to you</Chip>}
                  {!link.download && <Chip>View only</Chip>}
                </div>
                <h2 className="mb-3 mt-9 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Start here</h2>
                <div className="grid grid-cols-2 gap-3">
                  {firstOf.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDocId(d.id)}
                      className="flex items-center gap-3 rounded-[14px] border border-stone-200 bg-white p-4 text-left shadow-card transition-shadow hover:shadow-lift"
                    >
                      {isSheet(d.name) ? <FileSpreadsheet size={20} className="text-[#1F6F6A]" /> : <FileText size={20} className="text-[#B5542A]" />}
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-semibold text-ink-900">{d.name.replace(/\.[a-z]+$/i, "")}</span>
                        <span className="block text-[11.5px] text-stone-500">
                          {d.folder.replace(/^\d+ /, "")} · {pageCount(d.name)} pages
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex h-12 shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-4">
                <button
                  onClick={() => setDocId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-stone-500 hover:bg-stone-100"
                  aria-label="Back to welcome"
                >
                  <ArrowLeft size={16} />
                </button>
                {settings.indexNumbers && <span className="num text-[11px] text-stone-400">{doc.index}</span>}
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-900">{doc.name}</span>
                <span className="num text-[12px] text-stone-500">
                  Page {page} of {pages}
                </span>
                <div className="flex items-center rounded-[8px] border border-stone-200">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
                    className="flex h-7 w-7 items-center justify-center text-stone-500 hover:text-ink-900"
                    aria-label="Zoom out"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="num w-10 text-center text-[11px] text-stone-600">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
                    className="flex h-7 w-7 items-center justify-center text-stone-500 hover:text-ink-900"
                    aria-label="Zoom in"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                {access(doc) === "download" ? (
                  <button
                    onClick={() => flash(`Downloading a watermarked copy of ${doc.name}`)}
                    className="flex h-8 items-center gap-1.5 rounded-[8px] border border-stone-200 px-2.5 text-[12px] font-semibold text-ink-900 hover:border-stone-400"
                  >
                    <Download size={13} /> Download
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[11.5px] text-stone-400">
                    <Lock size={12} /> View only
                  </span>
                )}
              </div>
              <div className="flex min-h-0 flex-1">
                <div ref={scroller} className="relative flex-1 overflow-y-auto px-6 py-6">
                  <div className="mx-auto space-y-5" style={{ width: 720 * zoom }}>
                    {Array.from({ length: pages }, (_, i) => (
                      <div
                        key={`${doc.id}-${i}`}
                        ref={(el) => {
                          pageRefs.current[i] = el;
                        }}
                        data-page={i + 1}
                        className="relative overflow-hidden bg-white shadow-card"
                        style={{ aspectRatio: isSheet(doc.name) ? "1.414 / 1" : "1 / 1.294" }}
                      >
                        <PageBody doc={doc} page={i + 1} pages={pages} brand={brand} zoom={zoom} />
                        {link.watermark && <Watermark text={wm} id={`${doc.id}-${i}`} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="scroll-quiet hidden w-[120px] shrink-0 overflow-y-auto border-l border-stone-200 bg-white p-3 lg:block">
                  {Array.from({ length: pages }, (_, i) => (
                    <button key={i} onClick={() => goPage(i + 1)} className="mb-3 block w-full text-center">
                      <span
                        className={cx("block bg-white shadow-card ring-2", page === i + 1 ? "" : "ring-transparent")}
                        style={{ aspectRatio: isSheet(doc.name) ? "1.414/1" : "1/1.294", ...(page === i + 1 ? { ["--tw-ring-color" as string]: brand.primary } : {}) }}
                      >
                        <span className="block space-y-1 p-2">
                          <span className="block h-1 w-2/3 rounded bg-stone-300" />
                          <span className="block h-0.5 w-full rounded bg-stone-200" />
                          <span className="block h-0.5 w-5/6 rounded bg-stone-200" />
                          <span className="block h-0.5 w-full rounded bg-stone-200" />
                        </span>
                      </span>
                      <span className="num mt-1 block text-[10.5px] text-stone-500">{i + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {shield && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-100/80 backdrop-blur-xl">
              <div className="text-center">
                <EyeOff size={26} className="mx-auto text-stone-500" />
                <p className="mt-3 text-[15px] font-semibold text-ink-900">Content hidden</p>
                <p className="mt-1 text-[13px] text-stone-600">This room is protected against screenshots and screen sharing.</p>
                <button onClick={() => setShield(false)} className="mt-4 h-9 rounded-[10px] px-4 text-[13px] font-semibold text-white" style={{ background: brand.primary }}>
                  Continue reading
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {asking && (
        <AskPanel
          brand={brand}
          doc={doc}
          page={page}
          mine={mine}
          onClose={() => setAsking(false)}
          onAsk={(text, ref) => {
            const qn: Question = {
              id: `lq${Date.now()}`,
              roomId: room.id,
              from: email,
              firm: email.split("@")[1] ?? "",
              at: new Date().toISOString(),
              text,
              docIndex: ref ? doc?.index : undefined,
              page: ref ? page : undefined,
              status: "Open",
            };
            setMine((m) => [qn, ...m]);
            addLocalQuestion(qn);
          }}
        />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[12px] bg-ink-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lift">{toast}</div>}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-stone-200 bg-white px-3 py-1">{children}</span>;
}

function PageBody({ doc, page, pages, brand, zoom }: { doc: RoomDoc; page: number; pages: number; brand: RoomBrand; zoom: number }) {
  const t = pageText(doc.name, page);
  const fs = (n: number) => ({ fontSize: n * zoom });
  if (isSheet(doc.name)) {
    const cols = ["", "2023", "2024", "2025", "2026E", "2027E"];
    const rows = ["Revenue", "Operating expenses", "Net operating income", "Capital expenditure", "Debt service", "Cash flow", "Occupancy", "Distributions"];
    return (
      <div className="h-full p-[5%]" style={fs(11)}>
        <div className="mb-3 font-semibold text-ink-900" style={fs(13)}>
          {doc.name.replace(/\.[a-z]+$/i, "")} — Sheet {page}
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c} className="border border-stone-200 bg-stone-50 px-2 py-1 text-right font-semibold text-stone-600 first:text-left">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r}>
                <td className="border border-stone-200 px-2 py-1 text-ink-900">{r}</td>
                {cols.slice(1).map((c, j) => (
                  <td key={c} className="num border border-stone-200 px-2 py-1 text-right text-stone-700">
                    {r === "Occupancy" ? `${91 + ((i + j) % 6)}%` : ((i + 2) * 1_237 + j * 311 + page * 97).toLocaleString("en-US")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col px-[9%] py-[8%] text-stone-700">
      <div className="flex items-center justify-between border-b pb-2 uppercase tracking-[0.16em] text-stone-400" style={{ ...fs(8.5), borderColor: brand.secondary }}>
        <span>{brand.wordmark}</span>
        <span>Confidential</span>
      </div>
      {page === 1 ? (
        <div className="flex flex-1 flex-col justify-center">
          <div className="font-serif text-ink-900" style={fs(30)}>
            {t.heading}
          </div>
          <div className="mt-3 h-[3px] w-16" style={{ background: brand.secondary }} />
          <div className="mt-4 text-stone-500" style={fs(12)}>
            {t.body.join(" ")}
          </div>
        </div>
      ) : (
        <div className="mt-[6%] flex-1 space-y-[3%]">
          <div className="font-semibold text-ink-900" style={fs(15)}>
            {t.heading}
          </div>
          {t.body.map((p, i) => (
            <p key={i} className="leading-relaxed" style={fs(11.5)}>
              {p}
            </p>
          ))}
        </div>
      )}
      <div className="num mt-auto flex justify-between pt-2 text-stone-400" style={fs(9)}>
        <span>{doc.name.replace(/\.[a-z]+$/i, "")}</span>
        <span>
          {page} / {pages}
        </span>
      </div>
    </div>
  );
}

function AskPanel({
  brand,
  doc,
  page,
  mine,
  onClose,
  onAsk,
}: {
  brand: RoomBrand;
  doc?: RoomDoc;
  page: number;
  mine: Question[];
  onClose: () => void;
  onAsk: (text: string, ref: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [ref, setRef] = useState(!!doc);
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/20" onClick={onClose}>
      <aside className="flex h-full w-[420px] flex-col bg-white shadow-lift" onClick={(e) => e.stopPropagation()} aria-label="Questions">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-[16px] font-semibold text-ink-900">Questions</h2>
          <button onClick={onClose} className="rounded-[8px] p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onAsk(text.trim(), ref && !!doc);
            setText("");
          }}
          className="space-y-3 border-b border-stone-100 p-5"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Ask the sponsor about anything in this room"
            className="w-full resize-none rounded-[10px] border border-stone-300 px-3 py-2 text-[13.5px] focus:border-ink-900 focus:outline-none"
          />
          {doc && (
            <label className="flex items-center gap-2 text-[12.5px] text-stone-600">
              <input type="checkbox" checked={ref} onChange={() => setRef((r) => !r)} /> About {doc.index} {doc.name.replace(/\.[a-z]+$/i, "")}, page {page}
            </label>
          )}
          <button className="h-10 w-full rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40" disabled={!text.trim()} style={{ background: brand.primary }}>
            Send question
          </button>
          <p className="text-[11.5px] text-stone-500">Answers are reviewed by the sponsor before they’re released to you.</p>
        </form>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {mine.length === 0 && <p className="text-[12.5px] text-stone-400">Your questions and their answers will appear here.</p>}
          {mine.map((qn) => (
            <div key={qn.id} className="rounded-[12px] border border-stone-200 p-3.5">
              <p className="text-[13px] text-ink-900">{qn.text}</p>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-stone-500">
                <Check size={11} /> Sent{qn.docIndex ? ` · re ${qn.docIndex}, page ${qn.page}` : ""} · waiting for an answer
              </p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
