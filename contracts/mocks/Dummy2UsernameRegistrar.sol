// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.5.11;

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
        public
        UsernameRegistrar(
            _token,
            _ensRegistry,
            _resolver,
            _ensNode,
            _usernameMinLength,
            _reservedUsernamesMerkleRoot,
            _parentRegistry
        )
    {
        
    }

}
