/**
 * Capital call notices. The firm, as administrator, issues every notice; the GP approves the call but never signs
 * or brands a notice. One notice per limited partner, built from the call, the vehicle's records and the investor's
 * record, so nothing on it is typed by hand.
 *
 * Before a notice can be issued it must pass the checks below. Missing data is shown as missing, never filled in.
 */
import type { Brand } from "@/lib/brand";
import { bankAccounts, investorById, type BankAccount, type Fund, type Investor } from "@/lib/data";
import { buildBooks, type CallRecord } from "@/lib/accounting/engine";

export type NoticeCheck = { id: string; label: string; ok: boolean; detail: string; /** a few words for the checks table */ short: string };

export type Notice = {
  investor: Investor;
  partnerNo: number;
  /** this partner's notice count in this vehicle, this call included */
  noticeNo: number;
  date: string;
  due: string;
  callNo: number;
  amount: number;
  currency: string;
  fundName: string;
  /** what the partner is buying, e.g. "STX-Anchor - Limited Partnership Interests" */
  interest: string;
  /** e.g. "September 2026 - Capital Contribution" */
  period: string;
  reference: string;
  bank?: BankAccount;
  lei?: string;
  admin: { entity: string; address: string; phone?: string; email: string; name: string };
  checks: NoticeCheck[];
};

const monthYear = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Weekdays after the notice date up to and including the due date (holidays are not counted out). */
export function businessDays(from: string, to: string) {
  let n = 0;
  for (let t = Date.parse(`${from}T12:00:00Z`) + 86_400_000; t <= Date.parse(`${to}T12:00:00Z`); t += 86_400_000) {
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) n++;
  }
  return n;
}

/** Short code for references: the initials of the vehicle's short name, e.g. "STX-Anchor Capital Formation" → "SACF". */
export const fundCode = (f: Fund) =>
  f.shortName
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("");

/** The minimum notice the LPAs on the platform require, in business days. */
export const MIN_NOTICE_DAYS = 10;

type CallLike = Pick<CallRecord, "number" | "noticeDate" | "dueDate" | "status"> & { allocations: { investorId: string; amount: number }[] };

export function buildNotices(f: Fund, call: CallLike, brand: Brand): Notice[] {
  const books = buildBooks(f.id);
  // Partner numbers follow admission order in the vehicle, from 1001.
  const partnerNo = new Map(books.partners.map((p, i) => [p.investorId, 1001 + i]));
  const earlier = books.calls.filter((c) => c.number < call.number);
  const bank = bankAccounts.find((b) => b.fundId === f.id && b.currency === f.currency) ?? bankAccounts.find((b) => b.fundId === f.id);
  const days = businessDays(call.noticeDate, call.dueDate);
  const admin = {
    entity: brand.administrator?.entity ?? brand.legalName,
    address: brand.administrator?.address ?? brand.city,
    phone: brand.administrator?.phone,
    email: brand.supportEmail,
    name: brand.name,
  };
  const interestKind = /partnership/i.test(f.legalForm) ? "Limited Partnership Interests" : "Interests";

  return call.allocations.flatMap((a) => {
    const investor = investorById(a.investorId);
    if (!investor) return [];
    const no = partnerNo.get(a.investorId) ?? 0;
    const checks: NoticeCheck[] = [
      {
        id: "address",
        label: "Mailing address",
        ok: !!investor.address?.length,
        short: investor.address?.length ? "On file" : "Not on file",
        detail: investor.address?.length ? "On file" : "Not on file. Add it to the investor record.",
      },
      {
        id: "wire",
        label: "Wire instructions",
        ok: !!bank?.wire,
        short: bank?.wire ? "On file" : bank ? `Only ••${bank.mask} on file` : "No account",
        detail: bank?.wire
          ? `${bank.institution}, account ending ${bank.mask}`
          : bank
            ? `Only the last four digits of ${bank.institution} ••${bank.mask} are on file.`
            : "No bank account on file for this vehicle.",
      },
      {
        id: "kyc",
        label: "Investor KYC",
        ok: investor.kyc === "Clear",
        short: investor.kyc,
        detail: investor.kyc === "Clear" ? "Clear" : `${investor.kyc}. Compliance signs off before this notice goes out.`,
      },
      {
        id: "notice",
        label: "Notice period",
        ok: days >= MIN_NOTICE_DAYS,
        short: `${days} of ${MIN_NOTICE_DAYS} days`,
        detail: `${days} business days to the due date; the LPA requires ${MIN_NOTICE_DAYS}.`,
      },
      {
        id: "approval",
        label: "GP approval",
        ok: call.status !== "Draft",
        short: call.status !== "Draft" ? "Approved" : "Waiting",
        detail: call.status !== "Draft" ? `Approved by ${f.gp}` : `Waiting for ${f.gp}`,
      },
    ];
    return [
      {
        investor,
        partnerNo: no,
        noticeNo: earlier.filter((c) => c.allocations.some((x) => x.investorId === a.investorId)).length + 1,
        date: call.noticeDate,
        due: call.dueDate,
        callNo: call.number,
        amount: a.amount,
        currency: f.currency,
        fundName: f.name,
        interest: `${f.shortName.split(" ")[0]} - ${interestKind}`,
        period: `${monthYear(call.noticeDate)} - Capital Contribution`,
        // Unique per partner and call, so an incoming wire can be matched to this notice without guesswork.
        reference: `${fundCode(f)}-C${call.number}-${no}`,
        bank,
        lei: f.lei,
        admin,
        checks,
      },
    ];
  });
}

export const ready = (n: Notice) => n.checks.every((c) => c.ok);
