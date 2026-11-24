import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileUp, ShieldCheck } from "lucide-react";
import { EconomicsReview } from "@/components/fund/EconomicsReview";
import { reviews } from "@/lib/lpa/review";
import { fundById, funds } from "@/lib/data";

export function generateStaticParams() {
  return funds.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `LPA review — ${fundById(id)?.shortName ?? "Fund"}` };
}

export default async function EconomicsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = fundById(id);
  if (!f) notFound();
  const review = reviews[id];
  if (review) return <EconomicsReview review={review} fundName={f.name} />;

  return (
    <div className="space-y-6">
      <Link href={`/admin/fund/funds/${f.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-ink-900">
        <ArrowLeft size={14} strokeWidth={1.8} /> {f.name}
      </Link>
      <div className="border-b border-stone-200 pb-6">
        <div className="eyebrow">Fund economics</div>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.015em]">LPA review</h1>
      </div>
      <div className="rounded-[4px] border border-dashed border-stone-300 bg-white px-8 py-14 text-center">
        <FileUp size={26} strokeWidth={1.4} className="mx-auto text-stone-400" />
        <h2 className="mt-4 text-[17px] font-semibold">Upload the LPA to set this fund’s economics</h2>
        <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-relaxed text-stone-600">
          Add the LPA, its amendments and any side letters as PDFs. The review reads share classes, fees, hurdle, catch-up, carry,
          waterfall, closings and expense terms, quotes the clause behind each, and leaves anything the documents do not state blank.
        </p>
        <div className="mt-6 inline-flex h-10 cursor-not-allowed items-center rounded-[3px] bg-stone-200 px-5 text-[13px] font-semibold text-stone-500">
          Choose PDF files
        </div>
        <p className="mt-3 text-[12px] text-stone-500">Available once document storage and the review service are connected.</p>
      </div>
      <div className="flex items-start gap-2 text-[12px] text-stone-500">
        <ShieldCheck size={14} strokeWidth={1.8} className="mt-px shrink-0" />
        Current economics for this fund were entered manually and remain in force until a review is approved by Aurum and the GP.
      </div>
    </div>
  );
}
