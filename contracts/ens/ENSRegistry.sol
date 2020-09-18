// SPDX-License-Identifier: BSD-2-Clause

pragma solidity 0.5.11;

import "./ENS.sol";

/**
 * The ENS registry contract.
 */
contract ENSRegistry is ENS {

    struct Record {
        address owner;
        address resolver;
        uint64 ttl;
    }

    mapping (bytes32 => Record) records;
    mapping (address => mapping(address => bool)) operators;

    // Permits modifications only by the _owner of the specified _node.
    modifier authorised(bytes32 _node) {
        address _owner = records[_node].owner;
        require(_owner == msg.sender || operators[_owner][msg.sender], "ENS: Not Authorized");
        _;
    }

    /**
     * @dev Constructs a new ENS registrar.
     */
    constructor() public {
        records[0x0].owner = msg.sender;
    }

    /**
     * @dev Sets the record for a _node.
     * @param _node The _node to update.
     * @param _owner The address of the new _owner.
     * @param _resolver The address of the _resolver.
     * @param _ttl The TTL in seconds.
     */
    function setRecord(bytes32 _node, address _owner, address _resolver, uint64 _ttl) external {
        setOwner(_node, _owner);
        _setResolverAndTTL(_node, _resolver, _ttl);
    }

    /**
     * @dev Sets the record for a subnode.
     * @param _node The parent _node.
     * @param _label The hash of the _label specifying the subnode.
     * @param _owner The address of the new _owner.
     * @param _resolver The address of the _resolver.
     * @param _ttl The TTL in seconds.
     */
    function setSubnodeRecord(bytes32 _node, bytes32 _label, address _owner, address _resolver, uint64 _ttl) external {
        bytes32 subnode = setSubnodeOwner(_node, _label, _owner);
        _setResolverAndTTL(subnode, _resolver, _ttl);
    }

    /**
     * @dev Transfers ownership of a _node to a new address. May only be called by the current _owner of the _node.
     * @param _node The _node to transfer ownership of.
     * @param _owner The address of the new _owner.
     */
    function setOwner(bytes32 _node, address _owner) public authorised(_node) {
        _setOwner(_node, _owner);
        emit Transfer(_node, _owner);
    }

    /**
     * @dev Transfers ownership of a subnode keccak256(_node, _label) to a new address. May only be called by the _owner of the parent _node.
     * @param _node The parent _node.
     * @param _label The hash of the _label specifying the subnode.
     * @param _owner The address of the new _owner.
     */
    function setSubnodeOwner(bytes32 _node, bytes32 _label, address _owner) public authorised(_node) returns(bytes32) {
        bytes32 subnode = keccak256(abi.encodePacked(_node, _label));
        _setOwner(subnode, _owner);
        emit NewOwner(_node, _label, _owner);
        return subnode;
    }

    /**
     * @dev Sets the _resolver address for the specified _node.
     * @param _node The _node to update.
     * @param _resolver The address of the _resolver.
     */
    function setResolver(bytes32 _node, address _resolver) public authorised(_node) {
        emit NewResolver(_node, _resolver);
        records[_node].resolver = _resolver;
    }

    /**
     * @dev Sets the TTL for the specified _node.
     * @param _node The _node to update.
     * @param _ttl The TTL in seconds.
     */
    function setTTL(bytes32 _node, uint64 _ttl) public authorised(_node) {
        emit NewTTL(_node, _ttl);
        records[_node].ttl = _ttl;
    }

    /**
     * @dev Enable or disable approval for a third party ("_operator") to manage
     *  all of `msg.sender`'s ENS records. Emits the ApprovalForAll event.
     * @param _operator Address to add to the set of authorized operators.
     * @param _approved True if the _operator is _approved, false to revoke approval.
     */
    function setApprovalForAll(address _operator, bool _approved) external {
        operators[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /**
     * @dev Returns the address that owns the specified _node.
     * @param _node The specified _node.
     * @return address of the _owner.
     */
    function owner(bytes32 _node) public view returns (address) {
        address addr = records[_node].owner;
        if (addr == address(this)) {
            return address(0x0);
        }

        return addr;
    }

    /**
     * @dev Returns the address of the _resolver for the specified _node.
     * @param _node The specified _node.
     * @return address of the _resolver.
     */
    function resolver(bytes32 _node) public view returns (address) {
        return records[_node].resolver;
    }

    /**
     * @dev Returns the TTL of a _node, and any records associated with it.
     * @param _node The specified _node.
     * @return _ttl of the _node.
     */
    function ttl(bytes32 _node) public view returns (uint64) {
        return records[_node].ttl;
    }

    /**
     * @dev Returns whether a record has been imported to the registry.
     * @param _node The specified _node.
     * @return Bool if record exists
     */
    function recordExists(bytes32 _node) public view returns (bool) {
        return records[_node].owner != address(0x0);
    }

    /**
     * @dev Query if an address is an authorized _operator for another address.
     * @param _owner The address that owns the records.
     * @param _operator The address that acts on behalf of the _owner.
     * @return True if `_operator` is an _approved _operator for `_owner`, false otherwise.
     */
    function isApprovedForAll(address _owner, address _operator) external view returns (bool) {
        return operators[_owner][_operator];
    }

    function _setOwner(bytes32 _node, address _owner) internal {
        records[_node].owner = _owner;
    }

    function _setResolverAndTTL(bytes32 _node, address _resolver, uint64 _ttl) internal {
        if(_resolver != records[_node].resolver) {
            records[_node].resolver = _resolver;
            emit NewResolver(_node, _resolver);
        }

        if(_ttl != records[_node].ttl) {
            records[_node].ttl = _ttl;
            emit NewTTL(_node, _ttl);
        }
    }
}
