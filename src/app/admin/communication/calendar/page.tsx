import type { Metadata } from "next";
import { Suspense } from "react";
import { ModulePage } from "@/components/firm/ModulePage";
import { ConcourseCalendar } from "@/components/concourse/ConcourseCalendar";

export const metadata: Metadata = { title: "Calendar — Concourse" };

export default function Page() {
  return (
    <ModulePage context="Concourse" wide>
      <Suspense fallback={null}>
        <ConcourseCalendar />
      </Suspense>
    </ModulePage>
  );
}
