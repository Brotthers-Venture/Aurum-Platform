import type { Metadata } from "next";
import { NewVehicleForm } from "@/components/fund/NewVehicleForm";

export const metadata: Metadata = { title: "New vehicle" };

export default function NewVehiclePage() {
  return <NewVehicleForm />;
}
