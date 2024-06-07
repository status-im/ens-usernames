// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.25;

/// @dev `Owned` is a base level contract that assigns an `owner` that can be
///  later changed
abstract contract Owned {
    /// @dev `owner` is the only address that can call a function with this
    /// modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    address payable public owner;

    /// @notice The Constructor assigns the message sender to be `owner`
    constructor() {
        owner = payable(msg.sender);
    }

    address payable public newOwner;

    /// @notice `owner` can step down and assign some other address to this role
    /// @param _newOwner The address of the new owner. 0x0 can be used to create
    ///  an unowned neutral vault, however that cannot be undone
    function changeOwner(address payable _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }

    function acceptOwnership() public {
        if (msg.sender == newOwner) {
            owner = newOwner;
        }
    }
}
