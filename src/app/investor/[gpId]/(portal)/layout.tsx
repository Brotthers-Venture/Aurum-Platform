import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { BrandedHeader } from "@/components/gp/BrandedHeader";
import { BrandedFooter } from "@/components/gp/BrandedFooter";
import { brandStyle, gpById, gps } from "@/lib/gps";
import { fundsForGp } from "@/lib/gpData";

export function generateStaticParams() {
  return gps.map((g) => ({ gpId: g.id }));
}

export default function InvestorPortalLayout({ children, params }: { children: ReactNode; params: Promise<{ gpId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Shell params={params}>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children, params }: { children: ReactNode; params: Promise<{ gpId: string }> }) {
  const { gpId } = await params;
  const gp = gpById(gpId);
  if (!gp) notFound();
  const base = `/investor/${gp.id}`;
  return (
    <div className="ws ws-light ws-bridge ws-portal min-h-dvh bg-d-bg" style={brandStyle(gp.brand)}>
      <BrandedHeader
        gp={gp}
        nav={[
          { href: base, label: "Overview", exact: true },
          { href: `${base}/documents`, label: "Documents" },
          { href: `${base}/subscriptions`, label: "Subscriptions" },
          { href: `${base}/messages`, label: "Messages" },
          { href: `${base}/profile`, label: "Profile" },
        ]}
        userName="Margaret Calloway"
        userTitle="Calloway Family Trust"
        right={
          <span className="hidden items-center gap-2 rounded-[3px] border border-stone-200 px-3 py-1.5 lg:flex">
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Investing entity</span>
              <span className="block text-[12px] font-semibold">Calloway Family Trust</span>
            </span>
            <ChevronDown size={14} className="text-stone-400" />
          </span>
        }
      />
      {children}
      <BrandedFooter gp={gp} preview={gp.sample || fundsForGp(gp.id).some((f) => f.economicsPending)} />
    </div>
  );
}
