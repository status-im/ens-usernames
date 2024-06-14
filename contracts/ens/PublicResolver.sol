// SPDX-License-Identifier: BSD-2-Clause

pragma solidity 0.8.25;

import { ENS } from "./ENS.sol";

/**
 * A simple resolver anyone can use; only allows the owner of a node to set its
 * address.
 */
contract PublicResolver {
    bytes4 public constant INTERFACE_META_ID = 0x01ffc9a7;
    bytes4 public constant ADDR_INTERFACE_ID = 0x3b3b57de;
    bytes4 public constant NAME_INTERFACE_ID = 0x691f3431;
    bytes4 public constant ABI_INTERFACE_ID = 0x2203ab56;
    bytes4 public constant PUBKEY_INTERFACE_ID = 0xc8690233;
    bytes4 public constant TEXT_INTERFACE_ID = 0x59d1d43c;
    bytes4 public constant CONTENTHASH_INTERFACE_ID = 0xbc1c58d1;
    bytes4 public constant INTERFACE_INTERFACE_ID = bytes4(keccak256("interfaceImplementer(bytes32,bytes4)"));

    event AddrChanged(bytes32 indexed node, address a);
    event NameChanged(bytes32 indexed node, string name);
    event ABIChanged(bytes32 indexed node, uint256 indexed contentType);
    event PubkeyChanged(bytes32 indexed node, bytes32 x, bytes32 y);
    event TextChanged(bytes32 indexed node, string indexedKey, string key);
    event ContenthashChanged(bytes32 indexed node, bytes hash);
    event InterfaceChanged(bytes32 indexed node, bytes4 indexed interfaceID, address implementer);

    error NotOwner();
    error InvalidContentType();

    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }

    struct Record {
        address addr;
        string name;
        PublicKey pubkey;
        mapping(string => string) text;
        mapping(uint256 => bytes) abis;
        bytes contenthash;
        mapping(bytes4 => address) interfaces;
    }

    ENS public ens;

    mapping(bytes32 key => Record data) public records;

    modifier onlyOwner(bytes32 node) {
        if (ens.owner(node) != msg.sender) {
            revert NotOwner();
        }
        _;
    }

    /**
     * Constructor.
     * @param ensAddr The ENS registrar contract.
     */
    constructor(ENS ensAddr) {
        ens = ensAddr;
    }

    /**
     * Sets the address associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     * @param _addr The address to set.
     */
    function setAddr(bytes32 node, address _addr) external onlyOwner(node) {
        records[node].addr = _addr;
        emit AddrChanged(node, _addr);
    }

    /**
     * Sets the contenthash associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     * @param hash The contenthash to set
     */
    function setContenthash(bytes32 node, bytes calldata hash) external onlyOwner(node) {
        records[node].contenthash = hash;
        emit ContenthashChanged(node, hash);
    }

    /**
     * Sets the name associated with an ENS node, for reverse records.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     * @param _name The name to set.
     */
    function setName(bytes32 node, string calldata _name) external onlyOwner(node) {
        records[node].name = _name;
        emit NameChanged(node, _name);
    }

    /**
     * Sets the ABI associated with an ENS node.
     * Nodes may have one ABI of each content type. To remove an ABI, set it to
     * the empty string.
     * @param node The node to update.
     * @param contentType The content type of the ABI
     * @param data The ABI data.
     */
    function setABI(bytes32 node, uint256 contentType, bytes calldata data) external onlyOwner(node) {
        // Content types must be powers of 2
        if (((contentType - 1) & contentType) != 0) {
            revert InvalidContentType();
        }

        records[node].abis[contentType] = data;
        emit ABIChanged(node, contentType);
    }

    /**
     * Sets the SECP256k1 public key associated with an ENS node.
     * @param node The ENS node to query
     * @param x the X coordinate of the curve point for the public key.
     * @param y the Y coordinate of the curve point for the public key.
     */
    function setPubkey(bytes32 node, bytes32 x, bytes32 y) external onlyOwner(node) {
        records[node].pubkey = PublicKey(x, y);
        emit PubkeyChanged(node, x, y);
    }

    /**
     * Sets the text data associated with an ENS node and key.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     * @param key The key to set.
     * @param value The text data value to set.
     */
    function setText(bytes32 node, string calldata key, string calldata value) external onlyOwner(node) {
        records[node].text[key] = value;
        emit TextChanged(node, key, key);
    }

    /**
     * Sets an interface associated with a name.
     * Setting the address to 0 restores the
     * default behaviour of querying the contract at `addr()` for interface support.
     * @param node The node to update.
     * @param interfaceID The EIP 168 interface ID.
     * @param implementer The address of a contract that implements this interface for this node.
     */
    function setInterface(bytes32 node, bytes4 interfaceID, address implementer) external onlyOwner(node) {
        records[node].interfaces[interfaceID] = implementer;
        emit InterfaceChanged(node, interfaceID, implementer);
    }

    /**
     * Returns the text data associated with an ENS node and key.
     * @param node The ENS node to query.
     * @param key The text data key to query.
     * @return The associated text data.
     */
    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return records[node].text[key];
    }

    /**
     * Returns the SECP256k1 public key associated with an ENS node.
     * Defined in EIP 619.
     * @param node The ENS node to query
     * @return x Pubkey x point
     * @return y Pubkey y point
     */
    function pubkey(bytes32 node) external view returns (bytes32 x, bytes32 y) {
        return (records[node].pubkey.x, records[node].pubkey.y);
    }

    /**
     * Returns the ABI associated with an ENS node.
     * Defined in EIP205.
     * @param node The ENS node to query
     * @param contentTypes A bitwise OR of the ABI formats accepted by the caller.
     * @return contentType The content type of the return value
     * @return data The ABI data
     */
    function ABI(bytes32 node, uint256 contentTypes) external view returns (uint256, bytes memory) {
        Record storage record = records[node];

        for (uint256 contentType = 1; contentType <= contentTypes; contentType <<= 1) {
            if ((contentType & contentTypes) != 0 && record.abis[contentType].length > 0) {
                return (contentType, record.abis[contentType]);
            }
        }

        bytes memory empty;
        return (0, empty);
    }

    /**
     * Returns the name associated with an ENS node, for reverse records.
     * Defined in EIP181.
     * @param node The ENS node to query.
     * @return The associated name.
     */
    function name(bytes32 node) external view returns (string memory) {
        return records[node].name;
    }

    /**
     * Returns the address associated with an ENS node.
     * @param node The ENS node to query.
     * @return The associated address.
     */
    function addr(bytes32 node) public view returns (address) {
        return records[node].addr;
    }

    /**
     * Returns the contenthash associated with an ENS node.
     * @param node The ENS node to query.
     * @return The associated contenthash.
     */
    function contenthash(bytes32 node) external view returns (bytes memory) {
        return records[node].contenthash;
    }

    /**
     * Returns the address of a contract that implements the specified interface for this name.
     * If an implementer has not been set for this interfaceID and name, the resolver will query
     * the contract at `addr()`. If `addr()` is set, a contract exists at that address, and that
     * contract implements EIP168 and returns `true` for the specified interfaceID, its address
     * will be returned.
     * @param node The ENS node to query.
     * @param interfaceID The EIP 168 interface ID to check for.
     * @return The address that implements this interface, or 0 if the interface is unsupported.
     */
    function interfaceImplementer(bytes32 node, bytes4 interfaceID) external view returns (address) {
        address implementer = records[node].interfaces[interfaceID];
        if (implementer != address(0)) {
            return implementer;
        }

        address a = addr(node);
        if (a == address(0)) {
            return address(0);
        }

        (bool success, bytes memory returnData) =
            a.staticcall(abi.encodeWithSignature("supportsInterface(bytes4)", INTERFACE_META_ID));
        if (!success || returnData.length < 32 || returnData[31] == 0) {
            // EIP 168 not supported by target
            return address(0);
        }

        (success, returnData) = a.staticcall(abi.encodeWithSignature("supportsInterface(bytes4)", interfaceID));
        if (!success || returnData.length < 32 || returnData[31] == 0) {
            // Specified interface not supported by target
            return address(0);
        }

        return a;
    }

    /**
     * Returns true if the resolver implements the interface specified by the provided hash.
     * @param interfaceID The ID of the interface to check for.
     * @return True if the contract implements the requested interface.
     */
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return interfaceID == ADDR_INTERFACE_ID || interfaceID == NAME_INTERFACE_ID || interfaceID == ABI_INTERFACE_ID
            || interfaceID == PUBKEY_INTERFACE_ID || interfaceID == TEXT_INTERFACE_ID
            || interfaceID == CONTENTHASH_INTERFACE_ID || interfaceID == INTERFACE_INTERFACE_ID
            || interfaceID == INTERFACE_META_ID;
    }
}
