// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <=0.9.0;

import { BaseScript } from "./Base.s.sol";
import { DeploymentTestConfig } from "./DeploymentTestConfig.s.sol";
import { TestToken } from "../contracts/token/TestToken.sol";
import { ENSRegistry } from "../contracts/ens/ENSRegistry.sol";
import { PublicResolver } from "../contracts/ens/PublicResolver.sol";
import { UsernameRegistrar } from "../contracts/registry/UsernameRegistrar.sol";
import { UpdatedUsernameRegistrar } from "../contracts/mocks/UpdatedUsernameRegistrar.sol";

contract DeployTest is BaseScript {
    DeploymentTestConfig deploymentTestConfig;
    TestToken token;
    ENSRegistry ensRegistry;
    PublicResolver publicResolver;

    constructor() {
        deploymentTestConfig = new DeploymentTestConfig(broadcaster);
    }

    function run() public returns (TestToken, ENSRegistry, PublicResolver, DeploymentTestConfig) {
        DeploymentTestConfig.NetworkConfig memory config = deploymentTestConfig.activeNetworkConfig();

        vm.startBroadcast(broadcaster);
        token = new TestToken();
        ensRegistry = new ENSRegistry();
        publicResolver = new PublicResolver(ensRegistry);
        vm.stopBroadcast();

        return (token, ensRegistry, publicResolver, deploymentTestConfig);
    }

    function deployRegistry() public returns (UsernameRegistrar, UpdatedUsernameRegistrar, DeploymentTestConfig) {
        DeploymentTestConfig.NetworkConfig memory config = deploymentTestConfig.activeNetworkConfig();

        vm.startBroadcast(broadcaster);
        UsernameRegistrar usernameRegistrar = new UsernameRegistrar(
            token,
            ensRegistry,
            publicResolver,
            config.registry.namehash,
            config.usernameMinLength,
            config.reservedUsernamesMerkleRoot,
            address(0)
        );

        UpdatedUsernameRegistrar updatedUsernameRegistrar = new UpdatedUsernameRegistrar(
            token,
            ensRegistry,
            publicResolver,
            config.registry.namehash,
            config.usernameMinLength,
            config.reservedUsernamesMerkleRoot,
            address(usernameRegistrar)
        );
        vm.stopBroadcast();

        return (usernameRegistrar, updatedUsernameRegistrar, deploymentTestConfig);
    }
}
