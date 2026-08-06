const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying Deakonn with account:", deployer.address);
  console.log(
    "Account balance:",
    (await hre.ethers.provider.getBalance(deployer.address)).toString()
  );

  const Deakonn = await hre.ethers.getContractFactory("Deakonn");
  const deakonn = await Deakonn.deploy(deployer.address);

  await deakonn.waitForDeployment();
  const address = await deakonn.getAddress();

  console.log("Deakonn deployed to:", address);
  console.log("Initial supply holder:", deployer.address);
  console.log(
    "Initial supply:",
    (await deakonn.INITIAL_SUPPLY()).toString()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
