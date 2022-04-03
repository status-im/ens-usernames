// SPDX-License-Identifier: CC0-1.0

pragma solidity >=0.8.9;

import "../common/MerkleProof.sol";


contract MerkleProofWrapper {

    function verifyProof(
        bytes32[] memory _proof,
        bytes32 _root,
        bytes32 _leaf
    )
        public
        pure
        returns (bool)
    {
        return MerkleProof.verifyProof(_proof, _root, _leaf);
    }
}
