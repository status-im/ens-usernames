// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.8.9;

import "../registry/SlashMechanism.sol";


contract Dummy2SlashMechanism is SlashMechanism {

    constructor(
        uint256 _usernameMinLength,
        bytes32 _reservedUsernamesMerkleRoot
    )
        SlashMechanism(
            _usernameMinLength,
            _reservedUsernamesMerkleRoot
        ) 
    {

    }
} 