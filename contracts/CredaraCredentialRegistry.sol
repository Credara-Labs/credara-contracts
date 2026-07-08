// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Credara Credential Registry
/// @notice Stores privacy-aware hashes for credential verification without storing student answers or sensitive records.
contract CredaraCredentialRegistry {
    enum CertificateStatus {
        VALID,
        REVOKED,
        EXPIRED
    }

    struct Issuer {
        address issuerAddress;
        bytes32 nameHash;
        bool active;
        uint256 createdAt;
    }

    struct CertificateProof {
        bytes32 certificateIdHash;
        bytes32 resultHash;
        address issuer;
        address issuedTo;
        uint256 issuedAt;
        uint256 expiresAt;
        CertificateStatus status;
    }

    address public immutable owner;

    mapping(address issuer => Issuer record) private issuers;
    mapping(bytes32 certificateIdHash => CertificateProof proof) private certificateProofs;

    event IssuerRegistered(address indexed issuer, bytes32 indexed nameHash, uint256 createdAt);
    event IssuerDeactivated(address indexed issuer, uint256 deactivatedAt);
    event CertificateProofRegistered(
        bytes32 indexed certificateIdHash,
        bytes32 indexed resultHash,
        address indexed issuer,
        address issuedTo,
        uint256 issuedAt,
        uint256 expiresAt
    );
    event CertificateProofRevoked(bytes32 indexed certificateIdHash, address indexed revokedBy, uint256 revokedAt);

    error OnlyOwner();
    error OnlyActiveIssuer();
    error NotAuthorizedRevoker();
    error InvalidAddress();
    error InvalidHash();
    error InvalidExpiry();
    error IssuerAlreadyRegistered(address issuer);
    error IssuerNotRegistered(address issuer);
    error IssuerAlreadyInactive(address issuer);
    error CertificateAlreadyRegistered(bytes32 certificateIdHash);
    error CertificateNotFound(bytes32 certificateIdHash);
    error CertificateAlreadyRevoked(bytes32 certificateIdHash);

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert OnlyOwner();
        }
        _;
    }

    modifier onlyActiveIssuer() {
        if (!issuers[msg.sender].active) {
            revert OnlyActiveIssuer();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerIssuer(address issuerAddress, bytes32 nameHash) external onlyOwner {
        if (issuerAddress == address(0)) {
            revert InvalidAddress();
        }
        if (nameHash == bytes32(0)) {
            revert InvalidHash();
        }
        if (issuers[issuerAddress].createdAt != 0) {
            revert IssuerAlreadyRegistered(issuerAddress);
        }

        uint256 createdAt = block.timestamp;
        issuers[issuerAddress] = Issuer({
            issuerAddress: issuerAddress,
            nameHash: nameHash,
            active: true,
            createdAt: createdAt
        });

        emit IssuerRegistered(issuerAddress, nameHash, createdAt);
    }

    function deactivateIssuer(address issuerAddress) external onlyOwner {
        Issuer storage issuer = issuers[issuerAddress];
        if (issuer.createdAt == 0) {
            revert IssuerNotRegistered(issuerAddress);
        }
        if (!issuer.active) {
            revert IssuerAlreadyInactive(issuerAddress);
        }

        issuer.active = false;

        emit IssuerDeactivated(issuerAddress, block.timestamp);
    }

    function registerCertificateProof(
        bytes32 certificateIdHash,
        bytes32 resultHash,
        address issuedTo,
        uint256 expiresAt
    ) external onlyActiveIssuer {
        if (certificateIdHash == bytes32(0) || resultHash == bytes32(0)) {
            revert InvalidHash();
        }
        if (issuedTo == address(0)) {
            revert InvalidAddress();
        }
        if (expiresAt <= block.timestamp) {
            revert InvalidExpiry();
        }
        if (certificateProofs[certificateIdHash].issuedAt != 0) {
            revert CertificateAlreadyRegistered(certificateIdHash);
        }

        uint256 issuedAt = block.timestamp;
        certificateProofs[certificateIdHash] = CertificateProof({
            certificateIdHash: certificateIdHash,
            resultHash: resultHash,
            issuer: msg.sender,
            issuedTo: issuedTo,
            issuedAt: issuedAt,
            expiresAt: expiresAt,
            status: CertificateStatus.VALID
        });

        emit CertificateProofRegistered(certificateIdHash, resultHash, msg.sender, issuedTo, issuedAt, expiresAt);
    }

    function revokeCertificateProof(bytes32 certificateIdHash) external {
        CertificateProof storage proof = certificateProofs[certificateIdHash];
        if (proof.issuedAt == 0) {
            revert CertificateNotFound(certificateIdHash);
        }
        if (proof.status == CertificateStatus.REVOKED) {
            revert CertificateAlreadyRevoked(certificateIdHash);
        }
        if (msg.sender != owner && msg.sender != proof.issuer) {
            revert NotAuthorizedRevoker();
        }

        proof.status = CertificateStatus.REVOKED;

        emit CertificateProofRevoked(certificateIdHash, msg.sender, block.timestamp);
    }

    function getIssuer(address issuerAddress) external view returns (Issuer memory) {
        Issuer memory issuer = issuers[issuerAddress];
        if (issuer.createdAt == 0) {
            revert IssuerNotRegistered(issuerAddress);
        }

        return issuer;
    }

    function getCertificateProof(bytes32 certificateIdHash) external view returns (CertificateProof memory) {
        CertificateProof memory proof = certificateProofs[certificateIdHash];
        if (proof.issuedAt == 0) {
            revert CertificateNotFound(certificateIdHash);
        }

        return _withComputedStatus(proof);
    }

    function certificateProofExists(bytes32 certificateIdHash) public view returns (bool) {
        return certificateProofs[certificateIdHash].issuedAt != 0;
    }

    function isIssuerActive(address issuerAddress) public view returns (bool) {
        return issuers[issuerAddress].active;
    }

    function isCertificateRevoked(bytes32 certificateIdHash) public view returns (bool) {
        return certificateProofs[certificateIdHash].status == CertificateStatus.REVOKED;
    }

    function isCertificateExpired(bytes32 certificateIdHash) public view returns (bool) {
        CertificateProof memory proof = certificateProofs[certificateIdHash];
        return proof.issuedAt != 0 && block.timestamp >= proof.expiresAt;
    }

    function certificateStatus(bytes32 certificateIdHash) public view returns (CertificateStatus) {
        CertificateProof memory proof = certificateProofs[certificateIdHash];
        if (proof.issuedAt == 0) {
            revert CertificateNotFound(certificateIdHash);
        }

        return _withComputedStatus(proof).status;
    }

    function resultHashMatches(bytes32 certificateIdHash, bytes32 resultHash) public view returns (bool) {
        CertificateProof memory proof = certificateProofs[certificateIdHash];
        return proof.issuedAt != 0 && proof.resultHash == resultHash;
    }

    function isCertificateValid(bytes32 certificateIdHash) public view returns (bool) {
        CertificateProof memory proof = certificateProofs[certificateIdHash];
        return proof.issuedAt != 0
            && proof.status == CertificateStatus.VALID
            && block.timestamp < proof.expiresAt
            && issuers[proof.issuer].active;
    }

    function verifyCertificate(
        bytes32 certificateIdHash,
        bytes32 expectedResultHash
    )
        external
        view
        returns (
            bool exists,
            bool valid,
            bool revoked,
            bool expired,
            bool activeIssuer,
            bool resultMatches,
            CertificateStatus status
        )
    {
        CertificateProof memory proof = certificateProofs[certificateIdHash];
        exists = proof.issuedAt != 0;
        if (!exists) {
            return (false, false, false, false, false, false, CertificateStatus.EXPIRED);
        }

        revoked = proof.status == CertificateStatus.REVOKED;
        expired = block.timestamp >= proof.expiresAt;
        activeIssuer = issuers[proof.issuer].active;
        resultMatches = proof.resultHash == expectedResultHash;
        valid = !revoked && !expired && activeIssuer && resultMatches;
        status = revoked ? CertificateStatus.REVOKED : expired ? CertificateStatus.EXPIRED : CertificateStatus.VALID;
    }

    function _withComputedStatus(CertificateProof memory proof) private view returns (CertificateProof memory) {
        if (proof.status != CertificateStatus.REVOKED && block.timestamp >= proof.expiresAt) {
            proof.status = CertificateStatus.EXPIRED;
        }

        return proof;
    }
}
