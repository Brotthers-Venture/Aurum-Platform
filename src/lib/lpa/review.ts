/**
 * LPA review results. The extraction agent returns one record per economic
 * term. Rule: nothing implied — every value must quote the LPA; terms the LPA
 * does not state are returned as not_found, and conflicting clauses as
 * ambiguous with each reading. A person decides every term before it applies.
 */

export type TermStatus = "extracted" | "not_found" | "ambiguous";

export type Reading = { value: string; clause: string; page: number; quote: string };

export type ExtractedTerm = {
  key: string;
  group: "Fund & term" | "Share classes" | "Management fee" | "Distribution waterfall" | "Closings & equalization" | "Expenses";
  label: string;
  status: TermStatus;
  value?: string;
  clause?: string;
  page?: number;
  quote?: string;
  readings?: Reading[];
  /** second pass: does the quote exist verbatim and support the value? */
  verification: "verified" | "needs_decision" | "not_applicable";
  /** effect on the current configuration, if any */
  impact?: string;
};

export type LpaDocument = {
  id: string;
  name: string;
  kind: "LPA" | "Amendment" | "Side letter";
  date: string;
  pages: number;
  scope: string;
};

export type LpaReview = {
  fundId: string;
  version: number;
  preparedBy: string;
  preparedAt: string;
  model: string;
  documents: LpaDocument[];
  terms: ExtractedTerm[];
  history: { version: number; label: string; effective: string; approvedBy: string; status: "Applied" | "Superseded" | "In review" }[];
};

export const reviews: Record<string, LpaReview> = {
  "cordillera-infra-i": {
    fundId: "cordillera-infra-i",
    version: 2,
    preparedBy: "Rafael Mendes",
    preparedAt: "2026-11-24T09:58:12",
    model: "Claude Opus 5.5",
    documents: [
      { id: "d1", name: "Amended and Restated LPA", kind: "LPA", date: "2023-03-15", pages: 92, scope: "Fund-level economics" },
      { id: "d2", name: "Amendment No. 1 — Class B Interests", kind: "Amendment", date: "2023-09-29", pages: 6, scope: "Fund-level economics" },
      { id: "d3", name: "Side letter — Brightwater Municipal Pension Plan", kind: "Side letter", date: "2023-03-15", pages: 4, scope: "Investor-specific · reviewed separately" },
      { id: "d4", name: "Side letter — Northgate University Endowment", kind: "Side letter", date: "2023-03-15", pages: 3, scope: "Investor-specific · reviewed separately" },
    ],
    terms: [
      { key: "term", group: "Fund & term", label: "Fund term", status: "extracted", value: "10 years from Final Closing; two 1-year extensions", clause: "§2.4", page: 9, quote: "…shall continue until the tenth (10th) anniversary of the Final Closing Date, which term may be extended by the General Partner for up to two (2) additional one-year periods with the consent of the Advisory Committee.", verification: "verified" },
      { key: "commitment_period", group: "Fund & term", label: "Commitment period", status: "extracted", value: "5 years from Initial Closing", clause: "§1.1 “Commitment Period”", page: 3, quote: "“Commitment Period” means the period commencing on the Initial Closing Date and ending on the fifth (5th) anniversary thereof…", verification: "verified" },
      { key: "gp_commitment", group: "Fund & term", label: "GP commitment", status: "extracted", value: "1.0% of aggregate commitments", clause: "§3.1(b)", page: 14, quote: "The General Partner shall make a Capital Commitment equal to one percent (1%) of the aggregate Capital Commitments of all Partners.", verification: "verified" },
      { key: "class_a", group: "Share classes", label: "Class A Interests", status: "extracted", value: "All Limited Partners not holding Class B", clause: "Amendment No. 1, §2(a)", page: 2, quote: "Each Limited Partner that is not a Class B Limited Partner shall hold Class A Interests.", verification: "verified" },
      { key: "class_b", group: "Share classes", label: "Class B Interests", status: "extracted", value: "Commitments of $50,000,000 or more at Initial Closing", clause: "Amendment No. 1, §2(b)", page: 2, quote: "Any Limited Partner admitted at the Initial Closing with a Capital Commitment of not less than $50,000,000 shall hold Class B Interests.", verification: "verified", impact: "Brightwater Municipal Pension Plan qualifies ($50,000,000 at Initial Closing). The fund is currently set up with a single class." },
      { key: "class_gp", group: "Share classes", label: "GP Interest", status: "extracted", value: "No management fee, no carried interest", clause: "§8.1(d)", page: 39, quote: "No Management Fee shall be charged, and no Carried Interest shall be borne, with respect to the Capital Commitment of the General Partner or its Affiliates.", verification: "verified" },
      { key: "fee_a", group: "Management fee", label: "Rate — Class A", status: "extracted", value: "1.75% per annum", clause: "§8.1(a)", page: 38, quote: "…a management fee at an annual rate of one and three-quarters percent (1.75%)…", verification: "verified" },
      { key: "fee_b", group: "Management fee", label: "Rate — Class B", status: "extracted", value: "1.50% per annum", clause: "Amendment No. 1, §3", page: 3, quote: "…the Management Fee attributable to Class B Interests shall accrue at an annual rate of one and one-half percent (1.50%)…", verification: "verified", impact: "Class B fees are currently charged at 1.75%. Applying will reduce Brightwater’s fee allocation going forward; past periods are not restated automatically." },
      { key: "fee_basis", group: "Management fee", label: "Fee basis", status: "extracted", value: "Commitments during Commitment Period; thereafter Invested Capital", clause: "§8.1(b)", page: 38, quote: "During the Commitment Period, the Management Fee shall be calculated on Capital Commitments and, thereafter, on Invested Capital…", verification: "verified" },
      { key: "fee_timing", group: "Management fee", label: "Payment timing", status: "extracted", value: "Quarterly in advance", clause: "§8.1(c)", page: 39, quote: "The Management Fee shall be payable quarterly in advance on the first day of each Fiscal Quarter.", verification: "verified" },
      { key: "fee_offset", group: "Management fee", label: "Fee offset", status: "extracted", value: "100% of transaction and monitoring fees", clause: "§8.3", page: 40, quote: "The Management Fee shall be reduced by one hundred percent (100%) of all Transaction Fees and Monitoring Fees received by the General Partner…", verification: "verified" },
      { key: "fee_stepdown", group: "Management fee", label: "Step-down during extensions", status: "not_found", verification: "not_applicable" },
      { key: "waterfall_type", group: "Distribution waterfall", label: "Waterfall type", status: "extracted", value: "Whole-of-fund (European)", clause: "§6.2", page: 26, quote: "…Distributable Proceeds shall be apportioned among the Partners… and the amount apportioned to each Limited Partner shall be distributed as follows, on a cumulative basis taking into account all prior distributions…", verification: "verified" },
      { key: "hurdle", group: "Distribution waterfall", label: "Preferred return", status: "extracted", value: "8% per annum, compounded annually", clause: "§6.2(b)", page: 27, quote: "…an amount equal to an eight percent (8%) per annum return, compounded annually, on such Capital Contributions…", verification: "verified" },
      {
        key: "hurdle_start",
        group: "Distribution waterfall",
        label: "Preferred return accrues from",
        status: "ambiguous",
        readings: [
          { value: "Date each contribution is made", clause: "§6.2(b)", page: 27, quote: "…calculated from the date of each Capital Contribution until the date of distribution." },
          { value: "Due date stated in the drawdown notice", clause: "§1.1 “Contribution Date”", page: 4, quote: "“Contribution Date” means, with respect to any Capital Contribution, the due date specified in the applicable Drawdown Notice." },
        ],
        verification: "needs_decision",
        impact: "Late payers would accrue preferred return for fewer days under the first reading. Confirm with counsel which definition governs.",
      },
      { key: "catch_up", group: "Distribution waterfall", label: "GP catch-up", status: "extracted", value: "100% to the GP until it has received 20% of cumulative profits", clause: "§6.2(c)", page: 27, quote: "…one hundred percent (100%) to the General Partner until the General Partner has received… twenty percent (20%) of the sum of all amounts distributed under clauses (b) and (c)…", verification: "verified" },
      { key: "carry", group: "Distribution waterfall", label: "Carried interest", status: "extracted", value: "20% to GP / 80% to LPs", clause: "§6.2(d)", page: 28, quote: "…thereafter, eighty percent (80%) to such Limited Partner and twenty percent (20%) to the General Partner.", verification: "verified" },
      { key: "clawback", group: "Distribution waterfall", label: "GP clawback", status: "extracted", value: "At end of term, net of taxes paid", clause: "§6.6", page: 31, quote: "Upon the dissolution of the Partnership, the General Partner shall restore… the excess of Carried Interest received, net of taxes paid or payable thereon…", verification: "verified" },
      { key: "recycling", group: "Distribution waterfall", label: "Recycling of proceeds", status: "not_found", verification: "not_applicable" },
      { key: "late_close", group: "Closings & equalization", label: "Subsequent closings", status: "extracted", value: "Up to 12 months after Initial Closing", clause: "§3.3(a)", page: 16, quote: "…one or more Subsequent Closings… on or before the date that is twelve (12) months after the Initial Closing Date.", verification: "verified" },
      { key: "eq_interest", group: "Closings & equalization", label: "Equalization interest", status: "extracted", value: "8% per annum, simple", clause: "§3.3(c)", page: 17, quote: "…together with interest thereon at a rate of eight percent (8%) per annum, simple interest…", verification: "verified" },
      { key: "default_interest", group: "Closings & equalization", label: "Default interest", status: "extracted", value: "Prime Rate + 5% per annum", clause: "§3.6(a)", page: 19, quote: "…shall bear interest at a rate equal to the Prime Rate plus five percent (5%) per annum…", verification: "verified" },
      { key: "org_cap", group: "Expenses", label: "Organizational expenses cap", status: "extracted", value: "$1,000,000", clause: "§8.5", page: 41, quote: "The Partnership shall bear Organizational Expenses up to an aggregate of $1,000,000; any excess shall be borne by the General Partner.", verification: "verified" },
      { key: "expense_cap", group: "Expenses", label: "Annual fund expense cap", status: "not_found", verification: "not_applicable" },
    ],
    history: [
      { version: 2, label: "A&R LPA + Amendment No. 1", effective: "2023-09-29", approvedBy: "—", status: "In review" },
      { version: 1, label: "A&R LPA", effective: "2023-03-15", approvedBy: "Luiza Andrade · Marcus Hale (GP)", status: "Applied" },
    ],
  },
};
