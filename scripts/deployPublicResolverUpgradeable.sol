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

let owner;

const network = hre.network.name;

if (network === "hardhat" || network === "localhost") {
            // Use local signers if no specific network is specified
            [owner, addr1, addr2] = await ethers.getSigners();
}else{ owner = "0x96A4BEd8e08e5d8bb91214Bada1f146842692dd6";
}

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

  console.log("Setting subnode ownder #1");
    await ensRegistryContractInstance.setSubnodeOwner(
      ROOT_NODE,
      labelhash("reverse"),
      owner
    );

  console.log("Setting subnode ownder #2");
    await ensRegistryContractInstance.setSubnodeOwner(
      namehash.hash("reverse"),
      labelhash("addr"),
      reverseRegistrarAddress
    );


  const PublicResolverUpgradeable = await ethers.getContractFactory("PublicResolverUpgradeable");

  console.log("Deploying PublicResolverUpgradeable...");

  const Proxy = await upgrades.deployProxy(PublicResolverUpgradeable, [ensRegistryProxyAddress,ZERO_ADDRESS,ZERO_ADDRESS,reverseRegistrarAddress]);
  await Proxy.waitForDeployment();

   proxyAddress = await Proxy.getAddress();

  console.log("Proxy PublicResolverUpgradeable deployed to:", proxyAddress);

  const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("PublicResolverUpgradeable Implementation address ", currentImplAddress);
}
main();
