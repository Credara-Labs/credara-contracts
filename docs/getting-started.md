# Getting Started

## Prerequisites

- Node.js 22 or newer
- npm

## Install

```bash
npm install
```

## Compile

```bash
npm run compile
```

## Test

```bash
npm run test
```

## Run a Local Deployment

Start a local Hardhat node:

```bash
npm run node
```

Deploy in another terminal:

```bash
npm run deploy:local
```

## Environment

Copy `.env.example` to `.env` only for local development. Never commit `.env`, private keys, real RPC credentials, or deployment secrets.
