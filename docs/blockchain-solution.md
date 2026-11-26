# Blockchain Solution — tokenized share registers (prototype)

Status: prototype for owner review (26 Nov 2026), `redesign` branch. **Simulation**: no blockchain, wallet, key or money is involved; addresses, transactions and blocks are simulated and labelled.

## What it is

A register service for companies Aurum forms (Corporate Solution) or administers (family holding companies): the owners' shares, units or quotas become tokens held in their own wallets. It is **not an offering** — nothing is sold or distributed. Raising money from investors goes through the Offering Solution.

Tokens follow the ERC-3643 model: holders are verified identities (Compliance), every transfer is checked against the company's rules, and an agent can freeze or recover tokens with a reason, approval and audit entry.

## What the token legally is (counsel confirms each company)

- **Legal record**: Delaware corporations (DGCL §219 and §224 permit the stock ledger on a distributed ledger); Wyoming corporations (articles or bylaws may provide for certificate tokens).
- **Record by agreement**: Delaware and Wyoming LLCs whose operating agreement adopts the token ledger.
- **Register mirror**: Brazil (quota transfers need the contrato social amendment registered at the Junta Comercial), Cayman, BVI, Florida and others — the official register stays the record and the token follows it.

## Screens

- **Tokenized companies** (`/admin/blockchain`): every token, what it legally is, status, supply, holders, and whether the token agrees with the register.
- **Tokenize a company** (`/admin/blockchain/tokenize`): pick a company the firm administers → what the token will be → holders from the register → transfer rules from the company's documents → review. Then sign the documents, verify identities, connect wallets and issue.
- **Token detail** (`/admin/blockchain/[id]`): holders with wallets and frozen balances; token holdings against the official register, with the reason for each difference; the rules in plain English and a "test a transfer" check that explains each rule's verdict; documents; simulated ledger activity; agent actions (freeze, unfreeze, recovery to a new wallet).
- **Transfers** (`/admin/blockchain/transfers`): gifts, estate planning and private sales the owner arranges, step by step — recipient's identity, company approval (and right of first refusal), signed agreement, register update where the token is a mirror, then the token move. Units are frozen on the seller's wallet until the transfer completes or is rejected. Aurum doesn't find buyers, set prices or handle money.
- **Owner's wallet** (client portal → Shares, and `/admin/blockchain/[id]/owner`): value on record, the wallet, each holding with available and frozen balances, transfer requests, history, holding statement; Transfer and Sell.
- **Secondary sales** (`/admin/blockchain/secondary`): selling to a buyer the owner hasn't found needs a licensed venue (US broker-dealer operating an ATS; CVM-authorized market in Brazil). Shown as not connected.

## Data

Companies come from Corporate Solution formations and the family office records. Halvorsen Holdings' value per unit comes from the family office records (net value held by the company). Holders, documents and the seed transfers are illustrative until the cap tables are confirmed. Stored in this browser (`aurum-chain-v1`).

## To make it real

Database and sign-in; ERC-3643 contracts (open source, GPL-3.0) on a test network; agent keys with a custody provider (paid, owner's choice); chain choice and gas; independent smart-contract audit; counsel's opinion per jurisdiction and on transfer-agent registration; licensed venue partner for secondary sales. New packages are listed with their licences for approval before installing.
