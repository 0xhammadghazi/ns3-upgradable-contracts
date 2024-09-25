//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "./ETHRegistrarControllerUpgradeable.sol";
import "./IBulkRenewal.sol";
import "./IPriceOracle.sol";

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract StaticBulkRenewal is IBulkRenewal {
    ETHRegistrarControllerUpgradeable controller;

    constructor(ETHRegistrarControllerUpgradeable _controller) {
        controller = _controller;
    }

    function renewAll(
        string[] calldata names,
        uint256 duration
    ) external override {
        uint256 length = names.length;
        for (uint256 i = 0; i < length; ) {
            controller.renew(names[i], duration);
            unchecked {
                ++i;
            }
        }
    }

    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return
            interfaceID == type(IERC165).interfaceId ||
            interfaceID == type(IBulkRenewal).interfaceId;
    }
}
