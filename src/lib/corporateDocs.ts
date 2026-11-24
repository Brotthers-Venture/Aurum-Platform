/**
 * The corporate record of a vehicle: what an administrator must hold on file.
 * Stored in Supabase Storage (private bucket "fund-documents") with a row per version
 * in public.fund_documents — see supabase/migrations/20261124020000_corporate_documents.sql.
 * Files are never overwritten: a new upload supersedes the previous version and keeps its SHA-256.
 */

export type DocVisibility = "internal" | "gp" | "investors";

export type CorporateDocType = {
  id: string;
  label: string;
  hint: string;
  required: boolean;
  /** more than one current file allowed (side letters, amendments) */
  multiple?: boolean;
  visibility: DocVisibility;
  /** feeds the LPA review agent */
  lpa?: boolean;
};

export const CORPORATE_DOC_TYPES: CorporateDocType[] = [
  { id: "certificate_formation", label: "Certificate of formation", hint: "Certificate of Limited Partnership / Formation / Incorporation, as filed with the state or registry.", required: true, visibility: "gp" },
  { id: "lpa", label: "Limited Partnership Agreement", hint: "Executed LPA or operating agreement, with all amendments. Read by the LPA review agent.", required: true, visibility: "investors", lpa: true },
  { id: "ein_letter", label: "EIN confirmation (IRS)", hint: "IRS CP 575 or 147C letter. Needed for W-9s, bank accounts and K-1s.", required: true, visibility: "internal" },
  { id: "good_standing", label: "Certificate of good standing", hint: "Recent certificate from the registry. Banks usually want one under 90 days old.", required: false, visibility: "gp" },
  { id: "ppm", label: "Private placement memorandum", hint: "Offering memorandum and supplements.", required: false, visibility: "investors" },
  { id: "subscription_form", label: "Subscription agreement (form)", hint: "Blank subscription documents investors sign during onboarding.", required: false, visibility: "investors" },
  { id: "gp_agreement", label: "GP operating agreement", hint: "Governing document of the general partner entity.", required: false, visibility: "internal" },
  { id: "ima", label: "Investment management agreement", hint: "Between the fund and its manager.", required: false, visibility: "gp" },
  { id: "admin_agreement", label: "Administration agreement", hint: "Aurum's service agreement with the fund.", required: false, visibility: "gp" },
  { id: "side_letter", label: "Side letters", hint: "One file per investor side letter.", required: false, multiple: true, visibility: "internal" },
  { id: "amendment", label: "Amendments & resolutions", hint: "Amendments, GP consents, written resolutions.", required: false, multiple: true, visibility: "gp" },
];

export const visibilityLabel: Record<DocVisibility, string> = {
  internal: "Aurum only",
  gp: "Aurum + GP",
  investors: "Aurum, GP + investors",
};

export type CorporateFile = {
  type: string;
  name: string;
  bytes: number;
  sha256: string;
  effectiveDate: string | null;
  version: number;
  uploadedAt: string; // ISO
  uploadedBy: string;
  /** captured automatically (e.g. the GLEIF record) rather than uploaded */
  source?: "gleif";
};

export const fileSize = (b: number) => (b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** SHA-256 of a file, hex. Recorded with every upload so any copy can be verified later. */
export async function sha256Hex(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Storage key: fund-documents/{gpId}/{fundId}/{type}/v{n}-{file} */
export const storagePath = (gpId: string, fundId: string, f: Pick<CorporateFile, "type" | "version" | "name">) =>
  `${gpId}/${fundId}/${f.type}/v${f.version}-${f.name.replace(/[^\w.\-]+/g, "_")}`;

/** Sample corporate records for existing vehicles (until Supabase is connected). */
const rec = (type: string, name: string, effectiveDate: string, kb: number, sha: string, uploadedAt: string, uploadedBy = "Luiza Andrade"): CorporateFile => ({
  type,
  name,
  bytes: kb * 1024,
  sha256: sha.padEnd(64, "0"),
  effectiveDate,
  version: 1,
  uploadedAt,
  uploadedBy,
});

export const corporateRecords: Record<string, CorporateFile[]> = {
  "cordillera-infra-i": [
    rec("certificate_formation", "Cordillera Infra I - Certificate of LP.pdf", "2023-02-14", 212, "9b1c4e07a2", "2023-03-01T14:10:00Z"),
    rec("lpa", "Cordillera Infra I - Amended and Restated LPA.pdf", "2023-06-30", 1840, "4fe0a91d37", "2023-07-03T10:02:00Z"),
    rec("ein_letter", "IRS CP575 - Cordillera Infra I.pdf", "2023-02-21", 96, "c27d0b85e1", "2023-03-01T14:12:00Z"),
    rec("ppm", "Cordillera Infra I - PPM.pdf", "2023-04-10", 3120, "d81a6f4c09", "2023-04-11T09:30:00Z"),
    rec("subscription_form", "Subscription Documents.pdf", "2023-04-10", 640, "07be52a9cd", "2023-04-11T09:31:00Z"),
    rec("admin_agreement", "Administration Agreement - Aurum.pdf", "2023-05-01", 410, "a5e3b1d2f8", "2023-05-02T16:00:00Z"),
    rec("side_letter", "Side Letter - Calloway Family Office.pdf", "2023-06-30", 120, "e6f4d1c7b2", "2023-07-03T10:05:00Z"),
  ],
  "stx-anchor": [
    rec("certificate_formation", "STX-Anchor - Certificate of Limited Partnership (DE 10749566).pdf", "2026-08-27", 188, "1f7a9e22c4", "2026-09-02T13:20:00Z"),
    rec("lpa", "STX-Anchor Capital Formation Fund LP - LPA.pdf", "2026-09-15", 1460, "8c0de4a6b1", "2026-09-16T11:45:00Z"),
  ],
  "sagewood-seed-i": [],
};
