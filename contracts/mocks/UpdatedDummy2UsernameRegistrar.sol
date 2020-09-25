// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.6.2;

import "./Dummy2UsernameRegistrar.sol";

contract UpdatedDummy2UsernameRegistrar is Dummy2UsernameRegistrar {

    constructor(
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        address _slashMechanism,
        address _parentRegistry
    )
        public
        Dummy2UsernameRegistrar(
            _token,
            _ensRegistry,
            _resolver,
            _ensNode,
            _slashMechanism,
            _parentRegistry
        )
    {
        
    }

}
