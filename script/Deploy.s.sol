// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <=0.9.0;

import { BaseScript } from "./Base.s.sol";
import { DeploymentConfig } from "./DeploymentConfig.s.sol";
import { UsernameRegistrar } from "../contracts/registry/UsernameRegistrar.sol";

contract Deploy is BaseScript {
    string public constant PARENT_REGISTRY_ENV_KEY = "PARENT_REGISTRY";

    function run() public returns (UsernameRegistrar registrar, DeploymentConfig deploymentConfig) {
        address parentRegistry = vm.envOr({ name: PARENT_REGISTRY_ENV_KEY, defaultValue: address(0) });

        deploymentConfig = new DeploymentConfig(broadcaster);
        return _deploy(parentRegistry, deploymentConfig);
    }

    function runMigration(
        UsernameRegistrar _currentRegistrar,
        DeploymentConfig deploymentConfig
    )
        public
        returns (UsernameRegistrar, DeploymentConfig)
    {
        return _deploy(address(_currentRegistrar), deploymentConfig);
    }

    function _deploy(
        address parentRegistry,
        DeploymentConfig deploymentConfig
    )
        public
        returns (UsernameRegistrar, DeploymentConfig)
    {
        DeploymentConfig.NetworkConfig memory config = deploymentConfig.getActiveNetworkConfig();

        bytes32 ensNode =
            deploymentConfig.getNameHash(deploymentConfig.ETH_NAMEHASH(), keccak256(abi.encodePacked(config.label)));

        if (parentRegistry == address(0)) {
            parentRegistry = config.ensRegistry.owner(ensNode);
        }

        vm.startBroadcast(config.deployer);
        UsernameRegistrar registrar = new UsernameRegistrar(
            config.token,
            config.ensRegistry,
            config.publicResolver,
            ensNode,
            config.usernameMinLength,
            config.reservedUsernamesMerkleRoot,
            parentRegistry,
            config.releaseDelay
        );
        vm.stopBroadcast();
        return (registrar, deploymentConfig);
    }
}
