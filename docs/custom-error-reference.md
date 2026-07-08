# Custom Error Reference

`CredaraCredentialRegistry` uses Solidity custom errors so callers can distinguish authorization failures, invalid inputs, duplicate records, and missing records without parsing revert strings.

## Access Control

### `OnlyOwner()`

Occurs when a non-owner calls an owner-only function such as `registerIssuer` or `deactivateIssuer`.

Integration handling: show an authorization failure and do not retry unless the transaction is sent by the registry owner.

### `OnlyActiveIssuer()`

Occurs when an address that is not an active issuer calls `registerCertificateProof`.

Integration handling: ask the issuer to complete registration or reactivate the issuer before submitting certificate proofs.

### `NotAuthorizedRevoker()`

Occurs when an address other than the registry owner or original issuer calls `revokeCertificateProof`.

Integration handling: block the revoke action in the UI unless the connected wallet is the owner or the issuer stored on the proof.

## Invalid Inputs

### `InvalidAddress()`

Occurs when a required address argument is the zero address, such as `issuerAddress` or `issuedTo`.

Integration handling: validate wallet addresses before building the transaction.

### `InvalidHash()`

Occurs when `nameHash`, `certificateIdHash`, or `resultHash` is `bytes32(0)`.

Integration handling: ensure off-chain hash generation completed successfully before submitting the transaction.

### `InvalidExpiry()`

Occurs when `expiresAt` is less than or equal to the current block timestamp.

Integration handling: require future expiry timestamps and account for clock differences between the client and chain.

## Issuer State

### `IssuerAlreadyRegistered(address issuer)`

Occurs when the owner tries to register an issuer address that already has an issuer record.

Integration handling: offer deactivate/reactivate-oriented workflows instead of creating a duplicate issuer.

### `IssuerNotRegistered(address issuer)`

Occurs when reading or deactivating an issuer address that has no issuer record.

Integration handling: prompt registration first, or treat the address as inactive in read-only views.

### `IssuerAlreadyInactive(address issuer)`

Occurs when the owner tries to deactivate an issuer that is already inactive.

Integration handling: refresh issuer state before sending duplicate deactivate transactions.

## Certificate Proof State

### `CertificateAlreadyRegistered(bytes32 certificateIdHash)`

Occurs when an active issuer tries to register a proof for a certificate hash that already exists.

Integration handling: treat certificate IDs as immutable and use a new certificate ID for replacement credentials.

### `CertificateNotFound(bytes32 certificateIdHash)`

Occurs when reading, revoking, or checking status for a proof that has not been registered.

Integration handling: show a not-found verification result and avoid presenting it as a revoked or expired credential.

### `CertificateAlreadyRevoked(bytes32 certificateIdHash)`

Occurs when a caller tries to revoke a proof whose status is already `REVOKED`.

Integration handling: refresh proof state after revocation and disable duplicate revoke actions.

## Recommended Client Flow

1. Pre-validate addresses, hashes, and expiry timestamps before sending transactions.
2. Read issuer and certificate proof state before write actions.
3. Map custom errors to specific UI messages instead of showing a generic transaction failure.
4. For verification, distinguish not found, revoked, expired, inactive issuer, and result mismatch states.
