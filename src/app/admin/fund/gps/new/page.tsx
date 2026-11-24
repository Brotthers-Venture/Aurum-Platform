import type { Metadata } from "next";
import { NewGpForm } from "@/components/fund/NewGpForm";

export const metadata: Metadata = { title: "New GP client" };

export default function NewGpPage() {
  return <NewGpForm />;
}
