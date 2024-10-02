const { expect } = require("chai");
const { keccak256, toUtf8Bytes } = require("ethers");
const namehash = require("eth-ens-namehash");
const labelhash = (label) => keccak256(toUtf8Bytes(label));

describe("ETHRegistrarControllerUpgradeable", function () {
  let contractInstance;
  let owner, addr1, addr2;
  let proxyAddress;
  let ROOT_NODE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  let BASE_NODE = namehash.hash("web3");

  const DAY = 86400;
  const MIN_AGE = 1;
  const MAX_AGE = 10;

  let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy necessary smart contracts
    const ENSRegistryUpgradeable = await ethers.getContractFactory(
      "ENSRegistry"
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

    const ResolverUpgradeable = await ethers.getContractFactory(
      "PublicResolver"
    );
    resolverUpgradeableContractInstance = await upgrades.deployProxy(
      ResolverUpgradeable,
      [
        ensRegistryProxyAddress,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        reverseRegistrarAddress,
      ]
    );
    await resolverUpgradeableContractInstance.waitForDeployment();

    resolverUpgradeableAddress =
      await resolverUpgradeableContractInstance.getAddress();

    // console.log("Resolver Upgradeable Address: " + resolverUpgradeableAddress);

    await reverseRegistrarContractInstance.setDefaultResolver(
      resolverUpgradeableAddress
    );

    const NameWrapper = await ethers.getContractFactory("NameWrapper");

    nameWrapperContractInstance = await NameWrapper.deploy(
      ensRegistryProxyAddress,
      baseRegistrarAddress,
      ZERO_ADDRESS
    );

    await nameWrapperContractInstance.waitForDeployment();

    nameWrapperAddress = await nameWrapperContractInstance.getAddress();

    //  console.log("Name Wrapper Address: " + nameWrapperAddress);

    const ETHRegistrarControllerUpgradeable = await ethers.getContractFactory(
      "ETHRegistrarController"
    );

    // Deploy the contract
    contractInstance = await upgrades.deployProxy(
      ETHRegistrarControllerUpgradeable,
      [
        baseRegistrarAddress,
        reverseRegistrarAddress,
        nameWrapperAddress,
        ensRegistryProxyAddress,
      ]
    );
    await contractInstance.waitForDeployment();

    proxyAddress = await contractInstance.getAddress();

    // console.log("EthRegistrar Controller Proxy Address: " + proxyAddress);
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

    const ethRegistrarContractOwner = await ensRegistryContractInstance.admin();
    expect(ethRegistrarContractOwner).to.equal(owner.address);

    const baseContract = await contractInstance.base();
    expect(baseContract).to.equal(baseRegistrarAddress);

    const reverseRegistrarContract = await contractInstance.reverseRegistrar();
    expect(reverseRegistrarContract).to.equal(reverseRegistrarAddress);

    const nameWrapperContract = await contractInstance.nameWrapper();
    expect(nameWrapperContract).to.equal(nameWrapperAddress);


    await expect(
      contractInstance.initialize(
        baseRegistrarAddress,
        reverseRegistrarAddress,
        nameWrapperAddress,
        ensRegistryProxyAddress
      )
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Transfer contract ownership", async () => {
    let currentAdmin = await contractInstance.admin();
    expect(currentAdmin).to.equal(owner.address);

    // Revert if owner isn't the caller
    await expect(
      contractInstance.connect(addr1).transferContractOwnership(addr1.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    // Call with owner address
    await contractInstance.transferContractOwnership(addr1.address);

    let newAdmin = await contractInstance.admin();
    expect(newAdmin).to.equal(addr1.address);
  });

  it("Recover Funds", async () => {
    const MockERC20 = await ethers.getContractFactory("MockERC20");

    mockERC20 = await MockERC20.deploy();

    await mockERC20.waitForDeployment();

    // Transfer to eth registrar controller first
    await mockERC20.transfer(proxyAddress, 1000);

    const balanceBefore = await mockERC20.balanceOf(proxyAddress);
    expect(Number(balanceBefore)).to.equal(1000);
    await contractInstance.recoverFunds(mockERC20, addr1.address, 500);
    let balanceAfter = await mockERC20.balanceOf(proxyAddress);
    expect(Number(balanceAfter)).to.equal(500);

    // Try to recover from non-admin account
    await expect(
      contractInstance
        .connect(addr1)
        .recoverFunds(mockERC20, addr1.address, 500)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    // Transfer remaining
    await contractInstance.recoverFunds(mockERC20, addr1.address, 500);
    balanceAfter = await mockERC20.balanceOf(proxyAddress);
    expect(Number(balanceAfter)).to.equal(0);

    // Try again
    await expect(
      contractInstance.recoverFunds(mockERC20, addr1.address, 1)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("Upgradeability test", async () => {
    // const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
    //   proxyAddress
    // );

    // console.log(
    //   "Current ENSRegistryUpgradeable Implementation Address: " +
    //     currentImplAddress
    // );

    const MockETHRegistrarController = await ethers.getContractFactory(
      "MockETHRegistrarController"
    );

    // SHOULD FAIL UPGRADE IF CALLER IS NOT ADDRESS
    let MockETHRegistrarControllerMalicious =
      MockETHRegistrarController.connect(addr1);
    await expect(
      upgrades.upgradeProxy(proxyAddress, MockETHRegistrarControllerMalicious)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await contractInstance.withdraw();

    contractInstance = await upgrades.upgradeProxy(
      proxyAddress,
      MockETHRegistrarController
    );

    const MockBaseRegistrarImplementation = await ethers.getContractFactory(
      "MockBaseRegistrarImplementation"
    );

    // Deploy mock base registrar
    mockBaseRegistrarContractInstance =
      await MockBaseRegistrarImplementation.deploy(
        ensRegistryProxyAddress,
        BASE_NODE
      );
    await mockBaseRegistrarContractInstance.waitForDeployment();

    mockBaseRegistrarAddress =
      await mockBaseRegistrarContractInstance.getAddress();

    // Test grace period before upgrading
    let oldBaseRegistrarAddress = await contractInstance.base();

    const oldBaseRegistrarContract = await ethers.getContractAt(
      "MockBaseRegistrarImplementation",
      oldBaseRegistrarAddress
    );

    expect(await oldBaseRegistrarContract.GRACE_PERIOD()).to.equal(90 * DAY);

    await contractInstance.initializeV2(mockBaseRegistrarAddress);

    // Test grace period after upgrading
    let newBaseRegistrarAddress = await contractInstance.base();

    const newBaseRegistrarContract = await ethers.getContractAt(
      "MockBaseRegistrarImplementation",
      newBaseRegistrarAddress
    );

    expect(await newBaseRegistrarContract.GRACE_PERIOD()).to.equal(30 * DAY);

    // Try reinitializing again
    await expect(
      contractInstance.initializeV2(mockBaseRegistrarAddress)
    ).to.be.revertedWith("Initializable: contract is already initialized");

    try {
      await contractInstance.withdraw(); // Trying to call the withdraw function
    } catch (error) {
      // Catch the error and check if it's a TypeError
      expect(error).to.be.an.instanceOf(TypeError);
      expect(error.message).to.include("withdraw is not a function");
    }
  });
});
