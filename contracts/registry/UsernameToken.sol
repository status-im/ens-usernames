// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.8.9;

import "../common/Controlled.sol";
import "../openzeppelin-solidity/token/ERC721/ERC721.sol";

/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice Registers usernames as ENS subnodes of the domain `ensNode`
 */
contract UsernameToken is Controlled, ERC721 {

    mapping (bytes32 => Account) public accounts;

    struct Account {
        uint256 value;
        uint256 creationTime;
    }

    constructor(
        address payable _controller
    )
        ERC721("USER","Status Username")
        Controlled(_controller)
    {

    }

    function createUser(address _owner, bytes32 _label, uint256 _value) external {
        generateToken(_owner, _label, _value, block.timestamp);
    }

    function importUser(address _owner, bytes32 _label, uint256 _value, uint256 _creationTime) external {
        if(_exists(uint256(_label))){
            return;
        }
        generateToken(_owner, _label, _value, _creationTime);
    }

    function deleteUser(bytes32 _label) external {
        destroyToken(_label);
    }

    function generateToken(address _owner, bytes32 _label, uint256 _value, uint256 _creationTime) internal onlyController {
        _mint(_owner, uint256(_label));
        accounts[_label] = Account(_value, _creationTime);
    }

    function destroyToken(bytes32 _label) internal onlyController {
        _burn(uint256(_label));
        delete accounts[_label];
    }

    function isApprovedOrOwner(address spender, bytes32 _label) external view returns(bool){
        return _isApprovedOrOwner(spender, uint256(_label));
    }

    function exists(bytes32 _label) external view returns(bool){
        return _exists(uint256(_label));
    }

}
