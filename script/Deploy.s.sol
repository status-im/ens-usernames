// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <=0.9.0;

import { UsernameRegistrar } from "../contracts/registry/UsernameRegistrar.sol";
import { BaseScript } from "./Base.s.sol";
import { DeploymentConfig } from "./DeploymentConfig.s.sol";

contract Deploy is BaseScript {
    function run() public returns (UsernameRegistrar registrar, DeploymentConfig deploymentConfig) {
        deploymentConfig = new DeploymentConfig(broadcaster);
        //registrar = new UsernameRegistrar();
    }
}
