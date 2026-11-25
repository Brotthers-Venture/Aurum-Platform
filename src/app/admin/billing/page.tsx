import { redirect } from "next/navigation";

/** Billing was renamed Treasury; old links keep working. */
export default function BillingMoved() {
  redirect("/admin/treasury");
}
