// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { Test } from "forge-std/Test.sol";

import { MerkleProofWrapper } from "../contracts/test/MerkleProofWrapper.sol";
import { MerkleTree } from "../contracts/test/MerkleTree.sol";

contract MerkleProofTest is Test {
    MerkleProofWrapper private merkleProofWrapper = new MerkleProofWrapper();

    using MerkleTree for bytes32[];

    function setUp() public {
        merkleProofWrapper = new MerkleProofWrapper();
    }

    function testVerifyProofValidProof() public {
        bytes32[] memory elements = new bytes32[](4);
        elements[0] = keccak256(abi.encodePacked("a"));
        elements[1] = keccak256(abi.encodePacked("b"));
        elements[2] = keccak256(abi.encodePacked("c"));
        elements[3] = keccak256(abi.encodePacked("d"));

        bytes32 root = elements.getRoot();
        bytes32[] memory proof = elements.getProof(elements[2]);
        bytes32 leaf = elements[2];

        bool result = merkleProofWrapper.verifyProof(proof, root, leaf);

        assertTrue(result);
    }

    function testVerifyProofInvalidProof() public {
        bytes32[] memory correctElements = new bytes32[](3);
        correctElements[0] = keccak256(abi.encodePacked("a"));
        correctElements[1] = keccak256(abi.encodePacked("b"));
        correctElements[2] = keccak256(abi.encodePacked("c"));

        bytes32 correctRoot = correctElements.getRoot(); // Replace with actual root
        bytes32 correctLeaf = keccak256(abi.encodePacked("a"));

        bytes32[] memory badElements = new bytes32[](3);
        badElements[0] = keccak256(abi.encodePacked("d"));
        badElements[1] = keccak256(abi.encodePacked("e"));
        badElements[2] = keccak256(abi.encodePacked("f"));

        bytes32[] memory badProof = badElements.getProof(badElements[1]); // Replace with actual bad proof

        bool result = merkleProofWrapper.verifyProof(badProof, correctRoot, correctLeaf);

        assertFalse(result);
    }

    function testVerifyProofInvalidLengthProof() public {
        bytes32[] memory elements = new bytes32[](3);
        elements[0] = keccak256(abi.encodePacked("a"));
        elements[1] = keccak256(abi.encodePacked("b"));
        elements[2] = keccak256(abi.encodePacked("c"));

        bytes32 root = elements.getRoot(); // Replace with actual root
        bytes32[] memory proof = elements.getProof(elements[1]); // Replace with actual proof
        bytes32[] memory badProof = new bytes32[](1);
        badProof[0] = proof[0];

        bytes32 leaf = elements[1];

        bool result = merkleProofWrapper.verifyProof(badProof, root, leaf);

        assertFalse(result);
    }
}
