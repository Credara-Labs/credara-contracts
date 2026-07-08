# Privacy Model

Credara Contracts is designed to avoid placing sensitive academic records on-chain.

## What Stays Off-Chain

- Student answers
- Raw exam submissions
- Full names, email addresses, phone numbers, and government identifiers
- Transcripts, scores, grades, and detailed assessment records
- Certificate PDFs or private credential files
- Issuer operational records and identity verification documents

## What Is Stored On-Chain

- Hash of a certificate identifier
- Hash of a result record
- Issuer address
- Issued-to wallet address
- Issue and expiry timestamps
- Credential status
- Hash of issuer name in the issuer record

## Why Hashes Are Used

Hashes allow a verifier to compare supplied off-chain data with a public commitment. If the verifier receives a certificate package, the verifier can hash it and check whether the hash matches the on-chain proof. This avoids publishing the private data itself.

## Risks of Putting Sensitive Student Data On-Chain

Public blockchain data is broadly visible, copied by many systems, and difficult or impossible to delete. Publishing student answers, grades, personal identifiers, or private academic records can create long-term privacy, consent, compliance, and safety risks. Even encrypted data can become risky if keys are leaked or cryptography weakens over time.

## Hashing Limitations

Hashes are not magic privacy shields. If the original data is predictable, someone may guess possible inputs and compare hashes. Production systems should use strong off-chain data handling, domain separation, salting or keyed commitments where appropriate, and clear consent flows.
