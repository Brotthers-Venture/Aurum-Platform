/**
 * Standard chart of accounts for a private fund (partnership basis).
 * Accounts flagged `partner` carry a partner (LP) tag on every line, which is
 * what produces the partner-level capital subledger.
 */
export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export type Account = {
  code: string;
  name: string;
  type: AccountType;
  partner?: boolean;
  /** statement section for presentation */
  section: string;
};

export const chartOfAccounts: Account[] = [
  { code: "1000", name: "Cash and cash equivalents", type: "asset", section: "Assets" },
  { code: "1100", name: "Investments, at cost", type: "asset", section: "Assets" },
  { code: "1150", name: "Unrealized appreciation on investments", type: "asset", section: "Assets" },
  { code: "1200", name: "Capital contributions receivable", type: "asset", partner: true, section: "Assets" },
  { code: "2300", name: "Equalization interest payable", type: "liability", section: "Liabilities" },
  { code: "3000", name: "Partners' capital — contributions", type: "equity", partner: true, section: "Partners' capital" },
  { code: "3100", name: "Partners' capital — distributions", type: "equity", partner: true, section: "Partners' capital" },
  { code: "4000", name: "Investment income", type: "income", section: "Income" },
  { code: "4100", name: "Net realized gain on investments", type: "income", section: "Gains" },
  { code: "4200", name: "Net change in unrealized appreciation", type: "income", section: "Gains" },
  { code: "5000", name: "Management fees", type: "expense", section: "Expenses" },
  { code: "5100", name: "Fund expenses", type: "expense", section: "Expenses" },
  { code: "5200", name: "Organizational costs", type: "expense", section: "Expenses" },
];

export const accountByCode = (code: string) => chartOfAccounts.find((a) => a.code === code)!;

/** Debit-normal accounts carry positive balances on the debit side. */
export const isDebitNormal = (code: string) => {
  const t = accountByCode(code).type;
  return t === "asset" || t === "expense";
};
