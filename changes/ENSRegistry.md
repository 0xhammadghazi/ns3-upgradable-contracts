# ENSRegistry Upgradeable Steps

1. **Change file name** of `ENSRegistry.sol` to `ENSRegistryUpgradeable.sol`.

2. **Import the following OpenZeppelin files** in `ENSRegistryUpgradeable.sol`:

   ```solidity
   import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
   import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
   ```

3. **Update contract declaration** inside `ENSRegistry.sol` from:

   ```solidity
   contract ENSRegistry is ENS
   ```

   To:

   ```solidity
   contract ENSRegistryUpgradeable is
       ENSUpgradeable,
       Initializable,
       UUPSUpgradeable
   ```

4. **Replace the constructor** in `ENSRegistryUpgradeable` with the following:

   ```solidity
   // Only allows admin to upgrade logic contract
   modifier onlyAdmin() {
       require(admin == msg.sender, "Not authorised");
       _;
   }

   /// @custom:oz-upgrades-unsafe-allow constructor
   constructor() {
       _disableInitializers();
   }

   /**
    * @dev Constructs a new ENS registry.
    */
   function initialize() public initializer {
       records[0x0].owner = msg.sender;
       admin = msg.sender;
   }

   /// @dev required by the OZ UUPS module
   function _authorizeUpgrade(address) internal override onlyAdmin {}

   /**
    * @dev Transfers ownership of the contract to a new account (`newAdmin`).
    * Can only be called by the current admin.
    */
   function transferOwnership(address newAdmin) external onlyAdmin {
       require(newAdmin != address(0), "New owner is the zero address");
       address oldAdmin = admin;
       admin = newAdmin;
       emit OwnershipTransferred(oldAdmin, newAdmin);
   }
   ```

5. **Add the following code snippet** above the `onlyAdmin` modifier in `ENSRegistryUpgradeable`:

   ```solidity
   address public admin;

   event OwnershipTransferred(
       address indexed previousOwner,
       address indexed newOwner
   );
   ```

6. **Add the following license identifier** at the top of `ENSRegistryUpgradeable.sol`:
   ```solidity
   // SPDX-License-Identifier: MIT
   ```
7. **Make sure to replace `ENSRegistry` with `ENSRegistryUpgradeable` in all files importing `ENSRegistry`**.
