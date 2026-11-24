/**
 * Instructions for the LPA review agent. The non-negotiable rule is that the
 * agent never supplies a value the documents do not state.
 */

export const TERM_KEYS = [
  ["term", "Fund term and extensions"],
  ["commitment_period", "Commitment / investment period"],
  ["gp_commitment", "GP commitment"],
  ["classes", "Share classes / interest classes and who holds each"],
  ["fee_rates", "Management fee rate for each class"],
  ["fee_basis", "Management fee basis (commitments, invested capital, NAV) and when it changes"],
  ["fee_timing", "Management fee payment timing"],
  ["fee_offset", "Fee offsets (transaction, monitoring, director fees)"],
  ["fee_stepdown", "Management fee step-downs"],
  ["waterfall_type", "Waterfall type: whole-of-fund (European) or deal-by-deal (American)"],
  ["hurdle", "Preferred return rate and compounding"],
  ["hurdle_start", "Date from which the preferred return accrues"],
  ["catch_up", "GP catch-up percentage and target"],
  ["carry", "Carried interest percentage"],
  ["clawback", "GP clawback and timing"],
  ["recycling", "Recycling / reinvestment of proceeds"],
  ["late_close", "Subsequent closing window"],
  ["eq_interest", "Equalization interest charged at subsequent closings"],
  ["default_interest", "Interest on defaulted contributions"],
  ["org_cap", "Organizational expense cap"],
  ["expense_cap", "Annual fund expense cap"],
] as const;

export const SYSTEM_PROMPT = `You are reviewing private fund documents (an LPA, its amendments and any side letters) for a fund administrator.
Your job is to record the fund's economic terms exactly as the documents state them.

Rules you must follow without exception:
1. Never infer, assume or apply market practice. If the documents do not state a term, return status "not_found" and leave value empty.
2. Every extracted value must quote, verbatim, the sentence that establishes it, with the document name, clause number and page.
3. If two clauses conflict or a term can reasonably be read two ways, return status "ambiguous" with each reading and its quote. Do not choose.
4. Later amendments override earlier text only where the amendment says so; cite the amendment.
5. Side letters change economics for one investor only. Report them separately with the investor name; never fold them into fund-level terms.
6. Use the defined terms as the documents define them. Quote the definition when a value depends on one.
Return your answer only by calling the record_terms tool.`;

export const VERIFY_PROMPT = `You are the second reviewer. For each term below, check against the documents:
(a) the quote appears verbatim in the cited document, clause and page;
(b) the quote actually supports the recorded value, with nothing added;
(c) no other clause modifies or contradicts it.
Return "verified" only if all three hold; otherwise "needs_decision" with a one-sentence reason. Call the record_verification tool.`;

export const recordTermsTool = {
  name: "record_terms",
  description: "Record each economic term found in the fund documents.",
  input_schema: {
    type: "object",
    properties: {
      terms: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string", enum: TERM_KEYS.map(([k]) => k) },
            status: { type: "string", enum: ["extracted", "not_found", "ambiguous"] },
            value: { type: "string" },
            document: { type: "string" },
            clause: { type: "string" },
            page: { type: "integer" },
            quote: { type: "string" },
            readings: {
              type: "array",
              items: {
                type: "object",
                properties: { value: { type: "string" }, document: { type: "string" }, clause: { type: "string" }, page: { type: "integer" }, quote: { type: "string" } },
                required: ["value", "clause", "page", "quote"],
              },
            },
          },
          required: ["key", "status"],
        },
      },
      side_letter_terms: {
        type: "array",
        items: {
          type: "object",
          properties: { investor: { type: "string" }, term: { type: "string" }, value: { type: "string" }, clause: { type: "string" }, page: { type: "integer" }, quote: { type: "string" } },
          required: ["investor", "term", "value", "quote"],
        },
      },
    },
    required: ["terms"],
  },
} as const;

export const recordVerificationTool = {
  name: "record_verification",
  description: "Record the verification result for each term.",
  input_schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: { key: { type: "string" }, verdict: { type: "string", enum: ["verified", "needs_decision"] }, reason: { type: "string" } },
          required: ["key", "verdict"],
        },
      },
    },
    required: ["results"],
  },
} as const;
