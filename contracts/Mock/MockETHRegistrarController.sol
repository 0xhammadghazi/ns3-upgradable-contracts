//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import {BaseRegistrarImplementation} from "../ethregistrar/BaseRegistrarImplementation.sol";
import {StringUtils} from "../utils/StringUtils.sol";
import {Resolver} from "../resolvers/Resolver.sol";
import {ENS} from "../registry/ENS.sol";
import {IReverseRegistrar, ReverseRegistrar} from "../reverseRegistrar/ReverseRegistrar.sol";
import {IETHRegistrarController} from "../ethregistrar/IETHRegistrarController.sol";

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {INameWrapper} from "../wrapper/INameWrapper.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error NameNotAvailable(string name);
error DurationTooShort(uint256 duration);
error ResolverRequiredWhenDataSupplied();


// REMOVED WITHDRAW FN FOR TESTING

/**
 * @dev A registrar controller for registering and renewing names at fixed cost.
 */
contract MockETHRegistrarController is
    UUPSUpgradeable,
    IETHRegistrarController,
    IERC165
{
      using StringUtils for *;
    using Address for address;

    uint256 public constant MIN_REGISTRATION_DURATION = 28 days;
    bytes32 private constant ETH_NODE =
        0x04f740db81dc36c853ab4205bddd785f46e79ccedca351fc6dfcbd8cc9a33dd6;
    uint64 private constant MAX_EXPIRY = type(uint64).max;
    bytes32 constant ADDR_REVERSE_NODE =
        0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;
    BaseRegistrarImplementation public base;
    ReverseRegistrar public reverseRegistrar;
    INameWrapper public nameWrapper;


    address public admin;

    event NameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 expires
    );
    event NameRenewed(string name, bytes32 indexed label, uint256 expires);

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

    function initializeV2(
        BaseRegistrarImplementation _base
    ) public reinitializer(2) {
        base = _base;
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

    ///@dev required by the OZ UUPS module
    function _authorizeUpgrade(address) internal override onlyAdmin {}

    function valid(string memory name) public pure returns (bool) {
        return name.strlen() >= 1;
    }

    function available(string memory name) public view override returns (bool) {
        bytes32 label = keccak256(bytes(name));
        return valid(name) && base.available(uint256(label));
    }

   
function register(
        string calldata name,
        address owner,
        uint256 duration,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses
    ) public override onlyAdmin {
     if (data.length > 0 && resolver == address(0)) {
            revert ResolverRequiredWhenDataSupplied();
        }

    if (!available(name)) {
            revert NameNotAvailable(name);
        }


        if (duration < MIN_REGISTRATION_DURATION) {
            revert DurationTooShort(duration);
        }

        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            name,
            owner,
            duration,
            resolver,
            ownerControlledFuses
        );

        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, msg.sender);
        }

        emit NameRegistered(name, keccak256(bytes(name)), owner, expires);
    }

    function renew(
        string calldata name,
        uint256 duration
    ) external override onlyAdmin {
        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        uint256 expires = nameWrapper.renew(tokenId, duration);

        emit NameRenewed(name, labelhash, expires);
    }

    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return
            interfaceID == type(IERC165).interfaceId ||
            interfaceID == type(IETHRegistrarController).interfaceId;
    }

    /* Internal functions */


    function _setRecords(
        address resolverAddress,
        bytes32 label,
        bytes[] calldata data
    ) internal {
        // use hardcoded .eth namehash
        bytes32 nodehash = keccak256(abi.encodePacked(ETH_NODE, label));
        Resolver resolver = Resolver(resolverAddress);
        resolver.multicallWithNodeCheck(nodehash, data);
    }

    function _setReverseRecord(
        string memory name,
        address resolver,
        address owner
    ) internal {
        reverseRegistrar.setNameForAddr(
            msg.sender,
            owner,
            resolver,
            string.concat(name, ".test")
        );
    }
}
