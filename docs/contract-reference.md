# Contract Reference

## Contract

`CredaraCredentialRegistry`

## Statuses

- `VALID`: the proof is not revoked and has not expired.
- `REVOKED`: the owner or original issuer revoked the proof.
- `EXPIRED`: the current block timestamp is greater than or equal to `expiresAt`.

## Functions

### `registerIssuer(address issuerAddress, bytes32 nameHash)`

Owner-only. Registers an issuer address with a hashed issuer name and active status.

### `deactivateIssuer(address issuerAddress)`

Owner-only. Marks an issuer inactive. Inactive issuers cannot register new certificate proofs, and proofs from inactive issuers fail valid verification.

### `registerCertificateProof(bytes32 certificateIdHash, bytes32 resultHash, address issuedTo, uint256 expiresAt)`

Active-issuer-only. Stores a certificate proof using hashes and minimal metadata.

### `revokeCertificateProof(bytes32 certificateIdHash)`

Allows the registry owner or the original issuing address to revoke a proof.

### `getIssuer(address issuerAddress)`

Returns the issuer record or reverts if the issuer is not registered.

### `getCertificateProof(bytes32 certificateIdHash)`

Returns the certificate proof with computed expired status when applicable.

### `certificateProofExists(bytes32 certificateIdHash)`

Returns whether a proof exists.

### `isIssuerActive(address issuerAddress)`

Returns whether an issuer is registered and active.

### `isCertificateRevoked(bytes32 certificateIdHash)`

Returns whether a proof has been revoked.

### `isCertificateExpired(bytes32 certificateIdHash)`

Returns whether a proof exists and has reached its expiry timestamp.

### `certificateStatus(bytes32 certificateIdHash)`

Returns `VALID`, `REVOKED`, or `EXPIRED`.

### `resultHashMatches(bytes32 certificateIdHash, bytes32 resultHash)`

Returns whether the provided result hash matches the stored proof.

### `isCertificateValid(bytes32 certificateIdHash)`

Returns true only when the proof exists, is not revoked, is not expired, and was issued by an active issuer.

### `verifyCertificate(bytes32 certificateIdHash, bytes32 expectedResultHash)`

Returns a verification tuple containing proof existence, validity, revocation, expiry, issuer activity, result match, and status.

## Events

- `IssuerRegistered(address indexed issuer, bytes32 indexed nameHash, uint256 createdAt)`
- `IssuerDeactivated(address indexed issuer, uint256 deactivatedAt)`
- `CertificateProofRegistered(bytes32 indexed certificateIdHash, bytes32 indexed resultHash, address indexed issuer, address issuedTo, uint256 issuedAt, uint256 expiresAt)`
- `CertificateProofRevoked(bytes32 indexed certificateIdHash, address indexed revokedBy, uint256 revokedAt)`

## Errors

- `OnlyOwner()`
- `OnlyActiveIssuer()`
- `NotAuthorizedRevoker()`
- `InvalidAddress()`
- `InvalidHash()`
- `InvalidExpiry()`
- `IssuerAlreadyRegistered(address issuer)`
- `IssuerNotRegistered(address issuer)`
- `IssuerAlreadyInactive(address issuer)`
- `CertificateAlreadyRegistered(bytes32 certificateIdHash)`
- `CertificateNotFound(bytes32 certificateIdHash)`
- `CertificateAlreadyRevoked(bytes32 certificateIdHash)`

See [Custom Error Reference](custom-error-reference.md) for when each error occurs and how client integrations should handle it.

## Example Verification Flow

1. A holder shares an off-chain certificate package with a verifier.
2. The verifier hashes the certificate identifier and result record using the agreed off-chain scheme.
3. The verifier calls `verifyCertificate(certificateIdHash, expectedResultHash)`.
4. The verifier accepts the proof only if `exists`, `valid`, `activeIssuer`, and `resultMatches` are true.
5. If `revoked` or `expired` is true, the verifier rejects the credential or requests updated issuer evidence.
