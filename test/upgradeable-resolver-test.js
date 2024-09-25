const { expect } = require("chai");
const { keccak256, toUtf8Bytes } = require("ethers");
const namehash = require("eth-ens-namehash");
const labelhash = (label) => keccak256(toUtf8Bytes(label));

describe("PublicResolverUpgradeable", function () {
  let contractInstance;
  let owner, addr1, addr2;
  let proxyAddress;
  let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  let ROOT_NODE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  let BASE_NODE = namehash.hash("web3");

  const DAY = 86400;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

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

    // console.log("ENS Registry Proxy Address: " + ensRegistryProxyAddress);

    const BaseRegistrarImplementation = await ethers.getContractFactory(
      "BaseRegistrarImplementation"
    );

    baseRegistrarContractInstance = await BaseRegistrarImplementation.deploy(
      ensRegistryProxyAddress,
      BASE_NODE
    );
    await baseRegistrarContractInstance.waitForDeployment();

    baseRegistrarAddress = await baseRegistrarContractInstance.getAddress();

    //console.log("Base Registrar Address: " + baseRegistrarAddress);

    // Setting record
    await ensRegistryContractInstance.setSubnodeRecord(
      ROOT_NODE,
      labelhash("web3"),
      baseRegistrarAddress,
      ZERO_ADDRESS,
      0
    );

    await baseRegistrarContractInstance.addController(owner.address);

    // Registering sub-domain

    const tokenId = labelhash("Alice");
    const duration = 1 * DAY;

    await baseRegistrarContractInstance.register(
      tokenId,
      addr1.address,
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

    // console.log("Reverse Registrar Address: " + reverseRegistrarAddress);

    await ensRegistryContractInstance.setSubnodeOwner(
      ROOT_NODE,
      labelhash("reverse"),
      owner.address
    );
    await ensRegistryContractInstance.setSubnodeOwner(
      namehash.hash("reverse"),
      labelhash("addr"),
      reverseRegistrarAddress
    );

    const PublicResolverUpgradeable = await ethers.getContractFactory(
      "PublicResolverUpgradeable"
    );

    // Deploy the contract
    contractInstance = await upgrades.deployProxy(PublicResolverUpgradeable, [
      ensRegistryProxyAddress,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      reverseRegistrarAddress,
    ]);
    await contractInstance.waitForDeployment();

    proxyAddress = await contractInstance.getAddress();

    // console.log("Proxy Address: " + proxyAddress);
  });

  it("Is initialized correctly", async () => {
    const rootNodeOwner = await ensRegistryContractInstance.owner(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    const ensContractOwner = await ensRegistryContractInstance.admin();
    expect(rootNodeOwner).to.equal(owner.address);
    expect(ensContractOwner).to.equal(owner.address);

    const baseNodeOwner = await ensRegistryContractInstance.owner(BASE_NODE);
    expect(baseNodeOwner).to.equal(baseRegistrarAddress);

    const domainOwner = await ensRegistryContractInstance.owner(
      "0x9899999baf2c4b5058141a8ae4179185f7bcadfe80fd4525719365522820eae4" // Alice.web3
    );
    expect(domainOwner).to.equal(addr1.address);

    const ensRegistryContract = await contractInstance.ens();
    expect(ensRegistryContract).to.equal(ensRegistryProxyAddress);
    const reverseRegistrarContract =
      await contractInstance.trustedReverseRegistrar();
    expect(reverseRegistrarContract).to.equal(reverseRegistrarAddress);

    const publicResolverContractOwner = await contractInstance.owner();
    expect(publicResolverContractOwner).to.equal(owner.address);

    await expect(
      contractInstance.initialize(
        ensRegistryProxyAddress,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        reverseRegistrarAddress
      )
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Transfer contract ownership", async () => {
    let currentOwner = await contractInstance.owner();
    expect(currentOwner).to.equal(owner.address);

    // Revert if owner isn't the caller
    await expect(
      contractInstance.connect(addr1).transferOwnership(addr1.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    // Call with owner address
    await contractInstance.transferOwnership(addr1.address);

    let newOwner = await contractInstance.owner();
    expect(newOwner).to.equal(addr1.address);
  });

  it("Upgradeability test", async () => {
    const PublicResolverUpgradeableV2 = await ethers.getContractFactory(
      "PublicResolverUpgradeable"
    );

    // SHOULD FAIL UPGRADE IF CALLER IS NOT ADDRESS
    let PublicResolverUpgradeableV2WithMaliciousOwner =
      PublicResolverUpgradeableV2.connect(addr1);
    await expect(
      upgrades.upgradeProxy(
        proxyAddress,
        PublicResolverUpgradeableV2WithMaliciousOwner
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");

    contractInstance = await upgrades.upgradeProxy(
      proxyAddress,
      PublicResolverUpgradeableV2
    );
  });
});
