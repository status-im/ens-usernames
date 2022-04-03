// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.8.9;

import "./UsernameRegistrar.sol";
import "../common/MerkleProof.sol";

/** 
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice Defines static rules for slashing usernames.
 */
contract SlashMechanism {

    //Slashing conditions
    
    uint256 public usernameMinLength;
    bytes32 public reservedUsernamesMerkleRoot;

    constructor(
        uint256 _usernameMinLength,
        bytes32 _reservedUsernamesMerkleRoot
    ) {
        usernameMinLength = _usernameMinLength;
        reservedUsernamesMerkleRoot = _reservedUsernamesMerkleRoot;
    }

    /**
     * @notice Slash username smaller then `usernameMinLength`.
     * @param _username Raw value of offending username.
     * @param _registrar address of the registrar with the offending name.
     */
    function slashSmallUsername(
        string calldata _username,
        UsernameRegistrar _registrar
    )
        external
    {
        bytes memory username = bytes(_username);
        require(username.length < usernameMinLength, "Not a small username.");
        _registrar.slashUsername(_username, msg.sender);
    }

    /**
     * @notice Slash username starting with "0x" and with length greater than 12.
     * @param _username Raw value of offending username.
     * @param _registrar address of the registrar with the offending name.
     */
    function slashAddressLikeUsername(
        string calldata _username,
        UsernameRegistrar _registrar
    )
        external
    {
        bytes memory username = bytes(_username);
        require(username.length > 12, "Too small to look like an address.");
        require(username[0] == bytes1("0"), "First character need to be 0");
        require(username[1] == bytes1("x"), "Second character need to be x");
        for(uint i = 2; i < 7; i++){
            uint8 b = uint8(username[i]);
            require((b >= 48 && b <= 57) || (b >= 97 && b <= 102), "Does not look like an address");
        }
        _registrar.slashUsername(_username, msg.sender);
    }

    /**
     * @notice Slash username that is exactly a reserved name.
     * @param _username Raw value of offending username.
     * @param _proof Merkle proof that name is listed on merkle tree.
     * @param _registrar address of the registrar with the offending name.
     */
    function slashReservedUsername(
        string calldata _username,
        bytes32[] calldata _proof,
        UsernameRegistrar _registrar
    )
        external
    {
        bytes memory username = bytes(_username);
        require(
            MerkleProof.verifyProof(
                _proof,
                reservedUsernamesMerkleRoot,
                keccak256(username)
            ),
            "Invalid Proof."
        );
        _registrar.slashUsername(_username, msg.sender);
    }

    /**
     * @notice Slash username that contains a non alphanumeric character.
     * @param _username Raw value of offending username.
     * @param _offendingPos Position of non alphanumeric character.
     * @param _registrar address of the registrar with the offending name.
     */
    function slashInvalidUsername(
        string calldata _username,
        uint256 _offendingPos,
        UsernameRegistrar _registrar
    )
        external
    {
        bytes memory username = bytes(_username);
        require(username.length > _offendingPos, "Invalid position.");
        uint8 b = uint8(username[_offendingPos]);
        require(!((b >= 48 && b <= 57) || (b >= 97 && b <= 122)), "Not invalid character.");
        _registrar.slashUsername(_username, msg.sender);
    }

}