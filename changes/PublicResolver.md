# PublicResolver Upgradeable Steps

1. **Change file name** of `PublicResolver.sol` to `PublicResolverUpgradeable.sol`.

2. **Append** the following import statements:

```solidity
  import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
  import {IReverseRegistrar} from "../reverseRegistrar/IReverseRegistrar.sol";
  import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
```

3. **Remove** the following import statement:

```solidity
import {ReverseClaimer} from "../reverseRegistrar/ReverseClaimer.sol";
```

4. **Update contract declaration** inside `PublicResolverUpgradeable.sol` from:

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
   contract PublicResolverUpgradeable is
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

5. **Add** the following state variable:

```solidity
bytes32 constant ADDR_REVERSE_NODE =
    0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;
address public admin;
```

6. **Remove** the `immutable` keyword from **all** state variables.

7. **Change the visibility** of the **all** state variable to `public`.

8. **Replace** the constructor with the following code:

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

9. **One significant change** is that in the upgradeable version, we are not inheriting the `ReverseClaimer.sol` contract. Instead, we've copied it's code inside `PublicResolverUpgradeable.sol`.Any changes made in `ReverseClaimer.sol` must be made manually inside `PublicResolverUpgradeable.sol`.
