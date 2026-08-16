# Chain targets

Use this reference before selecting a build profile, deployment workflow, bridge identifier, or ReLocke route.

## Supported Antelope targets

The current ReLocke token-contract source defines these bridge identifiers:

| Bridge ID | Target | Environment | Agentic ABI |
| ---: | --- | --- | --- |
| `-1` | Jungle testnet | Test | Full Antelope ABI and deployment workflow. |
| `0` | Vaulta | Production | Full Antelope ABI and deployment workflow. |
| `1` | WAX | Production | Full Antelope ABI and deployment workflow. |
| `2` | Telos | Production | Full Antelope ABI and deployment workflow. |
| `3` | XPR Network | Production | Full Antelope ABI and deployment workflow. |

Treat bridge IDs as protocol values, not universal chain identifiers. Revalidate them against the deployed contract version before constructing a bridge memo or transaction.

Vaulta is the current network identity for the chain historically known as EOS. Use the chain slug exposed by ReLocke rather than inventing an alias. The verified example is:

```text
https://relocke.io/accounts/vaulta/rloc/smart-contract
```

Construct other account routes only from a chain slug that the current ReLocke application exposes:

```text
https://relocke.io/accounts/<chain-slug>/<account>/smart-contract
```

Do not assume that a bridge ID and web route slug are interchangeable.

## XPR Network is not XRP Ledger

`XPR Network` is an Antelope-based network and can use EOSIO-style accounts, WASM contracts, ABIs, actions, tables, and Ricardian clauses.

`XRP Ledger` (XRPL) is a different ledger. Fungible tokens on XRPL use an issuer account, currency code, account settings, trust lines, and ledger transactions. There is no account-deployed Antelope token WASM or EOSIO ABI.

When the user asks for `XRP`:

1. Ask whether they mean XPR Network or XRP Ledger when context is ambiguous.
2. Use the full Agentic ABI contract workflow only for XPR Network.
3. For XRPL, produce a separate issuer-token descriptor and transaction plan.
4. Do not generate `setcode`, `setabi`, `eosio.token`, Antelope account names, or Antelope bridge IDs for XRPL.
5. Do not claim that the current ReLocke Antelope smart-contract surface renders XRPL tokens unless the live application and chain configuration verify that support.

## Environment rules

- Prefer Jungle for first deployment, permission, migration, and rendering tests.
- Never reuse production keys in a test environment.
- Treat every chain's system contracts, native token, account rules, resource model, finality, RPC endpoints, and permission graph as chain-specific live configuration.
- Re-fetch the ABI and code hash from the target chain immediately before comparing or upgrading a contract.
- Verify the destination account exists on the destination Antelope chain before promising that bridged funds are usable, even when a source contract accepts the account name syntactically.
