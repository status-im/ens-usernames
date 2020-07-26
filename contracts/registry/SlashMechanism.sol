// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.5.11;

import "./UsernameRegistrar.sol";
import "../common/MerkleProof.sol";

/** 
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH) 
 * @notice Defines static rules for slashing usernames
 */
contract SlashMechanism {

    struct SlashReserve {
        address reserver;
        uint256 blockNumber;
        UsernameRegistrar registrar;
    }

    mapping (bytes32 => SlashReserve) reservedSlashers;
    //Slashing conditions
    uint256 public usernameMinLength;
    bytes32 public reservedUsernamesMerkleRoot;

    constructor(
        uint256 _usernameMinLength,
        bytes32 _reservedUsernamesMerkleRoot
    ) public {
        usernameMinLength = _usernameMinLength;
        reservedUsernamesMerkleRoot = _reservedUsernamesMerkleRoot;
    }

    /**
     * @notice secretly reserve the slashing reward to `msg.sender`
     * @param _secret keccak256(abi.encodePacked(label, reserveSecret)) 
     * @param _registrar address of the registrar with the offending name
     */
    function reserveSlash(UsernameRegistrar _registrar, bytes32 _secret) external {
        require(reservedSlashers[_secret].blockNumber == 0, "Already Reserved");
        reservedSlashers[_secret] = SlashReserve(msg.sender, block.number, _registrar);
    }

        /**
     * @notice Slash username smaller then `usernameMinLength`.
     * @param _username Raw value of offending username.
     */
    function slashSmallUsername(
        string calldata _username,
        uint256 _reserveSecret
    ) 
        external 
    {
        bytes memory username = bytes(_username);
        require(username.length < usernameMinLength, "Not a small username.");
        slashUsername(_username, _reserveSecret);
    }

    /**
     * @notice Slash username starting with "0x" and with length greater than 12.
     * @param _username Raw value of offending username.
     */
    function slashAddressLikeUsername(
        string calldata _username,
        uint256 _reserveSecret
    ) 
        external 
    {
        bytes memory username = bytes(_username);
        require(username.length > 12, "Too small to look like an address.");
        require(username[0] == byte("0"), "First character need to be 0");
        require(username[1] == byte("x"), "Second character need to be x");
        for(uint i = 2; i < 7; i++){
            uint8 b = uint8(username[i]);
            require((b >= 48 && b <= 57) || (b >= 97 && b <= 102), "Does not look like an address");
        }
        slashUsername(_username, _reserveSecret);
    }  

    /**
     * @notice Slash username that is exactly a reserved name.
     * @param _username Raw value of offending username.
     * @param _proof Merkle proof that name is listed on merkle tree.
     */
    function slashReservedUsername(
        string calldata _username,
        bytes32[] calldata _proof,
        uint256 _reserveSecret
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
        slashUsername(_username, _reserveSecret);
    }

    /**
     * @notice Slash username that contains a non alphanumeric character.
     * @param _username Raw value of offending username.
     * @param _offendingPos Position of non alphanumeric character.
     */
    function slashInvalidUsername(
        string calldata _username,
        uint256 _offendingPos,
        uint256 _reserveSecret
    ) 
        external
    { 
        bytes memory username = bytes(_username);
        require(username.length > _offendingPos, "Invalid position.");
        uint8 b = uint8(username[_offendingPos]);
        
        require(!((b >= 48 && b <= 57) || (b >= 97 && b <= 122)), "Not invalid character.");
    
        slashUsername(_username, _reserveSecret);
    }

    function slashUsername(string memory _username, uint256 _reserveSecret) internal{
        bytes32 secret = keccak256(abi.encodePacked(_username, _reserveSecret));
        SlashReserve memory reserve = reservedSlashers[secret];
        require(reserve.reserver != address(0), "Not reserved.");
        require(reserve.blockNumber < block.number, "Cannot reveal in same block");
        delete reservedSlashers[secret];
        reserve.registrar.slashUsername(_username, reserve.reserver);
    }
} 