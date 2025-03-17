// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../../contracts/MyToken.sol";

// external testing => this is our middleman
contract Users {
    function proxy(address target, bytes memory data) public returns (bool success, bytes memory retData) {
        return target.call(data);
    }
}

contract Setup {
    MyToken public token;
    Users public user;
    bool public completed;

    //create a UniV2 Pair (Pool) and approve both pair tokens for the LP
    constructor() public {
        //required to create a pair token for a new LP
        token = new MyToken();

        //a simple proxy to call a specific function on the specified contract => approve max amount
        user = new Users();
        user.proxy(address(token), abi.encodeWithSelector(token.approve.selector, address(user), type(uint256).max));
    }

    function _init() internal {
        token.mint(address(user), 100 * 1e18);
        completed = true;
    }

    // set input value to a specific range
    function _between(uint256 val, uint256 low, uint256 high) internal pure returns (uint256) {
        return low + (val % (high - low + 1));
    }
}
