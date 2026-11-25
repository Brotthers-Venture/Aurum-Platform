import Link from "next/link";
import { TenantName } from "@/components/brand/TenantName";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { AurumMark } from "@/components/brand/Logo";
import { solutionById, solutions } from "@/lib/solutions";

export function generateStaticParams() {
  return solutions.filter((s) => !s.live).map((s) => ({ solution: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ solution: string }> }) {
  const { solution } = await params;
  return { title: solutionById(solution)?.name ?? "Solution" };
}

export default async function ComingSoon({ params }: { params: Promise<{ solution: string }> }) {
  const { solution } = await params;
  const s = solutionById(solution);
  if (!s || s.live) notFound();

  return (
    <AppShell context={s.name}>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-8 py-10">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
          <ArrowLeft size={14} strokeWidth={1.8} /> <TenantName /> Platform
        </Link>
        <div className="mt-10 grid gap-12 md:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">In development</div>
            <h1 className="mt-4 font-serif text-[44px] leading-[1.08] tracking-[-0.01em] text-ink-900">{s.name}</h1>
            <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-stone-600">{s.summary}</p>
            <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-stone-500">
              This solution will share the platform’s client records, entity registry, document vault and permission
              model with Fund Solution. Planned modules are listed below.
            </p>
            <ol className="mt-10 grid border-t border-stone-200 sm:grid-cols-2">
              {s.modules.map((m, i) => (
                <li key={m} className="flex items-baseline gap-4 border-b border-stone-200 py-4 sm:odd:pr-6 sm:even:pl-6 sm:even:border-l">
                  <span className="num text-[12px] text-stone-400">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px] font-medium text-ink-900">{m}</span>
                </li>
              ))}
            </ol>
          </div>
          <aside className="self-start rounded-[8px] border border-stone-200/70 bg-white shadow-card p-6">
            <AurumMark size={26} />
            <h2 className="mt-5 text-[15px] font-semibold text-ink-900">Fund Solution is available now</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-stone-600">
              Fund administration and investor onboarding are live on the platform today.
            </p>
            <Link
              href="/admin/fund"
              className="mt-5 inline-flex h-9 items-center rounded-[3px] bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-700"
            >
              Open Fund Solution
            </Link>
            <div className="mt-6 border-t border-stone-100 pt-4 text-[12px] text-stone-500">
              Other solutions:{" "}
              {solutions
                .filter((x) => x.id !== s.id && !x.live)
                .map((x, i, arr) => (
                  <span key={x.id}>
                    <Link href={x.href} className="text-ink-900 underline-offset-4 hover:underline">
                      {x.name.replace(" Solution", "")}
                    </Link>
                    {i < arr.length - 1 ? ", " : ""}
                  </span>
                ))}
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
