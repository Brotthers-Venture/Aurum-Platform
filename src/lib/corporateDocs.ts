/**
 * Vehicle data room: corporate and offering documents.
 * Stored in Supabase Storage (private bucket "fund-documents") with a row per version in
 * public.fund_documents — see supabase/migrations/20261124020000_corporate_documents.sql.
 * Replacing a file adds a version (earlier versions are kept); removing archives it.
 */

export type DocVisibility = "internal" | "gp" | "investors";

export type DocType = { id: string; label: string; visibility: DocVisibility; group: "Formation" | "Offering" | "Agreements" | "Investors" | "Other" };

export const DOC_TYPES: DocType[] = [
  { id: "certificate_formation", label: "Certificate of formation", visibility: "gp", group: "Formation" },
  { id: "lpa", label: "LPA", visibility: "investors", group: "Formation" },
  { id: "ein_letter", label: "EIN letter", visibility: "internal", group: "Formation" },
  { id: "good_standing", label: "Good standing", visibility: "gp", group: "Formation" },
  { id: "lei_record", label: "LEI record", visibility: "gp", group: "Formation" },
  { id: "ppm", label: "PPM", visibility: "investors", group: "Offering" },
  { id: "subscription_form", label: "Subscription agreement", visibility: "investors", group: "Offering" },
  { id: "gp_agreement", label: "GP operating agreement", visibility: "internal", group: "Agreements" },
  { id: "ima", label: "Management agreement", visibility: "gp", group: "Agreements" },
  { id: "admin_agreement", label: "Administration agreement", visibility: "gp", group: "Agreements" },
  { id: "side_letter", label: "Side letter", visibility: "internal", group: "Investors" },
  { id: "amendment", label: "Amendment / resolution", visibility: "gp", group: "Formation" },
  { id: "other", label: "Other", visibility: "internal", group: "Other" },
];
export const DOC_GROUPS = ["Formation", "Offering", "Agreements", "Investors", "Other"] as const;
export const docType = (id: string) => DOC_TYPES.find((t) => t.id === id) ?? DOC_TYPES[DOC_TYPES.length - 1];

export const visibilityLabel: Record<DocVisibility, string> = {
  internal: "Aurum",
  gp: "Aurum + GP",
  investors: "Investors",
};

/** Best guess of the document type from its file name; the admin can change it. */
export function guessType(fileName: string) {
  const n = fileName.toLowerCase();
  const rules: [RegExp, string][] = [
    [/side[\s_-]*letter/, "side_letter"],
    [/cert(ificate)?[\s_-]*of[\s_-]*(limited[\s_-]*partnership|lp|formation|incorporation|organi[sz]ation)|articles[\s_-]*of/, "certificate_formation"],
    [/good[\s_-]*standing/, "good_standing"],
    [/\bein\b|cp[\s_-]*575|147[\s_-]*c|irs/, "ein_letter"],
    [/\blpa\b|partnership[\s_-]*agreement|limited[\s_-]*partnership[\s_-]*agreement/, "lpa"],
    [/\bppm\b|placement[\s_-]*memo|offering[\s_-]*memo/, "ppm"],
    [/subscription/, "subscription_form"],
    [/investment[\s_-]*management|\bima\b|advisory[\s_-]*agreement/, "ima"],
    [/administration[\s_-]*agreement|admin[\s_-]*agreement/, "admin_agreement"],
    [/operating[\s_-]*agreement|\bllc[\s_-]*agreement/, "gp_agreement"],
    [/amend|resolution|consent/, "amendment"],
    [/\blei\b|gleif/, "lei_record"],
  ];
  return rules.find(([re]) => re.test(n))?.[1] ?? "other";
}

export type RoomFile = {
  id: string;
  /** versions of the same document share a chain id */
  chain: string;
  title: string;
  fileName: string;
  type: string;
  visibility: DocVisibility;
  bytes: number;
  sha256: string;
  effectiveDate: string | null;
  version: number;
  uploadedAt: string; // ISO
  uploadedBy: string;
  archived?: boolean;
  source?: "gleif";
};

export const fileSize = (b: number) => (b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** SHA-256 of a file, hex — recorded with every upload so any copy can be verified later. */
export async function sha256Hex(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const titleFromFile = (name: string) => name.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_]+/g, " ").trim();

/** Latest, non-archived version of each document. */
export const currentFiles = (files: RoomFile[]) =>
  files.filter((f) => !f.archived && !files.some((o) => o.chain === f.chain && o.version > f.version));

/** Storage key: fund-documents/{gpId}/{fundId}/{type}/v{n}-{file} */
export const storagePath = (gpId: string, fundId: string, f: Pick<RoomFile, "type" | "version" | "fileName">) =>
  `${gpId}/${fundId}/${f.type}/v${f.version}-${f.fileName.replace(/[^\w.\-]+/g, "_")}`;

/* Sample data rooms for existing vehicles (until Supabase is connected). */
let n = 0;
const rec = (type: string, fileName: string, effectiveDate: string | null, kb: number, sha: string, uploadedAt: string): RoomFile => {
  const id = `seed-${++n}`;
  return {
    id,
    chain: id,
    title: titleFromFile(fileName),
    fileName,
    type,
    visibility: docType(type).visibility,
    bytes: kb * 1024,
    sha256: sha.padEnd(64, "0"),
    effectiveDate,
    version: 1,
    uploadedAt,
    uploadedBy: "Luiza Andrade",
  };
};

export const corporateRecords: Record<string, RoomFile[]> = {
  "cordillera-infra-i": [
    rec("certificate_formation", "Certificate of Limited Partnership.pdf", "2023-02-14", 212, "9b1c4e07a2", "2023-03-01T14:10:00Z"),
    rec("lpa", "Amended and Restated LPA.pdf", "2023-06-30", 1840, "4fe0a91d37", "2023-07-03T10:02:00Z"),
    rec("ein_letter", "IRS CP575.pdf", "2023-02-21", 96, "c27d0b85e1", "2023-03-01T14:12:00Z"),
    rec("ppm", "Private Placement Memorandum.pdf", "2023-04-10", 3120, "d81a6f4c09", "2023-04-11T09:30:00Z"),
    rec("subscription_form", "Subscription Documents.pdf", "2023-04-10", 640, "07be52a9cd", "2023-04-11T09:31:00Z"),
    rec("admin_agreement", "Administration Agreement - Aurum.pdf", "2023-05-01", 410, "a5e3b1d2f8", "2023-05-02T16:00:00Z"),
    rec("side_letter", "Side Letter - Calloway Family Office.pdf", "2023-06-30", 120, "e6f4d1c7b2", "2023-07-03T10:05:00Z"),
  ],
  "stx-anchor": [
    rec("certificate_formation", "Certificate of Limited Partnership (DE 10749566).pdf", "2026-08-27", 188, "1f7a9e22c4", "2026-09-02T13:20:00Z"),
    rec("lpa", "STX-Anchor Capital Formation Fund LP - LPA.pdf", "2026-09-15", 1460, "8c0de4a6b1", "2026-09-16T11:45:00Z"),
  ],
};
