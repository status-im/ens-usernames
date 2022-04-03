// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.8.9;

import "../registry/UsernameToken.sol";

contract DummyUsernameToken is UsernameToken {

    constructor(
        address payable _controller
    )
        UsernameToken(_controller)
    {
        
    }

}
