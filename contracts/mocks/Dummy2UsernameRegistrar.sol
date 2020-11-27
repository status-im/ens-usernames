// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.6.2;

import "../registry/UsernameRegistrar.sol";

contract Dummy2UsernameRegistrar is UsernameRegistrar {

    constructor(
        UsernameToken _accounts,
        ERC20Token _token,
        ENS _ensRegistry,
        PublicResolver _resolver,
        bytes32 _ensNode,
        address _slashMechanism,
        address _parentRegistry
    )
        public
        UsernameRegistrar(
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
