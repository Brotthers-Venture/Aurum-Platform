import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountsRegister } from "@/components/banking/Accounts";

export const metadata: Metadata = { title: "Accounts" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AccountsRegister />
    </Suspense>
  );
}
