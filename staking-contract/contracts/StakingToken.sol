//SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingToken is ERC20, Ownable {
    mapping(address => uint256) public balances;

    constructor() ERC20("StakingToken", "ST") Ownable(msg.sender) {
        _mint(msg.sender, 100000 * 10 ** decimals());
    }

    function mint(address user, uint256 amount) external onlyOwner {
        _mint(user, amount);
    }
}
