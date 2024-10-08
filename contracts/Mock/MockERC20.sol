// SDPX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("ENS20", "E20") {
        _mint(msg.sender, 2000);
    }
}
