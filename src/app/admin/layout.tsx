import type { ReactNode } from "react";
import { PreviewRoleProvider } from "@/components/admin/PreviewRole";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <PreviewRoleProvider>{children}</PreviewRoleProvider>;
}
