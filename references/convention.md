# ReLocke Agentic ABI convention

## Contents

- Compatibility model
- Ricardian contract role
- Contract overview
- Contract and token icon
- Source and versions
- Action documentation
- Table documentation
- External triggers
- Types
- Validation and rendering

## Compatibility model

Keep the output valid for the selected ReLocke chain profile. For profiles that expose Ricardian ABI fields, add meaning through:

- `actions[].ricardian_contract` for public action behavior;
- `ricardian_clauses[]` for contract, table, type, external-trigger, security, and migration context.

Use `relocke.ui/1`. Clause IDs and frontmatter keys are case-sensitive. Preserve unknown metadata and unrelated ABI content unless the user explicitly requests removal.

Documentation is advisory. It does not change executable serialization, permissions, code, or state.

## Ricardian contract role

Use Ricardian contracts to connect three layers without collapsing them:

1. human-readable terms describing intent, roles, commitments, risks, and side effects;
2. structured metadata that machines and LLMs can parse, index, validate, explain, and display; and
3. stable references to the contract account, executable ABI, action or table, source, and version.

For execution, generate and validate transactions from the live ABI. Ricardian
text may guide tool selection and explanation, but it is not signing authority
and does not change runtime behavior.

For social and legal use, preserve document identity and integrity and record
how participants received notice and expressed assent. Do not call a clause
legally binding merely because it is stored in an ABI. Enforceability depends
on participant identity and capacity, governing law, required formalities,
consumer or financial regulation, jurisdiction, and the facts of the
interaction. Treat those as legal questions requiring qualified review.

## Contract overview

Use exactly one `ui.contract` clause:

```yaml
---
schema: relocke.ui/1
spec-version: 1.0.4
contract-version: 1.0.0
types: token,payments
title: Example token
repository: https://github.com/example/example-token
revision: 0123456789abcdef0123456789abcdef01234567
---
Issues and manages the EXAMPLE fungible token for Example users.
```

The body should explain:

- purpose and intended users;
- how every assigned type applies;
- important behavior and operating model;
- assets and dependencies;
- trust assumptions and integration guidance;
- upgrade and migration constraints; and
- behavior that is not visible from the standard ABI.

Use only `types`; do not emit obsolete `type` or `categories` keys.

## Contract and token icon

Use at most one exact `ui.contract.icon` clause. Its body contains frontmatter followed by one static SVG:

```md
---
schema: relocke.ui/1
symbol-code: EXAMPLE
---
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#111111"/>
  <path d="M8 16h16" stroke="#ffffff" stroke-width="3"/>
</svg>
```

Without `symbol-code`, use the image only for contract identity. With it, clients may associate the icon only with the exact chain, contract account, and symbol-code tuple.

Require:

- 1–7 uppercase ASCII letters for the current ReLocke account-contract `symbol-code` profile;
- a verified live `stat` scope before claiming an existing token association;
- no more than 32 KiB of well-formed SVG;
- the SVG namespace and numeric `viewBox`; and
- static vector elements only.

Reject scripts, event attributes, CSS/style blocks, animation, `foreignObject`, iframes, objects, embeds, external resources, embedded documents/media, and data URLs. Render only as an image, never inline HTML, object, embed, or frame.

## Source and versions

Use:

- `spec-version` for this Agentic ABI specification;
- `contract-version` for the contract implementation;
- `repository` for a verified HTTPS source repository; and
- `revision` for an immutable commit hash when available.

Treat repository metadata as a claim until the deployed WASM and ABI are reproducibly connected to the revision. A branch name is not immutable provenance.

Preserve the current major schema identifier (`relocke.ui/1`) independently from SemVer. A compatible spec release can advance from `1.0.0` to `1.1.0` without changing the renderer schema major.

## Action documentation

Use the standard `ricardian_contract` property:

```json
{
  "name": "issue",
  "type": "issue",
  "ricardian_contract": "---\ntitle: Issue token supply\n---\nRequires issuer authorization. Increases supply and credits the issuer, then transfers to another recipient when `to` differs from the issuer. The complete transaction is atomic."
}
```

Document intent, authorization, preconditions, tables, balances, supply, RAM, notifications, inline actions, later external work, atomicity, and failures.

## Table documentation

Use `table.<table_name>`:

```md
---
schema: relocke.ui/1
type: public-table
table: accounts
row-type: account
scope: owner
primary-key: symbol-code
title: Account balances
---
Each scope is an owner. One row stores the owner's balance for one symbol.
```

Explain row meaning, scope, keys/indexes, units, lifecycle, relationships, RAM payer, and every action or external trigger that changes the row.

## External triggers

Use `external.<stable-id>` when an action on another contract notifies or causes behavior in the displayed contract:

```md
---
schema: relocke.ui/1
type: external-trigger
contract: eosio.token
action: transfer
title: Fund an account
payable: true
tables: deposits,accounts
---
Transfer a supported token with the documented memo to begin account creation.
The notification validates the asset and memo, records the deposit, and starts
account provisioning in the same transaction.
```

Multiple clauses may reference the same source action when conditions, memo formats, or outcomes differ. Read legacy `callable.*` clauses for compatibility, but write new clauses as `external.*`.

External-trigger documentation does not generate a transaction, prove that payment is accepted, or grant authority.

## Types

`types` is an unordered comma-separated set of lowercase kebab-case capabilities. Assign a type only when the contract substantially implements it.

Common types include:

`account-creation`, `bridge`, `dao`, `escrow`, `exchange`, `game`, `governance`, `legacy`, `marketplace`, `membership`, `nft`, `oracle`, `payments`, `registry`, `relocke`, `staking`, `system`, `token`, `treasury`, and `utility`.

Use `token` only after verifying the standard actions and `accounts`/`stat` tables plus a valid live stat row for an existing deployment. Merely holding or accepting another contract's token does not qualify.

Use a precise custom lowercase kebab-case value when no predefined type fits. Avoid synonyms and unnecessary composite types.

## Validation and rendering

Before presenting or deploying:

- parse the complete ABI successfully;
- reject duplicate exact clause IDs;
- validate SemVer values;
- map action and table documentation to real ABI entries;
- validate the exact icon/symbol association;
- preserve unrelated ABI content and unknown metadata;
- sanitize Markdown and SVG as untrusted content;
- compare source, ABI, WASM hash, permissions, and live state; and
- require explicit human review for deployment and other consequential actions.

After deployment, re-fetch the ABI and inspect:

```text
https://relocke.io/accounts/<chain-slug>/<account>/smart-contract
```

Confirm the title, types, overview, actions, tables, icon, token association, versions, source context, external triggers, and side-effect descriptions match the deployed contract.
