const { ethers, upgrades } = require("hardhat");
const { keccak256, toUtf8Bytes } = require("ethers");
const namehash = require("eth-ens-namehash");
const labelhash = (label) => keccak256(toUtf8Bytes(label));

async function main() {
     let contractInstance;
     
  let proxyAddress;
  let ROOT_NODE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  let BASE_NODE = namehash.hash("web3");

  const DAY = 86400;
  const MIN_AGE = 1;
  const MAX_AGE = 10;

  let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

let owner = "0x96A4BEd8e08e5d8bb91214Bada1f146842692dd6";

  console.log("Deploying ETHRegistrarControllerUpgradeable...");


 // Deploy necessary smart contracts
    const ENSRegistryUpgradeable = await ethers.getContractFactory(
      "ENSRegistryUpgradeable"
    );

    ensRegistryContractInstance = await upgrades.deployProxy(
      ENSRegistryUpgradeable,
      []
    );
    await ensRegistryContractInstance.waitForDeployment();

    ensRegistryProxyAddress = await ensRegistryContractInstance.getAddress();

    console.log("ENS Registry Proxy Address: " + ensRegistryProxyAddress);

    const BaseRegistrarImplementation = await ethers.getContractFactory(
      "BaseRegistrarImplementation"
    );

    baseRegistrarContractInstance = await BaseRegistrarImplementation.deploy(
      ensRegistryProxyAddress,
      BASE_NODE
    );
    await baseRegistrarContractInstance.waitForDeployment();

    baseRegistrarAddress = await baseRegistrarContractInstance.getAddress();

    console.log("Base Registrar Address: " + baseRegistrarAddress);

    // Setting record
    await ensRegistryContractInstance.setSubnodeRecord(
      ROOT_NODE,
      labelhash("web3"),
      baseRegistrarAddress,
      ZERO_ADDRESS,
      0
    );

    await baseRegistrarContractInstance.addController(owner);

// Registering sub-domain

    const tokenId = labelhash("Alice");
    const duration = 1 * DAY;

    await baseRegistrarContractInstance.register(
      tokenId,
      owner,
      duration
    );

    const ReverseRegistrar = await ethers.getContractFactory(
      "ReverseRegistrar"
    );

    reverseRegistrarContractInstance = await ReverseRegistrar.deploy(
      ensRegistryProxyAddress
    );
    await reverseRegistrarContractInstance.waitForDeployment();

    reverseRegistrarAddress =
      await reverseRegistrarContractInstance.getAddress();

    console.log("Reverse Registrar Address: " + reverseRegistrarAddress);

    await ensRegistryContractInstance.setSubnodeOwner(
      ROOT_NODE,
      labelhash("reverse"),
      owner
    );
    await ensRegistryContractInstance.setSubnodeOwner(
      namehash.hash("reverse"),
      labelhash("addr"),
      reverseRegistrarAddress
    );

    const Resolver = await ethers.getContractFactory("PublicResolver");
    resolverContractInstance = await Resolver.deploy(
      ensRegistryProxyAddress,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      reverseRegistrarAddress
    );
    await resolverContractInstance.waitForDeployment();

    resolverAddress = await resolverContractInstance.getAddress();

     console.log("Resolver Address: " + resolverAddress);

    await reverseRegistrarContractInstance.setDefaultResolver(resolverAddress);

    const NameWrapper = await ethers.getContractFactory("NameWrapper");

    nameWrapperContractInstance = await NameWrapper.deploy(
      ensRegistryProxyAddress,
      baseRegistrarAddress,
      ZERO_ADDRESS
    );

    await nameWrapperContractInstance.waitForDeployment();

    nameWrapperAddress = await nameWrapperContractInstance.getAddress();

     console.log("Name Wrapper Address: " + nameWrapperAddress);

    const ETHRegistrarControllerUpgradeable = await ethers.getContractFactory(
      "ETHRegistrarControllerUpgradeable"
    );

    // Deploy the contract
    contractInstance = await upgrades.deployProxy(
      ETHRegistrarControllerUpgradeable,
      [
        baseRegistrarAddress,
        MIN_AGE, // min commitment age
        MAX_AGE, /// max commitment age
        reverseRegistrarAddress,
        nameWrapperAddress,
        ensRegistryProxyAddress,
      ]
    );
    await contractInstance.waitForDeployment();

    proxyAddress = await contractInstance.getAddress();



console.log("Proxy ETHRegistrarControllerUpgradeable deployed to:", proxyAddress);

  const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("ETHRegistrarControllerUpgradeable Implementation address ", currentImplAddress);
}

// Delay function: pauses execution for the specified number of milliseconds
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
