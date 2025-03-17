//SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../../contracts/MyToken.sol";

contract EchidnaPropertyTest is MyToken {
    address echidna_caller = msg.sender;

    constructor() public {
        balances[echidna_caller] = 0;
    }

    function echidna_test_balance() public view returns (bool) {
        return balances[echidna_caller] <= 1000;
    }
}

// echidna ./test/Fuzz/EchidnaPropertyTest.sol --contract EchidnaPropertyTest --config ./test/Fuzz/configPropertyMode.yaml
