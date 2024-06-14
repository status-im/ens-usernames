// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.19;

import "./StandardToken.sol";
import "./ApproveAndCallFallBack.sol";

/**
 * @notice ERC20Token for test scripts, can be minted by anyone.
 */
contract TestToken is StandardToken {

    constructor() { }

    /**
     * @notice any caller can mint any `_amount`
     * @param _amount how much to be minted
     */
    function mint(uint256 _amount) public {
        _mint(msg.sender, _amount);
    }

    /**
     * @notice any caller can mint any `_amount`
     * @param _beneficiary who will receive the minted tokens
     * @param _amount how much to be minted
     */
    function mint(address _beneficiary, uint256 _amount) public {
        _mint(_beneficiary, _amount);
    }

    function approveAndCall(address _spender, uint256 _value, bytes calldata _extraData)
        external
        returns (bool success)
    {
        approve(msg.sender, _spender, _value);
        ApproveAndCallFallBack(_spender).receiveApproval(msg.sender, _value, address(this), _extraData);
        return true;
    }

}
