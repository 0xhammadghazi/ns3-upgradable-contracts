const { expect } = require("chai");

describe("ENSRegistryUpgradeable", function () {
  let contractInstance;
  let owner, addr1, addr2;
  let proxyAddress;

  beforeEach(async function () {
    const ENSRegistryUpgradeable = await ethers.getContractFactory(
      "ENSRegistry"
    );

    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    contractInstance = await upgrades.deployProxy(ENSRegistryUpgradeable, []);
    await contractInstance.waitForDeployment();

    proxyAddress = await contractInstance.getAddress();

    // console.log("Proxy Address: " + proxyAddress);
  });

  it("Is initialized correctly", async () => {
    const rootNodeOwner = await contractInstance.owner(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    const contractOwner = await contractInstance.admin();

    expect(rootNodeOwner).to.equal(owner.address);
    expect(contractOwner).to.equal(owner.address);

    await expect(contractInstance.initialize()).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("Transfer contract ownership", async () => {
    let currentAdmin = await contractInstance.admin();
    expect(currentAdmin).to.equal(owner.address);

    // Revert if owner isn't the caller
    await expect(
      contractInstance.connect(addr1).transferOwnership(addr1.address)
    ).to.be.revertedWith("Caller not admin");

    // Cal with owner address
    await contractInstance.transferOwnership(addr1.address);

    let newAdmin = await contractInstance.admin();
    expect(newAdmin).to.equal(addr1.address);
  });

  it("Upgradeability test", async () => {
    // const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
    //   proxyAddress
    // );

    // console.log(
    //   "Current ENSRegistryUpgradeable Implementation Address: " +
    //     currentImplAddress
    // );

    const ENSRegistryUpgradeableV2 = await ethers.getContractFactory(
      "ENSRegistry"
    );

    // SHOULD FAIL UPGRADE IF CALLER IS NOT ADDRESS
    let ENSRegistryUpgradeableV2WithMaliciousOwner =
      ENSRegistryUpgradeableV2.connect(addr1);
    await expect(
      upgrades.upgradeProxy(
        proxyAddress,
        ENSRegistryUpgradeableV2WithMaliciousOwner
      )
    ).to.be.revertedWith("Caller not admin");

    contractInstance = await upgrades.upgradeProxy(
      proxyAddress,
      ENSRegistryUpgradeableV2
    );

    // const newImplAddress = await upgrades.erc1967.getImplementationAddress(
    //   proxyAddress
    // );

    // console.log(
    //   "New ENSRegistryUpgradeableV2 Implementation Address: " + newImplAddress
    // );
  });
});
