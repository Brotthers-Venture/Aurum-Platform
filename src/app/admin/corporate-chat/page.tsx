import { redirect } from "next/navigation";

/** Friendly alias for /admin/communication. */
export default function CorporateChatAlias() {
  redirect("/admin/communication");
}
