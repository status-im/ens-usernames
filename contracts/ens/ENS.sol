// SPDX-License-Identifier: BSD-2-Clause

pragma solidity 0.8.25;

interface ENS {
    // Logged when the owner of a node assigns a new owner to a subnode.
    event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);

    // Logged when the owner of a node transfers ownership to a new account.
    event Transfer(bytes32 indexed node, address owner);

    // Logged when the resolver for a node changes.
    event NewResolver(bytes32 indexed node, address resolver);

    // Logged when the TTL of a node changes
    event NewTTL(bytes32 indexed node, uint64 ttl);

    // Logged when an operator is added or removed.
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function setRecord(bytes32 _node, address _owner, address _resolver, uint64 _ttl) external;
    function setSubnodeRecord(bytes32 _node, bytes32 _label, address _owner, address _resolver, uint64 _ttl) external;
    function setSubnodeOwner(bytes32 _node, bytes32 _label, address _owner) external returns (bytes32);
    function setResolver(bytes32 _node, address _resolver) external;
    function setOwner(bytes32 _node, address _owner) external;
    function setTTL(bytes32 _node, uint64 _ttl) external;
    function setApprovalForAll(address _operator, bool _approved) external;
    function owner(bytes32 _node) external view returns (address);
    function resolver(bytes32 _node) external view returns (address);
    function ttl(bytes32 _node) external view returns (uint64);
    function recordExists(bytes32 _node) external view returns (bool);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
}
