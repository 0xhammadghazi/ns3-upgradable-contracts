# Changes Made for ENSRegistry Upgradeability

1. **Import the following OpenZeppelin files** in `ENSRegistry.sol`:

   ```solidity
   import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
   import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
   ```

2. **Update contract declaration** inside `ENSRegistry.sol` from:

   ```solidity
   contract ENSRegistry is ENS
   ```

   To:

   ```solidity
   contract ENSRegistry is
       ENSUpgradeable,
       Initializable,
       UUPSUpgradeable
   ```

3. **Replace the constructor** in `ENSRegistry` with the following:

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

4. **Add the following code snippet** above the `onlyAdmin` modifier in `ENSRegistry`:

   ```solidity
   address public admin;

   event OwnershipTransferred(
       address indexed previousOwner,
       address indexed newOwner
   );
   ```

5. **Add the following license identifier** at the top of `ENSRegistry.sol`:
   ```solidity
   // SPDX-License-Identifier: MIT
   ```
