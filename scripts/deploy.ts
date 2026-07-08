import { network } from "hardhat";

const { ethers } = await network.create();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying CredaraCredentialRegistry");
  console.log(`Deployer: ${deployer.address}`);

  const registry = await ethers.deployContract("CredaraCredentialRegistry");
  await registry.waitForDeployment();

  console.log(`CredaraCredentialRegistry deployed at: ${await registry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
