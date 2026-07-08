# Architecture

Credara Contracts separates private academic data from public verification proofs.

## Components

- `CredaraCredentialRegistry`: the Solidity contract that stores issuer records and certificate proof hashes.
- Issuer systems: off-chain systems operated by authorized institutions or demo issuers.
- Credential holder tools: off-chain wallets, portals, or apps that hold certificate details and result records.
- Verifier systems: off-chain APIs or apps that hash supplied data and compare it against on-chain proofs.

## Data Flow

1. A trusted owner registers an issuer address with a hashed issuer name.
2. The issuer creates a certificate and result record off-chain.
3. The issuer hashes the certificate identifier and result record.
4. The issuer registers the proof hashes on-chain.
5. A verifier receives an off-chain credential package from the holder.
6. The verifier recomputes hashes and checks the registry.

## Trust Model

The registry proves that a registered issuer address published a proof at a point in time. It does not prove that the off-chain academic process was correct. Issuer governance, identity checks, and record custody remain off-chain responsibilities.
