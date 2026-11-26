import type { Metadata } from "next";
import { Suspense } from "react";
import { MyWork } from "@/components/offering/MyWork";

export const metadata: Metadata = { title: "My work" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MyWork />
    </Suspense>
  );
}
