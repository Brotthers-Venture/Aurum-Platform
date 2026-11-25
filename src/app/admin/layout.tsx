import type { ReactNode } from "react";

/** The preview person (who is looking) is provided at the root, so portals know it too. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
