# Changes Made for PublicResolver Upgradeability

1. **Append** the following import statements:

```solidity
  import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
  import {IReverseRegistrar} from "../reverseRegistrar/IReverseRegistrar.sol";
  import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
```

2. **Remove** the following import statement:

```solidity
import {ReverseClaimer} from "../reverseRegistrar/ReverseClaimer.sol";
```

3. **Update contract declaration** inside `PublicResolver.sol` from:

   ```solidity
   contract PublicResolver is
    Multicallable,
    ABIResolver,
    AddrResolver,
    ContentHashResolver,
    DNSResolver,
    InterfaceResolver,
    NameResolver,
    PubkeyResolver,
    TextResolver,
    ReverseClaimer
   ```

   To:

   ```solidity
   contract PublicResolver is
    UUPSUpgradeable,
    OwnableUpgradeable,
    Multicallable,
    ABIResolver,
    AddrResolver,
    ContentHashResolver,
    DNSResolver,
    InterfaceResolver,
    NameResolver,
    PubkeyResolver,
    TextResolver
   ```

4. **Add** the following state variable:

```solidity
bytes32 constant ADDR_REVERSE_NODE =
    0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;
address public admin;
```

5. **Remove** the `immutable` keyword from **all** state variables.

6. **Change the visibility** of the **all** state variable to `public`.

7. **Replace** the constructor with the following code:

```solidity
      /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        ENS _ens,
        INameWrapper wrapperAddress,
        address _trustedETHController,
        address _trustedReverseRegistrar
    ) public initializer {
        __Ownable_init();
        ens = _ens;
        nameWrapper = wrapperAddress;
        trustedETHController = _trustedETHController;
        trustedReverseRegistrar = _trustedReverseRegistrar;

        IReverseRegistrar reverseRegistrar = IReverseRegistrar(
            ens.owner(ADDR_REVERSE_NODE)
        );
        reverseRegistrar.claim(msg.sender);
    }

    ///@dev required by the OZ UUPS module
    function _authorizeUpgrade(address) internal override onlyOwner {}
```

8. **One significant change** is that in the upgradeable version, we are not inheriting the `ReverseClaimer.sol` contract. Instead, we've copied it's code inside `PublicResolver.sol`.Any changes made in `ReverseClaimer.sol` must be made manually inside `PublicResolver.sol`.
