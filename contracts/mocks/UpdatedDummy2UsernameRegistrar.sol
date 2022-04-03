// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.8.9;

import "./Dummy2UsernameRegistrar.sol";

contract UpdatedDummy2UsernameRegistrar is Dummy2UsernameRegistrar {

    constructor(
        UsernameToken _accounts,
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        address _slashMechanism,
        address _parentRegistry
    )
        Dummy2UsernameRegistrar(
            _accounts,
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
