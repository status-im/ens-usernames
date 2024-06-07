// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.25;

import "../registry/UsernameRegistrar.sol";

contract Dummy2UsernameRegistrar is UsernameRegistrar {
    constructor(
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        uint256 _usernameMinLength,
        bytes32 _reservedUsernamesMerkleRoot,
        address _parentRegistry
    )
        UsernameRegistrar(
            _token,
            _ensRegistry,
            _resolver,
            _ensNode,
            _usernameMinLength,
            _reservedUsernamesMerkleRoot,
            _parentRegistry
        )
    { }
}
