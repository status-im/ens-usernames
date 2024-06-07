// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.25;

import "./Dummy2UsernameRegistrar.sol";

contract UpdatedDummy2UsernameRegistrar is Dummy2UsernameRegistrar {
    constructor(
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        uint256 _usernameMinLength,
        bytes32 _reservedUsernamesMerkleRoot,
        address _parentRegistry
    )
        Dummy2UsernameRegistrar(
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
