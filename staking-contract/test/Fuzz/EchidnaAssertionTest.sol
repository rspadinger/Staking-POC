// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./Setup.sol";

import "hardhat/console.sol";

contract EchidnaAssertionTest is Setup {
    event AmountsIn(uint256 amount);
    event UserBalance(uint256 balance);

    //Invariant: token balance must never exceed 1000 wei
    function testAddTokens(uint256 amountToAdd) public {
        // Preconditions: add maximum 100 wei
        amountToAdd = _between(amountToAdd, 1, 100);
        console.log("Amount to add: ", amountToAdd);

        emit AmountsIn(amountToAdd);

        if (!completed) {
            //mint test tokens to user
            _init();
        }

        //// State before
        uint256 balanceBefore = token.balances(address(user));

        // Action:
        //// add tokens
        (bool success, ) = user.proxy(address(token), abi.encodeWithSelector(token.addTokens.selector, amountToAdd));

        require(success);

        // Postconditions => check invariants
        emit UserBalance(token.balances(address(user)));
        assert(token.balances(address(user)) <= 1000);
    }
}

// echidna ./test/Fuzz/EchidnaAssertionTest.sol --contract EchidnaAssertionTest --config ./test/Fuzz/configAssertionMode.yaml
