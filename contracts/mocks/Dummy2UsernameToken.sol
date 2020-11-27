// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.6.2;

import "../registry/UsernameToken.sol";

contract Dummy2UsernameToken is UsernameToken {

    constructor(
        address payable _controller
    )
        public
        UsernameToken(_controller)
    {
        
    }

}
