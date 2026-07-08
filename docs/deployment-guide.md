# Deployment Guide

This guide covers local deployment and future testnet deployment patterns. It intentionally does not include real private keys.

## Local Deployment

Install dependencies:

```bash
npm install
```

Start a local Hardhat node:

```bash
npm run node
```

Deploy in a second terminal:

```bash
npm run deploy:local
```

The deploy script prints the deployer address and deployed contract address.

## Future Testnet Deployment

Create a local `.env` file from `.env.example`:

```text
PRIVATE_KEY=
RPC_URL=
ETHERSCAN_API_KEY=
```

Use a funded testnet-only deployer key. Never reuse a mainnet treasury key, never commit `.env`, and never paste secrets into issues, pull requests, or documentation.

After configuring a testnet network in `hardhat.config.ts`, deploy with:

```bash
npx hardhat run scripts/deploy.ts --network testnet
```

## Post-Deployment Checklist

- Save the deployed address in a non-secret deployment note.
- Register only demo or authorized issuer addresses.
- Run a small end-to-end proof registration and verification test.
- Document the off-chain hashing scheme used by the application layer.
- Treat testnet deployments as demos unless the contracts receive an external audit.
