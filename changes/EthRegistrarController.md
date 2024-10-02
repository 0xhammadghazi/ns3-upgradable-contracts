# Changes Made for EthRegistrar Controller Upgradeability

1. **Replace all** Import Statements with these:

```solidity
import {BaseRegistrarImplementation} from "./BaseRegistrarImplementation.sol";
import {StringUtils} from "../utils/StringUtils.sol";
import {Resolver} from "../resolvers/Resolver.sol";
import {ENS} from "../registry/ENS.sol";
import {IReverseRegistrar, ReverseRegistrar} from "../reverseRegistrar/ReverseRegistrar.sol";
import {IETHRegistrarController} from "./IETHRegistrarController.sol";

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {INameWrapper} from "../wrapper/INameWrapper.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
```

2. **Update contract declaration** inside `ETHRegistrarController.sol` from:

   ```solidity
   contract ETHRegistrarController is
    Ownable,
    IETHRegistrarController,
    IERC165,
    ERC20Recoverable,
    ReverseClaimer
   ```

   To:

   ```solidity
   contract ETHRegistrarController is
    UUPSUpgradeable,
    IETHRegistrarController,
    IERC165
   ```

3. **Add** these state variables:

```solidity
bytes32 constant ADDR_REVERSE_NODE =
    0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;
address public admin;
```

4. **Remove** the `immutable` keyword from **all** state variables.

5. **Change the visibility** of the `base` state variable to `public`.

6. **Replace** the constructor with the following code:

```solidity
event ContractOwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
);

// Only allows admin to upgrade logic contract
modifier onlyAdmin() {
    require(admin == msg.sender, "Ownable: caller is not the owner");
    _;
}

/// @custom:oz-upgrades-unsafe-allow constructor
constructor() {
    _disableInitializers();
}

function initialize(
    BaseRegistrarImplementation _base,
    ReverseRegistrar _reverseRegistrar,
    INameWrapper _nameWrapper,
    ENS _ens
) public initializer {
    admin = msg.sender;
    base = _base;
    reverseRegistrar = _reverseRegistrar;
    nameWrapper = _nameWrapper;

    // ReverseClaimer logic
    IReverseRegistrar reverseRegistrar_ = IReverseRegistrar(
        _ens.owner(ADDR_REVERSE_NODE)
    );
    reverseRegistrar_.claim(msg.sender);
}

/**
@notice Recover ERC20 tokens sent to the contract by mistake.
@dev The contract is Ownable and only the owner can call the recover function.
@param _to The address to send the tokens to.
@param _token The address of the ERC20 token to recover
@param _amount The amount of tokens to recover.
*/
function recoverFunds(
    address _token,
    address _to,
    uint256 _amount
) external onlyAdmin {
    IERC20(_token).transfer(_to, _amount);
}

/**
 * @dev Transfers ownership of the contract to a new account (`newAdmin`).
 * Can only be called by the current admin.
 */
function transferContractOwnership(address newAdmin) external onlyAdmin {
    require(newAdmin != address(0), "New owner is the zero address");
    address oldAdmin = admin;
    admin = newAdmin;
    emit ContractOwnershipTransferred(oldAdmin, newAdmin);
}

/// @dev required by the OZ UUPS module
function _authorizeUpgrade(address) internal override onlyAdmin {}
```

7. **Change the parameter** of the payable function inside the `withdraw` function from `owner()` to `admin`:

```solidity
    function withdraw() public {
        payable(admin).transfer(address(this).balance);
    }
```

8. **One significant change** is that in the upgradeable version, we are not inheriting the `ReverseClaimer.sol` contract and the `ERC20Recoverable.sol` contract. Instead, we've copied their code inside `ETHRegistrarController.sol`. Any changes made in `ReverseClaimer.sol` or `ERC20Recoverable.sol` must be made manually inside `ETHRegistrarController.sol`.
