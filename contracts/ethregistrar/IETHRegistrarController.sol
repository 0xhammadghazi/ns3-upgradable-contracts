//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import "./IPriceOracle.sol";

interface IETHRegistrarController {
    function available(string memory) external returns (bool);

    function register(
        string calldata,
        address,
        uint256,
        address,
        bytes[] calldata,
        bool,
        uint16
    ) external;

    function renew(string calldata, uint256) external;
}
