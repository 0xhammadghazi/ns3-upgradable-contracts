const { ethers, upgrades } = require("hardhat");

async function main() {
  const ENSRegistryUpgradeable = await ethers.getContractFactory("ENSRegistryUpgradeable");

  console.log("Deploying ENSRegistryUpgradeable...");

  const Proxy = await upgrades.deployProxy(ENSRegistryUpgradeable, []);
  await Proxy.waitForDeployment();

  const proxyAddress = await Proxy.getAddress();

  console.log("Proxy ENSRegistryUpgradeable deployed to:", proxyAddress);

  const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("ENSRegistryUpgradeable Implementation address ", currentImplAddress);

  // Delay function for 10 seconds (10000 milliseconds)
  await delay(10000);

  // Verify the new implementation contract on Etherscan
  console.log("Verifying ENSRegistryUpgradeable implementation contract after 1 minute...");

  try {
    await hre.run("verify:verify", {
      address: currentImplAddress,
      constructorArguments: [],
    });
    console.log("ENSRegistryUpgradeable implementation Contract verified successfully!");
  } catch (err) {
    console.log("ENSRegistryUpgradeable implementation Verification failed:", err);
  }
}

// Delay function: pauses execution for the specified number of milliseconds
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
