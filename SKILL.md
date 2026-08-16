---
name: agentic-abi
description: Create, explain, validate, enrich, or version a ReLocke Agentic ABI for a token or other smart contract, including chain-specific token source and deployment planning, ui.contract metadata, safe SVG token icons, action and table semantics, source provenance, external triggers, side effects, and SemVer. Use for ReLocke contract surfaces on WAX, Vaulta, XPR Network, XRP Ledger, and Jungle testnet.
---

# Agentic ABI

Create a standard executable interface plus enough verified semantic context for ReLocke, humans, and other agents to understand the contract safely.

Keep executable truth and descriptive context separate. Treat deployed code, live ABI, permissions, state, and explicit user intent as authoritative.

## Required references

- Read [`references/convention.md`](references/convention.md) before adding or changing ReLocke clauses.
- Read [`references/chains.md`](references/chains.md) before selecting a deployment target or generating a ReLocke account URL.
- Read [`references/token-contract.md`](references/token-contract.md) before creating, upgrading, or deploying a token contract.

## Explain progressively

When introducing Agentic ABI, explain the layers in this order:

1. Describe the Ricardian contract as the readable document that records
   participant intent, rights, duties, risks, and expected consequences.
2. Describe source code as what developers write and WASM as the compiled
   program that the supported blockchain executes.
3. Describe the ABI as the map of callable actions and serialized data.
4. Describe Agentic ABI as the semantic extension that connects the readable
   terms to actions, tables, token icons, payable flows, side effects, source,
   and versions for ReLocke, applications, machines, and LLMs.
5. Only then introduce clause IDs, frontmatter, serialization, validation,
   deployment, and update mechanics.

For a lay audience, say that a preserved Ricardian document can be presented
as evidence supporting a legal argument about participant intent. Do not say
that deployment guarantees admissibility, enforceability, or a binding
agreement; a court or other legal process determines its effect under the
applicable facts and law.

## Workflow

### 1. Classify the target

Resolve the exact network before generating code:

- Select the ReLocke chain profile for WAX, Vaulta, XPR Network, XRP Ledger, or Jungle testnet.
- Do not assume that account names, ABI formats, actions, permissions, or deployment artifacts are portable between profiles.
- Do not treat XRP Ledger as XPR Network. XRPL uses issuer accounts and trust lines instead of ReLocke's account-deployed token-contract workflow.
- Stop and identify the mismatch when the user says `XRP` but the supplied account, tooling, or chain configuration indicates `XPR`.

### 2. Gather the contract brief

Establish:

1. Exact chain and deployment account.
2. Evidence that the account exists and the user controls the required permissions.
3. New deployment or upgrade of existing code.
4. Token display name, uppercase symbol code, precision, maximum supply, issuer, and proposed initial issue.
5. Contract purpose, intended users, and every substantial capability.
6. Source repository, immutable revision when available, and license.
7. Icon artwork and ownership or licensing status.
8. Required authorizations, tables, notifications, inline actions, RAM payers, external dependencies, side effects, and failure conditions.
9. Current ABI, WASM hash, table state, and migration requirements for an upgrade.
10. Desired contract SemVer and the reason for the version change.

Do not invent missing facts from names or ABI structure. Label facts as verified from source, verified on-chain, contract-authored documentation, or user-supplied intent.

### 3. Build the executable token interface

For a ReLocke-supported account-deployed token contract:

- implement `create`, `issue`, `retire`, `transfer`, `open`, and `close`;
- implement `accounts` and `stat` tables with standard asset and symbol behavior;
- enforce valid symbol/precision, positive quantities, supply limits, account existence, memo limits, and required authorization;
- identify the RAM payer for row creation and removal;
- document transfer notifications and every inline or external action;
- keep chain-specific system behavior in build profiles rather than silently changing the public ABI; and
- preserve existing table layouts or provide an explicit migration for upgrades.

Do not substitute prose for serialization rules. Generate transactions only from the actual deployed ABI.

### 4. Add the Agentic ABI layer

Preserve the standard ABI and add:

- exactly one `ui.contract` overview clause;
- at most one validated `ui.contract.icon` clause;
- a Ricardian contract on every public action;
- one `table.<name>` clause for each public table that needs semantic context;
- `external.<stable-id>` clauses for notifications, payable flows, or actions on other contracts that trigger behavior; and
- security or migration clauses when permissions or upgrade behavior are not visible from the ABI.

Set `schema: relocke.ui/1`, `spec-version`, and `contract-version` in the overview. Add repository and immutable revision context only when verified.

Associate the icon with a token only when `symbol-code` exactly matches a verified symbol issued by this chain/account. Otherwise use the icon only as contract identity.

Treat Ricardian content as a bridge between human-readable terms,
machine-readable semantics, and the identified executable interface. Keep
those layers connected, but never claim that prose changes serialization or
grants transaction authority.

### 5. Describe side effects explicitly

For every action or external trigger, document:

- required authorization and signer role;
- preconditions and accepted values;
- tables and rows created, modified, or erased;
- token balances and supply changed;
- RAM charged or refunded;
- notifications and inline actions emitted;
- external systems or operators relied upon;
- irreversible or cross-chain consequences;
- failure conditions and whether the transaction remains atomic; and
- behavior that occurs later in a separate transaction.

Never claim that documentation proves runtime behavior. Verify claims against source and live state.

Do not claim that a Ricardian clause is automatically legally binding. Before
describing it as an agreement, distinguish shared social commitments from legal
enforceability and identify the evidence for document integrity, participant
identity, notice, assent, capacity, governing law, and required formalities.

### 6. Apply SemVer

Maintain two versions:

- `spec-version`: version of this Agentic ABI convention used by the document.
- `contract-version`: version of the deployed contract implementation.

Recommend:

- major for incompatible action, table, permission, side-effect, symbol, or migration changes;
- minor for backward-compatible actions, tables, metadata, or capabilities; and
- patch for compatible fixes or documentation corrections.

Explain the classification. Do not auto-increment a version without inspecting the previous deployed contract.

### 7. Validate before proposing deployment

Run:

```bash
node scripts/validate-agentic-abi.mjs <abi.json>
```

Then verify manually:

- exact chain/account identity;
- complete current ABI retrieval;
- reproducible build and expected WASM/ABI hashes;
- source-to-deployment provenance;
- action, table, clause, and symbol mappings;
- safe SVG constraints;
- permission and RAM consequences;
- state migrations and rollback limits; and
- ReLocke rendering at `/accounts/<chain-slug>/<account>/smart-contract`.

### 8. Require review before execution

Present the complete source diff, ABI, validation results, build hashes, permission plan, migration plan, proposed transactions, and side-effect summary.

Do not sign, broadcast, deploy, change permissions, create supply, or issue tokens unless the user explicitly approves that consequential action with the exact chain/account and final parameters.

After deployment, re-fetch the ABI and code hash, verify live tables and permissions, and inspect the ReLocke surface.

## Output contract

Return:

1. **Target:** network, account, environment, and account URL.
2. **Token:** name, symbol, precision, maximum supply, issuer, and initial issue.
3. **Version:** previous and proposed contract SemVer with rationale.
4. **Source:** repository, revision, build profile, and artifact hashes.
5. **Interface:** actions, tables, types, and clauses added or preserved.
6. **Side effects:** authorization, state, balances, supply, RAM, notifications, external actions, and failures.
7. **Validation:** automated and manual checks with unresolved warnings.
8. **Deployment plan:** unsigned steps awaiting approval, or post-deployment verification when already authorized.

## Example request

```text
Create a ReLocke-supported token contract for account <account> on Jungle.
Use symbol EXAMPLE with precision 4 and maximum supply 1000000000.0000 EXAMPLE.
The issuer is <issuer>. Add a safe token icon, verified source repository,
complete side-effect documentation, and contract version 1.0.0. Produce the
source, ABI, build and permission plan, but do not deploy.
```
