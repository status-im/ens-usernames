// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <=0.9.0;

import { Script } from "forge-std/Script.sol";

contract DeploymentTestConfig is Script {
    error DeploymentConfig_InvalidDeployerAddress();
    error DeploymentConfig_NoConfigForChain(uint256);

    bytes32 constant ETH_LABELHASH = keccak256("eth");
    bytes32 constant ETH_NAMEHASH = keccak256(abi.encodePacked(bytes32(0x0), ETH_LABELHASH));

    struct RegistryConfig {
        string name;
        string registry;
        bytes32 label;
        bytes32 namehash;
        uint256 price;
    }

    struct NetworkConfig {
        address deployer;
        bytes32 reservedUsernamesMerkleRoot;
        uint256 usernameMinLength;
        RegistryConfig registry;
        RegistryConfig dummyRegistry;
        RegistryConfig dummy2Registry;
    }

    NetworkConfig private activeNetworkConfig_;

    address public deployer;

    constructor(address _broadcaster) {
        deployer = _broadcaster;
        if (block.chainid == 31_337) {
            activeNetworkConfig_ = getOrCreateAnvilEthConfig(_broadcaster);
        } else {
            revert DeploymentConfig_NoConfigForChain(block.chainid);
        }
        if (_broadcaster == address(0)) revert DeploymentConfig_InvalidDeployerAddress();
    }

    function activeNetworkConfig() public view returns (NetworkConfig memory) {
        return activeNetworkConfig_;
    }

    function getOrCreateAnvilEthConfig(address _deployer) public pure returns (NetworkConfig memory) {
        bytes32 reservedUsernamesMerkleRoot = 0xb46e19581b371ab0856ee8ffd05b33cbfd264755e18f2d004780bb929970a53e; // Replace
            // with actual merkle root

        RegistryConfig memory registry = RegistryConfig({
            name: "stateofus",
            registry: "stateofus.eth",
            label: keccak256(abi.encodePacked("stateofus")),
            namehash: keccak256(abi.encodePacked(ETH_NAMEHASH, keccak256("stateofus"))),
            price: 1000
        });

        RegistryConfig memory dummyRegistry = RegistryConfig({
            name: "dummyreg",
            registry: "dummyreg.eth",
            label: keccak256(abi.encodePacked("dummyreg")),
            namehash: keccak256(abi.encodePacked(ETH_NAMEHASH, keccak256("dummyreg"))),
            price: 1000
        });

        RegistryConfig memory dummy2Registry = RegistryConfig({
            name: "dummy2reg",
            registry: "dummy2reg.eth",
            label: keccak256(abi.encodePacked("dummy2reg")),
            namehash: keccak256(abi.encodePacked(ETH_NAMEHASH, keccak256("dummy2reg"))),
            price: 1000
        });

        return NetworkConfig({
            deployer: _deployer,
            reservedUsernamesMerkleRoot: reservedUsernamesMerkleRoot,
            usernameMinLength: 3,
            registry: registry,
            dummyRegistry: dummyRegistry,
            dummy2Registry: dummy2Registry
        });
    }

    function test() public { }
}
