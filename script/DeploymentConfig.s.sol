//// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.25 <=0.9.0;

import { Script } from "forge-std/Script.sol";
import { MiniMeToken } from "@vacp2p/minime/MiniMeToken.sol";
import { PublicResolver } from "@ensdomains/ens-contracts/resolvers/PublicResolver.sol";
import { ENSRegistry } from "@ensdomains/ens-contracts/registry/ENSRegistry.sol";

contract DeploymentConfig is Script {
    bytes32 public constant ETH_LABELHASH = keccak256("eth");
    // solhint-disable-next-line var-name-mixedcase
    bytes32 public immutable ETH_NAMEHASH = getNameHash(bytes32(0x0), ETH_LABELHASH);

    error DeploymentConfig_InvalidDeployerAddress();
    error DeploymentConfig_NoConfigForChain(uint256);

    struct NetworkConfig {
        address deployer;
        MiniMeToken token;
        ENSRegistry ensRegistry;
        PublicResolver publicResolver;
        string label;
        uint256 usernameMinLength;
        bytes32 reservedUsernamesMerkleRoot;
        address parentRegistry;
        uint256 releaseDelay;
    }

    NetworkConfig public activeNetworkConfig;

    function getActiveNetworkConfig() public view returns (NetworkConfig memory) {
        return activeNetworkConfig;
    }

    address private deployer;

    constructor(address _broadcaster) {
        if (_broadcaster == address(0)) revert DeploymentConfig_InvalidDeployerAddress();
        deployer = _broadcaster;
        if (block.chainid == 31_337) {
            activeNetworkConfig = getOrCreateAnvilEthConfig();
        } else if (block.chainid == 1) {
            activeNetworkConfig = getMainnetConfig();
        } else if (block.chainid == 5) {
            activeNetworkConfig = getGoerliConfig();
        } else if (block.chainid == 11_155_111) {
            activeNetworkConfig = getSepoliaConfig();
        } else {
            revert DeploymentConfig_NoConfigForChain(block.chainid);
        }
    }

    function getMainnetConfig() public view returns (NetworkConfig memory) {
        return NetworkConfig({
            deployer: deployer,
            token: MiniMeToken(payable(0x744d70FDBE2Ba4CF95131626614a1763DF805B9E)),
            ensRegistry: ENSRegistry(0x314159265dD8dbb310642f98f50C066173C1259b),
            publicResolver: PublicResolver(0x5FfC014343cd971B7eb70732021E26C35B744cc4),
            label: "stateofus",
            usernameMinLength: 3,
            reservedUsernamesMerkleRoot: 0xb46e19581b371ab0856ee8ffd05b33cbfd264755e18f2d004780bb929970a53e,
            parentRegistry: address(0),
            releaseDelay: 365 days
        });
    }

    function getGoerliConfig() public view returns (NetworkConfig memory) {
        return NetworkConfig({
            deployer: deployer,
            token: MiniMeToken(payable(0x3D6AFAA395C31FCd391fE3D562E75fe9E8ec7E6a)),
            ensRegistry: ENSRegistry(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e),
            publicResolver: PublicResolver(0xd7a4F6473f32aC2Af804B3686AE8F1932bC35750),
            label: "stateofus",
            usernameMinLength: 3,
            reservedUsernamesMerkleRoot: 0xb46e19581b371ab0856ee8ffd05b33cbfd264755e18f2d004780bb929970a53e,
            parentRegistry: address(0),
            releaseDelay: 365 days
        });
    }

    function getSepoliaConfig() public view returns (NetworkConfig memory) {
        return NetworkConfig({
            deployer: deployer,
            token: MiniMeToken(payable(0xE452027cdEF746c7Cd3DB31CB700428b16cD8E51)),
            ensRegistry: ENSRegistry(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e),
            publicResolver: PublicResolver(0x8FADE66B79cC9f707aB26799354482EB93a5B7dD),
            label: "stateofus",
            usernameMinLength: 3,
            reservedUsernamesMerkleRoot: 0xb46e19581b371ab0856ee8ffd05b33cbfd264755e18f2d004780bb929970a53e,
            parentRegistry: address(0),
            releaseDelay: 365 days
        });
    }

    function getOrCreateAnvilEthConfig() public returns (NetworkConfig memory) {
        vm.startBroadcast(deployer);
        MiniMeToken token =
            new MiniMeToken(MiniMeToken(payable(address(0))), 0, "Status Network Token", 18, "SNT", true);
        ENSRegistry ensRegistry = new ENSRegistry();
        PublicResolver publicResolver = new PublicResolver(ensRegistry);
        vm.stopBroadcast();

        return NetworkConfig({
            deployer: deployer,
            token: token,
            ensRegistry: ensRegistry,
            publicResolver: publicResolver,
            label: "stateofus",
            usernameMinLength: 3,
            reservedUsernamesMerkleRoot: 0xb46e19581b371ab0856ee8ffd05b33cbfd264755e18f2d004780bb929970a53e,
            parentRegistry: address(0),
            releaseDelay: 365 days
        });
    }

    // This function is a hack to have it excluded by `forge coverage` until
    // https://github.com/foundry-rs/foundry/issues/2988 is fixed.
    // See: https://github.com/foundry-rs/foundry/issues/2988#issuecomment-1437784542
    // for more info.
    // solhint-disable-next-line
    function test() public { }

    function getNameHash(bytes32 domain, bytes32 subdomain) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(domain, subdomain));
    }
}
