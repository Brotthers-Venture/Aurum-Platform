# Quarter close and reporting

Ideas taken from financial-reporting platforms (linked data, tie-outs, certification, roll forward), rebuilt in Aurum's own flows and words.

## Where it lives
- **Aurum:** Fund Solution → Reporting → Quarter close (`/admin/fund/quarter-close`), one workspace per fund and quarter (`/admin/fund/quarter-close/[fundId]?period=2026-Q3`).
- **Manager (GP) portal:** Reports page — answer valuation requests, review and approve packages (`/gp/[gpId]/reports/[fundId]`). Tasks also show in the bell and as a badge on Reports.
- **Investor portal:** Documents → Quarterly reporting (`/investor/[gpId]/documents/quarterly?fund=&period=`): the letter and the investor's own statement, once published.

## What it does
1. **Linked figures** (`src/lib/reporting/figures.ts`): every number in the letter is computed from the books as of the quarter end and opens its source — formula, ledger accounts, records, previous quarter.
2. **Tie-out checks:** capital equals net assets, paid-in ties to call notices, distributions tie to payments, ledger balances, fees agree with notices, valuations posted, documents match the books. Failing checks block review and publishing.
3. **Checklist with one next step:** close the books → valuations from the manager → checks → statements → letter → Aurum review → manager approval → publish. The banner always states the next action and its button.
4. **Review and sign-off:** Aurum reviewer approves or requests changes; the manager approves with a certification statement or requests changes. Approved packages are locked.
5. **Data requests:** Aurum asks the manager for fair value and commentary; the answer becomes a valuation adjustment and the letter's commentary.
6. **Roll forward:** a new quarter starts from the previous letter; figures relink to the new period; "Show previous quarter values" compares them.
7. **Comments** on any paragraph, with replies and resolve; open comments block review.
8. **Statements batch:** one statement per partner; closing capital is checked against fund NAV; published together with the letter.

## Change detection
Sending for review snapshots every figure. If a figure changes afterwards (e.g. a late valuation adjustment), it is highlighted, the "Documents match the books" check fails, the manager cannot approve, and an approval already given is withdrawn once the reviewer accepts the new figures.

## Storage
Until the database is connected, close state lives in the browser (`aurum-reporting-v1`) over deterministic seeds; actions are also written to the local audit log.
