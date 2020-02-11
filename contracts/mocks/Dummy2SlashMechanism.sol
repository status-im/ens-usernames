// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.5.11;

import "../registry/SlashMechanism.sol";


contract Dummy2SlashMechanism is SlashMechanism {

    constructor(
        uint256 _usernameMinLength,
        bytes32 _reservedUsernamesMerkleRoot,
    )
        public 
        SlashMechanism(
            _usernameMinLength,
            _reservedUsernamesMerkleRoot
        ) 
    {

    }
} 