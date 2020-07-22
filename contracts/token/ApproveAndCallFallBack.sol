pragma solidity 0.5.11;

contract ApproveAndCallFallBack {
    function receiveApproval(address from, uint256 _amount, address _token, bytes memory _data) public;
}
