// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.8.9;

abstract contract Controlled {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    /// @notice The address of the controller is the only address that can call
    ///  a function with this modifier
    modifier onlyController {
        require(msg.sender == controller, "Unauthorized");
        _;
    }

    address public controller;

    constructor(address _controller) {
        setController(_controller);
    }

    /// @notice Changes the controller of the contract
    /// @param _newController The new controller of the contract
    function changeController(address _newController) public onlyController {
        setController(_newController);
    }

    function setController(address _newController) private {
        require(_newController != address(0), "Invalid controller address");
        emit OwnershipTransferred(controller, _newController);
        controller = _newController;
    }
}
