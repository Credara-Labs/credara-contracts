import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe("CredaraCredentialRegistry", function () {
  async function deployRegistryFixture() {
    const [owner, issuer, inactiveIssuer, student, stranger] = await ethers.getSigners();
    const registry = await ethers.deployContract("CredaraCredentialRegistry");

    const issuerNameHash = ethers.keccak256(ethers.toUtf8Bytes("Credara Demo University"));
    const inactiveIssuerNameHash = ethers.keccak256(ethers.toUtf8Bytes("Inactive Demo University"));
    const certificateIdHash = ethers.keccak256(ethers.toUtf8Bytes("certificate:demo:001"));
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes("result:grade-hash-only"));
    const alternateResultHash = ethers.keccak256(ethers.toUtf8Bytes("result:wrong"));

    return {
      registry,
      owner,
      issuer,
      inactiveIssuer,
      student,
      stranger,
      issuerNameHash,
      inactiveIssuerNameHash,
      certificateIdHash,
      resultHash,
      alternateResultHash,
    };
  }

  async function registerIssuerAndCertificate() {
    const fixture = await deployRegistryFixture();
    await fixture.registry
      .connect(fixture.owner)
      .registerIssuer(fixture.issuer.address, fixture.issuerNameHash);

    const expiresAt = (await networkHelpers.time.latest()) + 30 * 24 * 60 * 60;
    await fixture.registry
      .connect(fixture.issuer)
      .registerCertificateProof(
        fixture.certificateIdHash,
        fixture.resultHash,
        fixture.student.address,
        expiresAt,
      );

    return { ...fixture, expiresAt };
  }

  it("allows the owner to register an issuer", async function () {
    const { registry, owner, issuer, issuerNameHash } = await deployRegistryFixture();

    await expect(registry.connect(owner).registerIssuer(issuer.address, issuerNameHash))
      .to.emit(registry, "IssuerRegistered");

    const issuerRecord = await registry.getIssuer(issuer.address);
    expect(issuerRecord.issuerAddress).to.equal(issuer.address);
    expect(issuerRecord.nameHash).to.equal(issuerNameHash);
    expect(issuerRecord.active).to.equal(true);
    expect(issuerRecord.createdAt).to.be.greaterThan(0n);
  });

  it("prevents a non-owner from registering an issuer", async function () {
    const { registry, issuer, stranger, issuerNameHash } = await deployRegistryFixture();

    await expect(registry.connect(stranger).registerIssuer(issuer.address, issuerNameHash))
      .to.be.revertedWithCustomError(registry, "OnlyOwner");
  });

  it("allows the owner to deactivate an issuer", async function () {
    const { registry, owner, issuer, issuerNameHash } = await deployRegistryFixture();

    await registry.connect(owner).registerIssuer(issuer.address, issuerNameHash);

    await expect(registry.connect(owner).deactivateIssuer(issuer.address))
      .to.emit(registry, "IssuerDeactivated");

    expect(await registry.isIssuerActive(issuer.address)).to.equal(false);
  });

  it("allows an active issuer to register a certificate proof", async function () {
    const { registry, owner, issuer, student, issuerNameHash, certificateIdHash, resultHash } =
      await deployRegistryFixture();

    await registry.connect(owner).registerIssuer(issuer.address, issuerNameHash);
    const expiresAt = (await networkHelpers.time.latest()) + 1000;

    await expect(
      registry.connect(issuer).registerCertificateProof(certificateIdHash, resultHash, student.address, expiresAt),
    )
      .to.emit(registry, "CertificateProofRegistered");

    expect(await registry.certificateProofExists(certificateIdHash)).to.equal(true);
  });

  it("prevents an inactive issuer from registering a certificate proof", async function () {
    const {
      registry,
      owner,
      inactiveIssuer,
      student,
      inactiveIssuerNameHash,
      certificateIdHash,
      resultHash,
    } = await deployRegistryFixture();

    await registry.connect(owner).registerIssuer(inactiveIssuer.address, inactiveIssuerNameHash);
    await registry.connect(owner).deactivateIssuer(inactiveIssuer.address);
    const expiresAt = (await networkHelpers.time.latest()) + 1000;

    await expect(
      registry
        .connect(inactiveIssuer)
        .registerCertificateProof(certificateIdHash, resultHash, student.address, expiresAt),
    ).to.be.revertedWithCustomError(registry, "OnlyActiveIssuer");
  });

  it("prevents duplicate certificate proof registration", async function () {
    const { registry, issuer, student, certificateIdHash, resultHash, expiresAt } =
      await registerIssuerAndCertificate();

    await expect(
      registry.connect(issuer).registerCertificateProof(certificateIdHash, resultHash, student.address, expiresAt + 1),
    )
      .to.be.revertedWithCustomError(registry, "CertificateAlreadyRegistered")
      .withArgs(certificateIdHash);
  });

  it("verifies a certificate proof", async function () {
    const { registry, issuer, certificateIdHash, resultHash } = await registerIssuerAndCertificate();

    const verification = await registry.verifyCertificate(certificateIdHash, resultHash);

    expect(verification.exists).to.equal(true);
    expect(verification.valid).to.equal(true);
    expect(verification.revoked).to.equal(false);
    expect(verification.expired).to.equal(false);
    expect(verification.activeIssuer).to.equal(true);
    expect(verification.resultMatches).to.equal(true);
    expect(verification.status).to.equal(0n);
    expect(await registry.isCertificateValid(certificateIdHash)).to.equal(true);
    expect(await registry.isIssuerActive(issuer.address)).to.equal(true);
  });

  it("makes revoked certificates fail valid verification", async function () {
    const { registry, issuer, certificateIdHash, resultHash } = await registerIssuerAndCertificate();

    await registry.connect(issuer).revokeCertificateProof(certificateIdHash);

    const verification = await registry.verifyCertificate(certificateIdHash, resultHash);
    expect(verification.valid).to.equal(false);
    expect(verification.revoked).to.equal(true);
    expect(verification.status).to.equal(1n);
    expect(await registry.isCertificateValid(certificateIdHash)).to.equal(false);
    expect(await registry.isCertificateRevoked(certificateIdHash)).to.equal(true);
  });

  it("makes expired certificates fail valid verification", async function () {
    const { registry, certificateIdHash, resultHash, expiresAt } = await registerIssuerAndCertificate();

    await networkHelpers.time.increaseTo(expiresAt);

    const verification = await registry.verifyCertificate(certificateIdHash, resultHash);
    expect(verification.valid).to.equal(false);
    expect(verification.expired).to.equal(true);
    expect(verification.status).to.equal(2n);
    expect(await registry.isCertificateValid(certificateIdHash)).to.equal(false);
    expect(await registry.isCertificateExpired(certificateIdHash)).to.equal(true);
    expect(await registry.certificateStatus(certificateIdHash)).to.equal(2n);
  });

  it("uses issuer activity in verification", async function () {
    const { registry, owner, issuer, certificateIdHash, resultHash } = await registerIssuerAndCertificate();

    await registry.connect(owner).deactivateIssuer(issuer.address);

    const verification = await registry.verifyCertificate(certificateIdHash, resultHash);
    expect(verification.valid).to.equal(false);
    expect(verification.activeIssuer).to.equal(false);
    expect(await registry.isCertificateValid(certificateIdHash)).to.equal(false);
  });

  it("checks result hash matches", async function () {
    const { registry, certificateIdHash, resultHash, alternateResultHash } =
      await registerIssuerAndCertificate();

    expect(await registry.resultHashMatches(certificateIdHash, resultHash)).to.equal(true);
    expect(await registry.resultHashMatches(certificateIdHash, alternateResultHash)).to.equal(false);

    const verification = await registry.verifyCertificate(certificateIdHash, alternateResultHash);
    expect(verification.valid).to.equal(false);
    expect(verification.resultMatches).to.equal(false);
  });

  it("prevents an unauthorized user from revoking an issuer certificate", async function () {
    const { registry, stranger, certificateIdHash } = await registerIssuerAndCertificate();

    await expect(registry.connect(stranger).revokeCertificateProof(certificateIdHash))
      .to.be.revertedWithCustomError(registry, "NotAuthorizedRevoker");
  });

  it("allows the owner to revoke an issuer certificate", async function () {
    const { registry, owner, certificateIdHash } = await registerIssuerAndCertificate();

    await expect(registry.connect(owner).revokeCertificateProof(certificateIdHash))
      .to.emit(registry, "CertificateProofRevoked");
  });

  it("emits registration and revocation events", async function () {
    const { registry, owner, issuer, student, issuerNameHash, certificateIdHash, resultHash } =
      await deployRegistryFixture();

    await expect(registry.connect(owner).registerIssuer(issuer.address, issuerNameHash))
      .to.emit(registry, "IssuerRegistered");

    const expiresAt = (await networkHelpers.time.latest()) + 1000;
    await expect(
      registry.connect(issuer).registerCertificateProof(certificateIdHash, resultHash, student.address, expiresAt),
    ).to.emit(registry, "CertificateProofRegistered");

    await expect(registry.connect(issuer).revokeCertificateProof(certificateIdHash))
      .to.emit(registry, "CertificateProofRevoked");
  });
});
