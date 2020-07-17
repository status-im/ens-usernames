// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.5.0 <0.7.0;

import "./DummyUsernameRegistrar.sol";

contract UpdatedDummyUsernameRegistrar is DummyUsernameRegistrar {

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
        DummyUsernameRegistrar(
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
