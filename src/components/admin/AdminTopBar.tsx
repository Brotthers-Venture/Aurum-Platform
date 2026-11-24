import { HubTopBar } from "./HubTopBar";

/**
 * Every admin page uses the same bar as the hub: mark on the left (with the page’s context beside it),
 * one centred search, then the menu, app launcher and account. Inside Fund Solution the mark lives in
 * the sidebar, so the bar omits it.
 */
export function AdminTopBar({ context, logo = true }: { context?: string; logo?: boolean }) {
  return <HubTopBar context={context} logo={logo} />;
}
