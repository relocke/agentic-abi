# Token-contract authoring and deployment

## Contents

- Required brief
- Standard interface
- Side-effect matrix
- Agentic ABI additions
- Build and deployment plan
- Upgrade policy
- Post-deployment verification

## Required brief

Collect:

- chain and deployment account;
- account permission owners and deployment authority;
- token name, symbol code, precision, maximum supply, issuer, and initial issue;
- whether recipients may open zero-balance rows in advance;
- RAM-payer policy;
- transfer memo policy;
- notification and integration requirements;
- source repository and license;
- SVG artwork rights and intended symbol association;
- existing code, ABI, tables, balances, supply, and permissions for upgrades; and
- contract version and upgrade/migration rationale.

Reject symbols outside 1–7 uppercase ASCII letters. Reject a maximum supply whose precision differs from the symbol precision. Do not issue supply until `create` has registered the exact symbol and issuer.

## Standard interface

Generate or preserve these public actions:

| Action | Required behavior |
| --- | --- |
| `create` | Require contract authority, register one symbol, maximum supply, and issuer; reject duplicates and invalid supply. |
| `issue` | Require issuer authority, increase current supply within maximum, and credit the issuer; optionally transfer atomically to `to`. |
| `retire` | Require issuer authority, reduce issuer balance and current supply. |
| `transfer` | Require sender authority, debit sender, credit recipient, and notify both parties. |
| `open` | Require RAM-payer authority and create an explicit zero-balance row for an owner/symbol. |
| `close` | Require owner authority and erase only a zero-balance row. |

Generate or preserve:

- `accounts`, scoped by owner and keyed by symbol code, storing `balance`; and
- `stat`, scoped by symbol code and keyed by symbol code, storing `supply`, `max_supply`, and `issuer`.

Preserve standard serialization and table layout unless a major-version migration explicitly replaces them.

## Side-effect matrix

Document at least:

| Operation | State and side effects |
| --- | --- |
| `create` | Creates a `stat` row; charges RAM to the contract; changes no balances or supply. |
| `issue` | Increases `stat.supply`; credits an `accounts` row; can create a row and charge RAM; may invoke `transfer` when recipient differs from issuer. |
| `retire` | Debits issuer balance and decreases supply; may erase a zero balance only if implementation explicitly does so. |
| `transfer` | Debits sender, credits recipient, may create recipient row, assigns a RAM payer, and emits sender/recipient notifications; notification failure reverts the transaction. |
| `open` | Creates a zero-balance row and charges the authorized RAM payer. |
| `close` | Erases a zero-balance row and refunds its RAM to the original payer. |
| Deploy/upgrade | Changes executable code and/or ABI for the account; may change future behavior without changing existing rows. |
| Permission change | Changes who can deploy or invoke linked actions; can permanently lock out recovery if misconfigured. |

Verify exact behavior against the implementation. Do not copy this matrix as an unverified claim.

For bridge, exchange, escrow, staking, fee, freeze, blacklist, transfer-tax, account-creation, or other extensions, add separate actions/clauses and describe every external operator, delayed transaction, replay rule, custody state, supply consequence, and failure mode.

## Agentic ABI additions

Add:

1. `ui.contract` with `types: token`, contract purpose, versions, and verified source.
2. `ui.contract.icon` with `symbol-code` only for the exact issued token the icon represents.
3. Action Ricardian contracts for all six standard actions and every extension action.
4. `table.accounts` and `table.stat` clauses.
5. `external.*` clauses for transfer notifications or payable flows implemented by the contract.
6. Security and migration clauses when permissions or table changes require operator knowledge.

Use [`../examples/token.abi.json`](../examples/token.abi.json) as a structural example, not as production code or a substitute for an audited implementation.

## Build and deployment plan

Produce an unsigned plan with:

1. Compiler/CDT version and chain build profile.
2. Clean reproducible build command.
3. Source revision, WASM hash, ABI hash, and validator result.
4. Current and proposed account permissions.
5. Current deployed code/ABI hashes for an upgrade.
6. Table migration and rollback plan.
7. `setcode` and `setabi` transactions or the chain tool's equivalent.
8. Post-deploy `create` parameters.
9. Optional `issue` parameters as a separate consequential transaction.
10. RPC re-fetch and ReLocke rendering checks.

Never include private keys. Do not sign or broadcast until the user approves the exact final plan.

Prefer this order for a new token:

1. Deploy and verify on Jungle.
2. Exercise every action, notification, failure, RAM path, and rendering field.
3. Audit source and deployment permissions.
4. Rebuild from the immutable production revision.
5. Deploy code and ABI to the production account.
6. Re-fetch and compare hashes.
7. Call `create` after reviewing symbol, precision, maximum supply, and issuer.
8. Call `issue` only after separate supply review.

## Upgrade policy

Compare the previous deployed contract before choosing SemVer:

- Major: incompatible ABI serialization, removed/renamed action, changed table layout/scope/key, permission incompatibility, changed supply semantics, newly irreversible side effect, or required state migration.
- Minor: backward-compatible action/table/capability or optional metadata addition.
- Patch: compatible bug fix, safer validation, or documentation correction.

Keep old rows readable until a reviewed migration completes. Document whether rollback is possible after new code writes new state.

## Post-deployment verification

Verify:

- account code and ABI hashes;
- account permissions and linked action permissions;
- parsed actions, structs, tables, and clauses;
- `stat` row symbol, precision, maximum supply, supply, and issuer;
- representative balance rows;
- token icon safety and exact association;
- source revision and build provenance;
- contract/spec versions;
- action/table/external-trigger rendering;
- side-effect and failure descriptions; and
- the ReLocke route for the exact chain/account.
