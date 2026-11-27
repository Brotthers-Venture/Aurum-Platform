/**
 * Entrances: every door into the platform, each with its own look. A door that is not customised inherits from its
 * group's default, and every default inherits from the firm's console sign-in, so a firm only sets what it wants to
 * change.
 *
 *   Firm       console sign-in for the firm's own team (the base look)
 *   Investors  default for investors administered directly, and one per manager's investor portal
 *   Clients    default for client portals, and one per client company
 *   Solutions  one per solution, for people who enter a solution directly
 */
import { gps } from "@/lib/gps";
import { solutions } from "@/lib/solutions";
import type { Brand, LoginBackdrop } from "@/lib/brand";

export type EntranceBackdrop = LoginBackdrop;
export type EntranceLook = { backdrop?: EntranceBackdrop; image?: string; eyebrow?: string; headline?: string; text?: string };

export type EntranceGroup = "Firm" | "Investors" | "Clients" | "Solutions";
export type Entrance = {
  id: string;
  group: EntranceGroup;
  name: string;
  /** who comes through this door */
  who: string;
  parent?: string;
  /** where the sign-in page lives */
  path: string;
  /** where it leads after sign-in */
  to: string;
  /** a manager's investor portal keeps the manager's own logo and colours */
  gpId?: string;
  org?: string;
  /** the texts a door shows before anyone writes its own */
  defaults: { eyebrow: string; headline: string; text: string };
};

/** Client companies with their own portal (not the firm's own tenants or the managers). */
export const CLIENT_ORGS: { id: string; name: string }[] = [
  { id: "halvorsen", name: "Halvorsen Family Office" },
  { id: "valenca", name: "Valença Family Office" },
  { id: "portoreal", name: "Porto Real Holdings" },
  { id: "altamira", name: "Altamira Holdings LLC" },
  { id: "mazal", name: "Mazal Group" },
  { id: "cascade", name: "Cascade Ridge Partners" },
  { id: "ledgerline", name: "Ledgerline Digital Ltd." },
];

export function entrances(b: Pick<Brand, "legalName" | "name" | "login">): Entrance[] {
  return [
    {
      id: "firm",
      group: "Firm",
      name: "Console sign-in",
      who: `${b.name}’s own team`,
      path: "/login",
      to: "/admin",
      defaults: { eyebrow: b.login.eyebrow, headline: b.login.headline, text: b.login.text },
    },
    {
      id: "investor",
      group: "Investors",
      name: "All investors",
      who: `Investors administered directly by ${b.name}`,
      parent: "firm",
      path: "/enter/investor",
      to: "/portal",
      defaults: { eyebrow: "Investor portal", headline: "Your investments, in one place.", text: "Statements, capital calls, distributions, reports and tax documents." },
    },
    ...gps.map((g): Entrance => ({
      id: `investor:${g.id}`,
      group: "Investors",
      name: g.shortName,
      who: `Investors in ${g.shortName}’s funds`,
      parent: "investor",
      path: `/investor/${g.id}/login`,
      to: `/investor/${g.id}`,
      gpId: g.id,
      defaults: { eyebrow: "Investor portal", headline: g.shortName, text: "Statements, notices, reports and tax documents for your investments." },
    })),
    {
      id: "client",
      group: "Clients",
      name: "All clients",
      who: "Families and companies the firm serves",
      parent: "firm",
      path: "/enter/client",
      to: "/client",
      defaults: { eyebrow: "Client portal", headline: "Everything you own, in order.", text: "Entities, accounts, documents and the people who look after them." },
    },
    ...CLIENT_ORGS.map((c): Entrance => ({
      id: `client:${c.id}`,
      group: "Clients",
      name: c.name,
      who: `People at ${c.name}`,
      parent: "client",
      path: `/enter/client/${c.id}`,
      to: "/client",
      org: c.id,
      defaults: { eyebrow: "Client portal", headline: c.name, text: "Entities, accounts, documents and the people who look after them." },
    })),
    ...solutions.map((s): Entrance => ({
      id: `solution:${s.id}`,
      group: "Solutions",
      name: s.name,
      who: `People who work in ${s.name}`,
      parent: "firm",
      path: `/enter/${s.id}`,
      to: s.href,
      defaults: { eyebrow: b.legalName, headline: s.name, text: s.summary },
    })),
  ];
}

export const entranceById = (b: Pick<Brand, "legalName" | "name" | "login">, id: string) => entrances(b).find((e) => e.id === id);

/** The firm entrance's own look is the brand's sign-in settings. */
const firmLook = (b: Brand): EntranceLook => ({ backdrop: b.login.backdrop, image: b.login.image, eyebrow: b.login.eyebrow, headline: b.login.headline, text: b.login.text });
export const ownLook = (b: Brand, id: string): EntranceLook => (id === "firm" ? firmLook(b) : (b.entrances?.[id] ?? {}));

export type ResolvedLook = { backdrop: EntranceBackdrop; image?: string; eyebrow: string; headline: string; text: string; from?: string; gpId?: string };

/**
 * The look a door shows: its own settings, then its group default, then the firm's console sign-in.
 * Texts fall back to the door's own defaults rather than the firm's, so Strlex's door keeps "Strlex Capital" as its
 * headline unless someone writes another. A manager's investor portal never takes the firm's picture: without its own
 * (or the investor default's) it shows the manager's colours.
 */
export function resolveLook(b: Brand, id: string): ResolvedLook {
  const list = entrances(b);
  const chain: Entrance[] = [];
  for (let e = list.find((x) => x.id === id); e; e = e.parent ? list.find((x) => x.id === e!.parent) : undefined) chain.push(e);
  const door = chain[0] ?? list[0];
  const scope = door.gpId ? chain.filter((e) => e.id !== "firm") : chain;
  const looks = scope.map((e) => ({ e, l: ownLook(b, e.id) }));
  const bg = looks.find(({ l }) => l.backdrop && (l.backdrop !== "image" || !!l.image));
  const textOf = (k: "eyebrow" | "headline" | "text") => looks.filter(({ e }) => e.id !== "firm").find(({ l }) => l[k]?.trim())?.l[k] ?? door.defaults[k];
  return {
    backdrop: bg?.l.backdrop ?? "field",
    image: bg?.l.backdrop === "image" ? bg.l.image : undefined,
    eyebrow: textOf("eyebrow"),
    headline: textOf("headline"),
    text: textOf("text"),
    from: bg && bg.e.id !== door.id ? bg.e.name : undefined,
    gpId: door.gpId,
  };
}
