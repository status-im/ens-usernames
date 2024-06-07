// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

library MerkleTree {
    error ElementDoesNotExist();

    function combinedHash(bytes32 first, bytes32 second) internal pure returns (bytes32) {
        if (first == bytes32(0)) {
            return second;
        }
        if (second == bytes32(0)) {
            return first;
        }
        return keccak256(abi.encodePacked(first, second));
    }

    function getLayers(bytes32[] memory elements) internal pure returns (bytes32[][] memory) {
        if (elements.length == 0) {
            bytes32[][] memory empty = new bytes32[][](1);
            empty;
            return empty;
        }

        uint256 layerCount = 1;
        uint256 remainingElements = elements.length;
        while (remainingElements > 1) {
            layerCount++;
            remainingElements = (remainingElements + 1) / 2;
        }

        bytes32[][] memory layers = new bytes32[][](layerCount);
        layers[0] = elements;

        for (uint256 i = 1; i < layerCount; i++) {
            layers[i] = getNextLayer(layers[i - 1]);
        }

        return layers;
    }

    function getNextLayer(bytes32[] memory elements) internal pure returns (bytes32[] memory) {
        uint256 nextLayerLength = (elements.length + 1) / 2;
        bytes32[] memory nextLayer = new bytes32[](nextLayerLength);

        for (uint256 i = 0; i < elements.length; i += 2) {
            bytes32 first = elements[i];
            bytes32 second = (i + 1 < elements.length) ? elements[i + 1] : bytes32(0);
            nextLayer[i / 2] = combinedHash(first, second);
        }

        return nextLayer;
    }

    function getRoot(bytes32[] memory elements) internal pure returns (bytes32) {
        bytes32[][] memory layers = getLayers(elements);
        return layers[layers.length - 1][0];
    }

    function getProof(bytes32[] memory elements, bytes32 element) internal pure returns (bytes32[] memory) {
        uint256 index = indexOf(elements, element);
        if (index == type(uint256).max) {
            revert ElementDoesNotExist();
        }

        bytes32[][] memory layers = getLayers(elements);
        uint256 proofLength = layers.length - 1;
        bytes32[] memory proof = new bytes32[](proofLength);

        for (uint256 i = 0; i < proofLength; i++) {
            uint256 pairIndex = (index % 2 == 0) ? index + 1 : index - 1;
            if (pairIndex < layers[i].length) {
                proof[i] = layers[i][pairIndex];
            } else {
                proof[i] = bytes32(0);
            }
            index = index / 2;
        }

        return proof;
    }

    function indexOf(bytes32[] memory elements, bytes32 element) internal pure returns (uint256) {
        for (uint256 i = 0; i < elements.length; i++) {
            if (elements[i] == element) {
                return i;
            }
        }
        return type(uint256).max;
    }

    function verifyProof(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            computedHash = combinedHash(computedHash, proof[i]);
        }

        return computedHash == root;
    }
}
