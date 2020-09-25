// SPDX-License-Identifier: BSD-2-Clause

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

/**
 * A generic resolver interface which includes all the functions including the ones deprecated
 */
interface Resolver{
    event AddrChanged(bytes32 indexed node, address a);
    event AddressChanged(bytes32 indexed node, uint coinType, bytes newAddress);
    event NameChanged(bytes32 indexed node, string name);
    event ABIChanged(bytes32 indexed node, uint256 indexed contentType);
    event PubkeyChanged(bytes32 indexed node, bytes32 x, bytes32 y);
    event TextChanged(bytes32 indexed node, string indexed indexedKey, string key);
    event ContenthashChanged(bytes32 indexed node, bytes hash);
    /* Deprecated events */
    event ContentChanged(bytes32 indexed node, bytes32 hash);

    function ABI(bytes32 _node, uint256 _contentTypes) external view returns (uint256, bytes memory);
    function addr(bytes32 _node) external view returns (address);
    function addr(bytes32 _node, uint _coinType) external view returns(bytes memory);
    function contenthash(bytes32 _node) external view returns (bytes memory);
    function dnsrr(bytes32 _node) external view returns (bytes memory);
    function name(bytes32 _node) external view returns (string memory);
    function pubkey(bytes32 _node) external view returns (bytes32 x, bytes32 y);
    function text(bytes32 _node, string calldata _key) external view returns (string memory);
    function interfaceImplementer(bytes32 _node, bytes4 _interfaceID) external view returns (address);
    function setABI(bytes32 _node, uint256 _contentType, bytes calldata _data) external;
    function setAddr(bytes32 _node, address _addr) external;
    function setAddr(bytes32 _node, uint _coinType, bytes calldata _a) external;
    function setContenthash(bytes32 _node, bytes calldata _hash) external;
    function setDnsrr(bytes32 _node, bytes calldata _data) external;
    function setName(bytes32 _node, string calldata _name) external;
    function setPubkey(bytes32 _node, bytes32 _x, bytes32 _y) external;
    function setText(bytes32 _node, string calldata _key, string calldata _value) external;
    function setInterface(bytes32 _node, bytes4 _interfaceID, address _implementer) external;
    function supportsInterface(bytes4 _interfaceID) external pure returns (bool);
    function multicall(bytes[] calldata _data) external returns(bytes[] memory results);

    /* Deprecated functions */
    function content(bytes32 _node) external view returns (bytes32);
    function multihash(bytes32 _node) external view returns (bytes memory);
    function setContent(bytes32 _node, bytes32 hash) external;
    function setMultihash(bytes32 _node, bytes calldata _hash) external;
}
