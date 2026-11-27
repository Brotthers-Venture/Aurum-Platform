import { Suspense } from "react";
import { notFound } from "next/navigation";
import { EntranceSignIn } from "@/components/auth/EntranceSignIn";
import { AURUM } from "@/lib/brand";
import { entrances } from "@/lib/entrances";

/** /enter/investor, /enter/client, /enter/client/<company>, /enter/<solution> */
const doors = () => entrances(AURUM).filter((e) => e.path.startsWith("/enter/"));
const idFor = (slug: string[]) => doors().find((e) => e.path === `/enter/${slug.join("/")}`)?.id;

export function generateStaticParams() {
  return doors().map((e) => ({ door: e.path.replace("/enter/", "").split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ door: string[] }> }) {
  const { door } = await params;
  const e = doors().find((x) => x.id === idFor(door));
  return { title: e ? `${e.name} — Sign in` : "Sign in" };
}

export default function Page({ params }: { params: Promise<{ door: string[] }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: { params: Promise<{ door: string[] }> }) {
  const id = idFor((await params).door);
  if (!id) notFound();
  return <EntranceSignIn id={id} />;
}
