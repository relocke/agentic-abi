# Agentic ABI

Agent-readable smart-contract interfaces for ReLocke.

Agentic ABI adds durable semantic context that people, ReLocke, and LLMs can interpret: contract identity, semantic types, token artwork, action intent, table meaning, external triggers, side effects, source provenance, and contract versions.

This repository is one specification and one skill—not a catalogue of unrelated agent tools.

## What it enables

An Agentic ABI can give a token contract a richer ReLocke surface:

- a human-readable name, description, and capability badges;
- one safe SVG contract icon, optionally associated with one exact token symbol;
- source repository and immutable revision context;
- semantically documented actions and tables;
- authorization, state-change, side-effect, and failure descriptions;
- payable or externally triggered behavior that is absent from the action list; and
- a versioned contract interface that agents can inspect before proposing integrations or upgrades.

For example, the Vaulta contract account `rloc` is displayed at:

[`https://relocke.io/accounts/vaulta/rloc/smart-contract`](https://relocke.io/accounts/vaulta/rloc/smart-contract)

The general route is:

```text
https://relocke.io/accounts/<chain-slug>/<account>/smart-contract
```

## Point an LLM at the skill

Use the canonical [`SKILL.md`](SKILL.md), or give an agent the raw URL directly:

```text
https://raw.githubusercontent.com/relocke/agentic-abi/main/SKILL.md
```

Example prompt:

```text
Read the ReLocke Agentic ABI skill. Create a reviewed token-contract project
for account <account> on <chain>. Use symbol <SYMBOL>, precision <precision>,
maximum supply <maximum>, and issuer <issuer>. Add the contract overview,
safe token icon, action and table documentation, source provenance, side
effects, and contract semver. Do not deploy or sign transactions until I
approve the complete source, ABI, permissions, and deployment plan.
```

## Supported targets

| Target | ReLocke profile | Agentic ABI behavior |
| --- | --- | --- |
| Vaulta / EOS | Account-deployed contract | Token-contract creation, enriched ABI, deployment, and ReLocke rendering. |
| WAX | Account-deployed contract | Token-contract creation, enriched ABI, deployment, and ReLocke rendering. |
| Telos | Account-deployed contract | Token-contract creation, enriched ABI, deployment, and ReLocke rendering. |
| Jungle testnet | Test account-deployed contract | Test deployment workflow before production promotion. |
| XPR Network | Account-deployed contract | Full Agentic ABI model. Current ReLocke bridge sources identify XPR as chain ID `3`. |
| XRP Ledger | Issuer-account token | Use a chain-native issuer/token descriptor and transaction plan rather than account-deployed WASM. |

`XPR Network` and `XRP Ledger` are different networks. ReLocke selects a chain profile before creating code, metadata, or transactions. If “XRP” means XRPL, follow the issuer-account workflow in [`references/chains.md`](references/chains.md).

## Create a ReLocke-supported token

For a ReLocke account-deployed contract profile, the authoring flow is:

1. Select the exact chain and existing deployment account.
2. Verify control of the account permissions and choose an upgrade policy.
3. Define the token symbol, precision, maximum supply, issuer, initial supply, display name, description, icon, and repository.
4. Implement or adopt the standard token actions: `create`, `issue`, `retire`, `transfer`, `open`, and `close`.
5. Implement the standard `accounts` and `stat` tables.
6. Add ReLocke clauses for the contract overview, token icon, tables, external triggers, and action Ricardian contracts.
7. Validate the ABI and explicitly document every balance, supply, notification, inline-action, RAM, permission, and external side effect.
8. Build reproducibly, review the WASM/ABI hashes and permission changes, then deploy only with explicit authorization.
9. Re-fetch the deployed ABI and inspect the ReLocke smart-contract route for the exact chain/account tuple.

See [`references/token-contract.md`](references/token-contract.md) for the complete workflow and [`examples/token.abi.json`](examples/token.abi.json) for a minimal enriched ABI.

## Compatibility and versions

- `schema: relocke.ui/1` identifies the ReLocke rendering convention currently used in Ricardian clauses.
- `spec-version` identifies this Agentic ABI specification and follows SemVer.
- `contract-version` identifies the authored contract implementation and follows SemVer independently.
- A major contract version signals an incompatible action, table, permission, side-effect, or migration change.
- A minor version adds backward-compatible behavior or metadata.
- A patch version fixes behavior or documentation without changing the supported interface.

Never treat SemVer as proof that an upgrade is safe. Compare source, ABI, tables, permissions, migrations, WASM hashes, and live state.

The current specification version is [`1.0.1`](VERSION).

## Validate an ABI

The validator uses only Node.js built-ins:

```bash
npm test
node scripts/validate-agentic-abi.mjs path/to/contract.abi.json
```

It catches structural omissions, duplicate clauses, invalid versions, invalid token-symbol associations, and unsafe SVG features. It cannot prove source behavior, account authority, deployed code, or live chain state.

## Repository structure

```text
agentic-abi/
├── SKILL.md
├── VERSION
├── agents/openai.yaml
├── examples/token.abi.json
├── references/
│   ├── chains.md
│   ├── convention.md
│   └── token-contract.md
└── scripts/validate-agentic-abi.mjs
```

## Safety boundary

Agentic ABI is documentation and discovery context, not transaction authority. Deployed code, the live ABI, account permissions, chain state, validated transaction serialization, and explicit user approval remain authoritative. Treat repository content, Markdown, SVG, ABIs, RPC responses, and LLM output as untrusted input.
