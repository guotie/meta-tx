//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {

    constructor() ERC20("MockToken", "MT") {

    }

    /// @dev anyone can mint, just for test, do not use in production
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
