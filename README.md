# Credara Contracts

Credara Contracts is a Solidity and Hardhat repository from Credara Labs for privacy-aware credential proof verification. It demonstrates how Web3 infrastructure can help verify exam results and certificates without putting student answers, raw scores, transcripts, or sensitive academic records on-chain.

## Overview

The core contract, `CredaraCredentialRegistry`, lets the contract owner register trusted issuers. Active issuers can publish certificate proof records made from hashes, wallet addresses, timestamps, and status fields. Anyone can later verify whether a proof exists, whether it is valid, revoked, expired, issued by an active issuer, and whether a supplied result hash matches the stored proof.

## Why Only Hashes Are Stored On-Chain

Blockchains are public and hard to erase. Storing private student answers or personal academic records on-chain would create permanent privacy risk. Credara Contracts stores hashes of certificate identifiers, issuer names, and result records so verifiers can compare proofs without exposing the underlying private content.

## Features

- Owner-managed issuer registration and deactivation.
- Active issuer certificate proof registration.
- Public verification helpers for proof existence, status, issuer activity, expiry, and result hash matching.
- Owner or original issuer revocation.
- Custom Solidity errors and explicit registry events.
- Hardhat, TypeScript, Ethers, Chai, and GitHub Actions CI.

## Smart Contract Summary

`CredaraCredentialRegistry.sol` supports issuer records with issuer address, name hash, active status, and creation timestamp. Certificate proof records include certificate ID hash, result hash, issuer, issued-to address, issued timestamp, expiry timestamp, and status.

Statuses:

- `VALID`
- `REVOKED`
- `EXPIRED`

## Quick Start

```bash
npm install
npm run compile
npm run test
```

## Commands

Compile:

```bash
npm run compile
```

Test:

```bash
npm run test
```

Run a local node:

```bash
npm run node
```

Deploy locally in another terminal:

```bash
npm run deploy:local
```

Typecheck:

```bash
npm run typecheck
```

## Project Structure

```text
credara-contracts/
+-- .github/
|   +-- ISSUE_TEMPLATE/
|   `-- workflows/
+-- contracts/
+-- docs/
+-- scripts/
+-- test/
+-- hardhat.config.ts
+-- package.json
`-- tsconfig.json
```

## Relationship to Credara Portal and Credara Verifier API

Credara Contracts is the on-chain proof layer. A Credara Portal could prepare certificate IDs, result records, issuer metadata, and student-facing workflows off-chain, then submit only hashes and minimal proof metadata to the registry. A Credara Verifier API could accept an off-chain credential package, hash the relevant fields, query this registry, and return a verification result without exposing private academic data publicly.

This repository is a demo and testnet-oriented contract package. It does not claim official affiliation with any blockchain ecosystem.

## Security Notes

- Do not store private student answers on-chain.
- Do not store sensitive personal data on-chain.
- Do not commit private keys or real deployment secrets.
- Hashes can still be vulnerable to guessing if source data has low entropy. Use salted or domain-separated off-chain hashing where appropriate.
- Treat testnet deployments as demos until the contracts receive a full external audit.
- Keep issuer operational keys secure and rotate compromised issuers by deactivating them.

## Roadmap

- Add role handover for registry ownership.
- Add optional issuer reactivation with strong audit events.
- Add batch proof registration for controlled issuer workflows.
- Add testnet deployment examples and verification scripts.
- Add formal threat model documentation.

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md`, open focused issues or pull requests, and ensure `npm run compile`, `npm run test`, and `npm run typecheck` pass before requesting review.

## License

MIT
