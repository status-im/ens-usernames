// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import { Test } from "forge-std/Test.sol";
import { Deploy } from "../script/Deploy.s.sol";
import { DeploymentConfig } from "../script/DeploymentConfig.s.sol";
import { ENS } from "@ensdomains/ens-contracts/registry/ENS.sol";
import { PublicResolver } from "@ensdomains/ens-contracts/resolvers/PublicResolver.sol";
import { PubkeyResolver } from "@ensdomains/ens-contracts/resolvers/profiles/PubkeyResolver.sol";
import { AddrResolver } from "@ensdomains/ens-contracts/resolvers/profiles/AddrResolver.sol";
import { ENSRegistry } from "@ensdomains/ens-contracts/registry/ENSRegistry.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { NotEnoughBalance } from "@vacp2p/minime/MiniMeBase.sol";
import { UsernameRegistrar } from "../contracts/registry/UsernameRegistrar.sol";

contract UsernameRegistrarTest is Test {
    Deploy public deployment;
    DeploymentConfig public deploymentConfig;
    UsernameRegistrar public usernameRegistrar;
    DeploymentConfig.NetworkConfig public config;
    bytes32 public ensNode;
    address public deployer;
    ENSRegistry public ensRegistry;
    address public testUser = makeAddr("testUser");
    bytes32 public ethLabelHash;
    bytes32 public ethNameHash;
    string public label;

    function setUp() public virtual {
        deployment = new Deploy();
        (usernameRegistrar, deploymentConfig) = deployment.run();
        config = deploymentConfig.getActiveNetworkConfig();
        deployer = config.deployer;
        ensRegistry = config.ensRegistry;
        ethLabelHash = deploymentConfig.ETH_LABELHASH();
        ethNameHash = deploymentConfig.ETH_NAMEHASH();
        label = config.label;
        ensNode = deploymentConfig.getNameHash(ethNameHash, keccak256(abi.encodePacked(label)));

        vm.prank(deployer);
        ensRegistry.setSubnodeOwner(0x0, ethLabelHash, deployer);

        assert(ensRegistry.owner(ethNameHash) == deployer);
    }

    function testDeployment() public {
        assertEq(address(usernameRegistrar.token()), address(config.token), "Token address mismatch");
        assertEq(address(usernameRegistrar.ensRegistry()), address(ensRegistry), "ENS Registry address mismatch");
        assertEq(
            address(usernameRegistrar.resolver()), address(config.publicResolver), "Public resolver address mismatch"
        );
        assertEq(usernameRegistrar.ensNode(), ensNode, "ENS node mismatch");
        assertEq(usernameRegistrar.usernameMinLength(), config.usernameMinLength, "Username minimum length mismatch");
        assertEq(
            usernameRegistrar.reservedUsernamesMerkleRoot(),
            config.reservedUsernamesMerkleRoot,
            "Reserved usernames merkle root mismatch"
        );
        assertEq(usernameRegistrar.parentRegistry(), address(0), "Parent registry address should be zero");
        assertEq(usernameRegistrar.controller(), deployer, "Controller address mismatch");
    }

    function getNameHash(bytes32 domain, bytes32 subdomain) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(domain, subdomain));
    }

    function registerName(
        UsernameRegistrar _usernameRegistrar,
        address registrant,
        string memory username,
        address account,
        bytes32 pubkeyA,
        bytes32 pubkeyB
    )
        internal
        returns (bytes32 label, bytes32 nameHash)
    {
        return registerName(_usernameRegistrar, registrant, username, account, pubkeyA, pubkeyB, false);
    }

    function registerName(
        UsernameRegistrar _usernameRegistrar,
        address registrant,
        string memory username,
        address account,
        bytes32 pubkeyA,
        bytes32 pubkeyB,
        bool approveAndCall
    )
        internal
        returns (bytes32 label, bytes32 nameHash)
    {
        label = keccak256(abi.encodePacked(username));
        nameHash = getNameHash(_usernameRegistrar.ensNode(), label);
        uint256 price = _usernameRegistrar.price();
        if (price > 0) {
            vm.prank(deployer);
            config.token.generateTokens(registrant, price);
            vm.expectEmit(true, true, true, true, address(config.token));
            emit IERC20.Approval(registrant, address(_usernameRegistrar), price);
            if (!approveAndCall) {
                vm.prank(registrant);
                config.token.approve(address(_usernameRegistrar), price);
            }
        }

        vm.expectEmit(true, true, true, true, address(config.token));
        emit IERC20.Transfer(registrant, address(_usernameRegistrar), price);
        if (account != address(0) || pubkeyA != bytes32(0) || pubkeyB != bytes32(0)) {
            vm.expectEmit(true, true, true, true, address(ensRegistry));
            emit ENS.NewOwner(_usernameRegistrar.ensNode(), label, address(_usernameRegistrar));
            vm.expectEmit(true, true, true, true, address(ensRegistry));
            emit ENS.NewResolver(nameHash, address(config.publicResolver));

            if (account != address(0)) {
                vm.expectEmit(true, true, true, true, address(config.publicResolver));
                emit AddrResolver.AddrChanged(nameHash, account);
            }
            if (pubkeyA != bytes32(0) || pubkeyB != bytes32(0)) {
                vm.expectEmit(true, true, true, true, address(config.publicResolver));
                emit PubkeyResolver.PubkeyChanged(nameHash, pubkeyA, pubkeyB);
            }
            vm.expectEmit(true, true, true, true, address(ensRegistry));
            emit ENS.Transfer(nameHash, registrant);
        } else {
            vm.expectEmit(true, true, true, true, address(ensRegistry));
            emit ENS.NewOwner(_usernameRegistrar.ensNode(), label, registrant);
        }
        vm.expectEmit(true, true, true, true, address(_usernameRegistrar));

        emit UsernameRegistrar.UsernameOwner(nameHash, registrant);
        vm.prank(registrant);
        if (approveAndCall) {
            config.token.approveAndCall(
                address(_usernameRegistrar),
                price,
                abi.encodePacked(UsernameRegistrar.register.selector, abi.encode(label, account, pubkeyA, pubkeyB))
            );
        } else {
            _usernameRegistrar.register(label, account, pubkeyA, pubkeyB);
        }
    }

    function registerName(
        UsernameRegistrar _usernameRegistrar,
        address registrant,
        string memory username
    )
        internal
        returns (bytes32 label, bytes32 nameHash)
    {
        return registerName(_usernameRegistrar, registrant, username, address(0), bytes32(0), bytes32(0));
    }

    function registerName(
        UsernameRegistrar _usernameRegistrar,
        address registrant,
        string memory username,
        bool approveAndCall
    )
        internal
        returns (bytes32 label, bytes32 nameHash)
    {
        return
            registerName(_usernameRegistrar, registrant, username, address(0), bytes32(0), bytes32(0), approveAndCall);
    }

    function generateXY(bytes memory pub) internal pure returns (bytes32, bytes32) {
        require(pub.length == 65, "Invalid public key length");
        // First byte should be 0x04
        require(uint8(pub[0]) == 0x04, "Invalid public key format");

        bytes32 x;
        bytes32 y;

        // Load X and Y coordinates from the public key
        // solhint-disable-next-line no-inline-assembly
        assembly {
            x := mload(add(pub, 0x21))
            y := mload(add(pub, 0x41))
        }

        return (x, y);
    }

    function keyFromXY(bytes32 x, bytes32 y) internal pure returns (bytes memory) {
        bytes memory publicKey = new bytes(65);
        publicKey[0] = bytes1(0x04);

        // solhint-disable-next-line no-inline-assembly
        assembly {
            mstore(add(publicKey, 0x21), x)
            mstore(add(publicKey, 0x41), y)
        }

        return publicKey;
    }
}

contract UsernameRegistrarActivateTest is UsernameRegistrarTest {
    UsernameRegistrar public updatedUsernameRegistrar;

    function testActivateRegistry() public {
        vm.prank(deployer);
        ensRegistry.setSubnodeOwner(ethNameHash, keccak256(abi.encodePacked(label)), address(usernameRegistrar));
        uint256 initialPrice = 1000;
        vm.prank(deployer);
        usernameRegistrar.activate(initialPrice);
        assertEq(usernameRegistrar.price(), initialPrice, "Registry price mismatch after activation");
        assertEq(uint8(usernameRegistrar.state()), 1, "Registry state should be active");
    }

    function testRegisterUnactivated() public {
        vm.expectRevert("Registry not active.");
        usernameRegistrar.register(keccak256("name"), address(0), bytes32(0), bytes32(0));
    }
}

contract UsernameRegistrarRegisterTest is UsernameRegistrarTest {
    UsernameRegistrar public updatedUsernameRegistrar;

    function setUp() public virtual override {
        super.setUp();
        vm.prank(deployer);
        ensRegistry.setSubnodeOwner(ethNameHash, keccak256(abi.encodePacked(label)), address(usernameRegistrar));

        uint256 initialPrice = 1000;
        vm.prank(deployer);
        usernameRegistrar.activate(initialPrice);
    }

    function testRegisterUsername() public {
        address registrant = testUser;
        string memory username = "testuser";
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        uint256 price = usernameRegistrar.price();

        assertEq(ensRegistry.owner(namehash), registrant, "Registrant should own the username hash in ENS registry");
        assertEq(
            usernameRegistrar.getAccountBalance(label), price, "Account balance should equal the registration price"
        );
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch after registration");
    }

    function testRegisterUsernameWithNoAllowanceOrBalance() public {
        vm.startPrank(testUser);
        vm.expectRevert("Unallowed to spend.");
        usernameRegistrar.register(keccak256("name"), address(0), bytes32(0), bytes32(0));

        config.token.approve(address(usernameRegistrar), usernameRegistrar.price() - 1);
        vm.expectRevert("Unallowed to spend.");
        usernameRegistrar.register(keccak256("name"), address(0), bytes32(0), bytes32(0));

        config.token.approve(address(usernameRegistrar), 0);
        config.token.approve(address(usernameRegistrar), usernameRegistrar.price());
        vm.expectRevert(NotEnoughBalance.selector);
        usernameRegistrar.register(keccak256("name"), address(0), bytes32(0), bytes32(0));
    }

    function testRegisterAlreadyInUse() public {
        bytes32 ensNode = usernameRegistrar.ensNode();
        bytes32 impossibleCase = keccak256("anyname");
        address registrant = testUser;

        vm.prank(address(usernameRegistrar));
        ensRegistry.setSubnodeOwner(ensNode, impossibleCase, registrant);
        vm.expectRevert("ENS node already owned.");
        usernameRegistrar.register(impossibleCase, address(0), bytes32(0), bytes32(0));

        string memory username = "testuser";
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username, true);

        vm.prank(registrant);
        ensRegistry.setOwner(namehash, address(0));

        vm.expectRevert("Username already registered.");
        usernameRegistrar.register(label, address(0), bytes32(0), bytes32(0));
    }

    function testRegisterUsernameApproveAndCall() public {
        address registrant = testUser;
        string memory username = "testuser";
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username, true);

        uint256 price = usernameRegistrar.price();

        assertEq(ensRegistry.owner(namehash), registrant, "Registrant should own the username hash in ENS registry");
        assertEq(
            usernameRegistrar.getAccountBalance(label), price, "Account balance should equal the registration price"
        );
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch after registration");
    }

    function testReleaseUsername() public {
        address registrant = testUser;
        string memory username = "releasetest";
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() + 1);

        vm.prank(registrant);
        usernameRegistrar.release(label);

        assertEq(ensRegistry.owner(namehash), address(0), "ENS owner should be zero after release");
        assertEq(usernameRegistrar.getAccountBalance(label), 0, "Account balance should be zero after release");
        assertEq(usernameRegistrar.getAccountOwner(label), address(0), "Account owner should be zero after release");
    }

    function testReleaseUsernameByNewOwner() public {
        address registrant = testUser;
        string memory username = "releasetest";
        address newUser = makeAddr("newUser");

        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() + 1);
        vm.prank(registrant);
        ensRegistry.setOwner(namehash, newUser);

        vm.prank(registrant);
        vm.expectRevert("Not owner of ENS node.");
        usernameRegistrar.release(label);

        vm.prank(newUser);
        usernameRegistrar.release(label);

        assertEq(ensRegistry.owner(namehash), address(0), "ENS owner should be zero after release");
        assertEq(usernameRegistrar.getAccountBalance(label), 0, "Account balance should be zero after release");
        assertEq(usernameRegistrar.getAccountOwner(label), address(0), "Account owner should be zero after release");
    }

    function testShouldNotReleaseUsernameBeforeDelay() public {
        address registrant = testUser;
        string memory username = "releasetest";
        (bytes32 label,) = registerName(usernameRegistrar, registrant, username);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() - 1);

        vm.prank(registrant);
        vm.expectRevert("Release period not reached.");
        usernameRegistrar.release(label);
    }

    function testShouldNotReleaseUsernameFromOther() public {
        address registrant = testUser;
        string memory username = "releasetest";
        (bytes32 label,) = registerName(usernameRegistrar, registrant, username);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() + 1);

        vm.prank(deployer);
        vm.expectRevert("Not owner of ENS node.");
        usernameRegistrar.release(label);
    }

    function testShouldNotReleaseUsernameNotRegistered() public {
        address registrant = testUser;
        string memory username = "releasetest";
        registerName(usernameRegistrar, registrant, username);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() + 1);

        vm.prank(registrant);
        vm.expectRevert("Username not registered.");
        usernameRegistrar.release(keccak256("anyname"));
    }

    function testReleaseWhenMigrated() public {
        (updatedUsernameRegistrar,) = deployment.runMigration(usernameRegistrar, deploymentConfig);
        address registrant = testUser;
        string memory username = "releasetest";
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() + 1);

        vm.prank(deployer);
        usernameRegistrar.moveRegistry(updatedUsernameRegistrar);

        vm.prank(registrant);
        usernameRegistrar.release(label);

        assertEq(ensRegistry.owner(namehash), address(0), "ENS owner should be zero after release");
        assertEq(usernameRegistrar.getAccountBalance(label), 0, "Account balance should be zero after release");
        assertEq(usernameRegistrar.getAccountOwner(label), address(0), "Account owner should be zero after release");
    }

    function testReleaseWhenMigratedByOldOwner() public {
        (updatedUsernameRegistrar,) = deployment.runMigration(usernameRegistrar, deploymentConfig);
        address registrant = testUser;
        address newUser = makeAddr("newUser");
        string memory username = "releasetest";
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() + 1);

        vm.prank(deployer);
        usernameRegistrar.moveRegistry(updatedUsernameRegistrar);

        vm.prank(registrant);
        ensRegistry.setOwner(namehash, newUser);

        vm.prank(newUser);
        vm.expectRevert("Not the former account owner.");
        usernameRegistrar.release(label);

        vm.prank(registrant);
        usernameRegistrar.release(label);

        assertEq(ensRegistry.owner(namehash), address(0), "ENS owner should be zero after release");
        assertEq(usernameRegistrar.getAccountBalance(label), 0, "Account balance should be zero after release");
        assertEq(usernameRegistrar.getAccountOwner(label), address(0), "Account owner should be zero after release");
    }

    function testUpdateRegistryPrice() public {
        uint256 newPrice = 2000;
        vm.prank(deployer);
        usernameRegistrar.updateRegistryPrice(newPrice);
        assertEq(usernameRegistrar.price(), newPrice, "Registry price should be updated");
    }

    function testMoveRegistry() public {
        (updatedUsernameRegistrar,) = deployment.runMigration(usernameRegistrar, deploymentConfig);
        vm.prank(deployer);
        usernameRegistrar.moveRegistry(updatedUsernameRegistrar);
        assertEq(
            uint8(usernameRegistrar.state()),
            uint8(UsernameRegistrar.RegistrarState.Moved),
            "Registry state should be moved"
        );
        assertEq(
            ensRegistry.owner(usernameRegistrar.ensNode()),
            address(updatedUsernameRegistrar),
            "New registry should own the ENS node"
        );
        assertEq(updatedUsernameRegistrar.price(), usernameRegistrar.price(), "Moved registry didn't retrieve price");
    }

    function testUpdateAccountOwner() public {
        (updatedUsernameRegistrar,) = deployment.runMigration(usernameRegistrar, deploymentConfig);
        address registrant = testUser;
        address newUser = makeAddr("newUser");
        string memory username = "testuser";

        bytes32 ensNode = usernameRegistrar.ensNode();
        bytes32 impossibleCase = keccak256("anyname");

        vm.prank(address(usernameRegistrar));
        ensRegistry.setSubnodeOwner(ensNode, impossibleCase, registrant);

        vm.prank(registrant);
        vm.expectRevert("Username not registered.");
        usernameRegistrar.updateAccountOwner(impossibleCase);

        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        vm.prank(registrant);
        ensRegistry.setOwner(namehash, newUser);

        vm.prank(registrant);
        vm.expectRevert("Caller not owner of ENS node.");
        usernameRegistrar.updateAccountOwner(label);

        vm.prank(newUser);
        usernameRegistrar.updateAccountOwner(label);

        assertEq(usernameRegistrar.getAccountOwner(label), newUser, "Account owner should be updated");

        vm.prank(deployer);
        usernameRegistrar.moveRegistry(updatedUsernameRegistrar);

        vm.prank(newUser);
        ensRegistry.setOwner(namehash, registrant);

        vm.prank(registrant);
        vm.expectRevert("Registry not owner of registry.");
        usernameRegistrar.updateAccountOwner(label);
    }

    function testSlashSmallUsername() public {
        string memory username = "a";

        address registrant = testUser;
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);
        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() / 2);

        uint256 reserveSecret = 123_456;
        address slasher = makeAddr("slasher");
        bytes32 secret = keccak256(abi.encodePacked(namehash, usernameRegistrar.getCreationTime(label), reserveSecret));
        vm.prank(slasher);
        usernameRegistrar.reserveSlash(secret);
        vm.roll(block.number + 1);
        vm.prank(slasher);
        usernameRegistrar.slashSmallUsername(username, reserveSecret);

        assertEq(ensRegistry.owner(namehash), address(0), "Username should be slashed and ownership set to zero");
    }

    function testSlashAddressLikeUsername() public {
        string memory username = "0xc6b95bd261233213";

        address registrant = testUser;
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() / 2);

        uint256 reserveSecret = 123_456;
        address slasher = makeAddr("slasher");
        vm.startPrank(slasher);
        bytes32 secret = keccak256(abi.encodePacked(namehash, usernameRegistrar.getCreationTime(label), reserveSecret));

        usernameRegistrar.reserveSlash(secret);

        vm.roll(block.number + 1);
        usernameRegistrar.slashAddressLikeUsername(username, reserveSecret);

        vm.stopPrank();
        assertEq(ensRegistry.owner(namehash), address(0), "Username should be slashed and ownership set to zero");
    }

    function testRegisterUsernameWithoutAnything() public {
        address registrant = testUser;
        string memory username = "bob";
        (bytes32 label, bytes32 namehash) =
            registerName(usernameRegistrar, registrant, username, address(0), bytes32(0), bytes32(0));
        uint256 price = usernameRegistrar.price();
        assertEq(ensRegistry.owner(namehash), registrant, "Registrant should own the username hash in ENS registry");
        assertEq(address(ensRegistry.resolver(namehash)), address(0), "It shouldnt have a resolver");
        assertEq(
            usernameRegistrar.getAccountBalance(label), price, "Account balance should equal the registration price"
        );
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch after registration");
    }

    function testRegisterUsernameWithoutAnythingApproveAndCall() public {
        address registrant = testUser;
        string memory username = "bob";
        (bytes32 label, bytes32 namehash) =
            registerName(usernameRegistrar, registrant, username, address(0), bytes32(0), bytes32(0), true);
        uint256 price = usernameRegistrar.price();
        assertEq(ensRegistry.owner(namehash), registrant, "Registrant should own the username hash in ENS registry");
        assertEq(address(ensRegistry.resolver(namehash)), address(0), "It shouldnt have a resolver");
        assertEq(
            usernameRegistrar.getAccountBalance(label), price, "Account balance should equal the registration price"
        );
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch after registration");
    }

    function testRegisterUsernameWithOnlyAddress() public {
        address registrant = testUser;
        string memory username = "bob";
        (bytes32 label, bytes32 namehash) =
            registerName(usernameRegistrar, registrant, username, registrant, bytes32(0), bytes32(0));
        uint256 price = usernameRegistrar.price();
        assertEq(ensRegistry.owner(namehash), registrant, "Registrant should own the username hash in ENS registry");
        assertEq(
            PublicResolver(ensRegistry.resolver(namehash)).addr(namehash), registrant, "It should resolve an address"
        );
        (bytes32 a, bytes32 b) = PublicResolver(ensRegistry.resolver(namehash)).pubkey(namehash);
        assertEq(a, bytes32(0), "It should not resolve a pubkey a");
        assertEq(b, bytes32(0), "It should not resolve a pubkey b");
        assertEq(
            usernameRegistrar.getAccountBalance(label), price, "Account balance should equal the registration price"
        );
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch after registration");
    }

    function testRegisterUsernameWithOnlyAddressApproveAndCall() public {
        address registrant = testUser;
        string memory username = "bob";
        (bytes32 label, bytes32 namehash) =
            registerName(usernameRegistrar, registrant, username, registrant, bytes32(0), bytes32(0), true);
        uint256 price = usernameRegistrar.price();
        assertEq(ensRegistry.owner(namehash), registrant, "Registrant should own the username hash in ENS registry");
        assertEq(
            PublicResolver(ensRegistry.resolver(namehash)).addr(namehash), registrant, "It should resolve an address"
        );
        (bytes32 a, bytes32 b) = PublicResolver(ensRegistry.resolver(namehash)).pubkey(namehash);
        assertEq(a, bytes32(0), "It should not resolve a pubkey a");
        assertEq(b, bytes32(0), "It should not resolve a pubkey b");
        assertEq(
            usernameRegistrar.getAccountBalance(label), price, "Account balance should equal the registration price"
        );
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch after registration");
    }

    function testRegisterUsernameWithOnlyPubkey() public {
        address registrant = testUser;
        string memory username = "bob";
        bytes memory contactCode =
        // solhint-disable-next-line max-line-length
            hex"04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82";

        (bytes32 x, bytes32 y) = generateXY(contactCode);

        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username, address(0), x, y);
        uint256 price = usernameRegistrar.price();
        assertEq(ensRegistry.owner(namehash), registrant, "Registrant should own the username hash in ENS registry");
        assertEq(
            PublicResolver(ensRegistry.resolver(namehash)).addr(namehash), address(0), "It should resolve an address"
        );
        (bytes32 resX, bytes32 resY) = PublicResolver(ensRegistry.resolver(namehash)).pubkey(namehash);
        assertEq(keccak256(abi.encodePacked(resX, resY)), keccak256(abi.encodePacked(x, y)), "Pubkey does not match");
        assertEq(
            usernameRegistrar.getAccountBalance(label), price, "Account balance should equal the registration price"
        );
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch after registration");
    }

    function testRegisterUsernameWithOnlyPubkeyApproveAndCall() public {
        address registrant = testUser;
        string memory username = "bob";
        bytes memory contactCode =
        // solhint-disable-next-line max-line-length
            hex"04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82";

        (bytes32 x, bytes32 y) = generateXY(contactCode);

        (bytes32 label, bytes32 namehash) =
            registerName(usernameRegistrar, registrant, username, address(0), x, y, true);
        uint256 price = usernameRegistrar.price();
        assertEq(ensRegistry.owner(namehash), registrant, "Registrant should own the username hash in ENS registry");
        assertEq(
            PublicResolver(ensRegistry.resolver(namehash)).addr(namehash), address(0), "It should resolve an address"
        );
        (bytes32 resX, bytes32 resY) = PublicResolver(ensRegistry.resolver(namehash)).pubkey(namehash);
        assertEq(keccak256(abi.encodePacked(resX, resY)), keccak256(abi.encodePacked(x, y)), "Pubkey does not match");
        assertEq(
            usernameRegistrar.getAccountBalance(label), price, "Account balance should equal the registration price"
        );
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch after registration");
    }

    function testRegisterUsernameWithAccountAndPubKey() public {
        address registrant = testUser;
        address account = makeAddr("account");
        string memory username = "bob2";

        bytes memory contactCode =
        // solhint-disable-next-line max-line-length
            hex"04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82";
        (bytes32 x, bytes32 y) = generateXY(contactCode);

        (bytes32 label, bytes32 usernameHash) = registerName(usernameRegistrar, registrant, username, account, x, y);
        // Assert results
        assertEq(ensRegistry.owner(usernameHash), registrant, "ENSRegistry owner mismatch");
        assertEq(ensRegistry.resolver(usernameHash), address(config.publicResolver), "Resolver wrongly defined");
        assertEq(usernameRegistrar.getAccountBalance(label), usernameRegistrar.price(), "Wrong account balance");
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch");
        assertEq(config.publicResolver.addr(usernameHash), account, "Resolved address not set");

        (bytes32 resX, bytes32 resY) = config.publicResolver.pubkey(usernameHash);
        bytes memory resContactCode = keyFromXY(resX, resY);
        assertEq(keccak256(abi.encodePacked(resX, resY)), keccak256(abi.encodePacked(x, y)), "Pubkey does not match");
        assertEq(keccak256(resContactCode), keccak256(contactCode), "Contact code does not match");
    }

    function testRegisterUsernameWithAccountAndPubKeyApproveAndCall() public {
        address registrant = testUser;
        address account = makeAddr("account");
        string memory username = "bob2";

        bytes memory contactCode =
        // solhint-disable-next-line max-line-length
            hex"04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82";
        (bytes32 x, bytes32 y) = generateXY(contactCode);

        (bytes32 label, bytes32 usernameHash) =
            registerName(usernameRegistrar, registrant, username, account, x, y, true);
        // Assert results
        assertEq(ensRegistry.owner(usernameHash), registrant, "ENSRegistry owner mismatch");
        assertEq(ensRegistry.resolver(usernameHash), address(config.publicResolver), "Resolver wrongly defined");
        assertEq(usernameRegistrar.getAccountBalance(label), usernameRegistrar.price(), "Wrong account balance");
        assertEq(usernameRegistrar.getAccountOwner(label), registrant, "Account owner mismatch");
        assertEq(config.publicResolver.addr(usernameHash), account, "Resolved address not set");

        (bytes32 resX, bytes32 resY) = config.publicResolver.pubkey(usernameHash);
        bytes memory resContactCode = keyFromXY(resX, resY);
        assertEq(keccak256(abi.encodePacked(resX, resY)), keccak256(abi.encodePacked(x, y)), "Pubkey does not match");
        assertEq(keccak256(resContactCode), keccak256(contactCode), "Contact code does not match");
    }

    function testSlashInvalidUsername() public {
        address registrant = testUser;
        string memory username = "alic\u00e9";
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        uint256 reserveSecret = 1337;
        address slasher = makeAddr("slasher");

        vm.prank(slasher);
        vm.expectRevert();
        usernameRegistrar.slashInvalidUsername(username, 4, reserveSecret);

        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() / 2);

        bytes32 secret = keccak256(abi.encodePacked(namehash, usernameRegistrar.getCreationTime(label), reserveSecret));

        vm.prank(slasher);
        vm.expectRevert("Not reserved.");
        usernameRegistrar.slashInvalidUsername(username, 4, reserveSecret);

        vm.prank(slasher);
        usernameRegistrar.reserveSlash(secret);

        vm.prank(slasher);
        vm.expectRevert("Cannot reveal in same block");
        usernameRegistrar.slashInvalidUsername(username, 4, reserveSecret);

        vm.roll(block.number + 1);

        vm.prank(slasher);
        vm.expectRevert("Not invalid character.");
        usernameRegistrar.slashInvalidUsername(username, 2, reserveSecret);

        vm.prank(slasher);
        vm.expectRevert("Invalid position.");
        usernameRegistrar.slashInvalidUsername(username, 12, reserveSecret);

        vm.prank(slasher);
        usernameRegistrar.slashInvalidUsername(username, 4, reserveSecret);

        assertEq(usernameRegistrar.getAccountBalance(label), 0, "Account balance should be zero after slashing");
        assertEq(ensRegistry.owner(namehash), address(0), "Username should be slashed and ownership set to zero");
    }

    function testShouldNotSlashValidUsername() public {
        address registrant = testUser;
        string memory username = "legituser";
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);
        vm.warp(block.timestamp + usernameRegistrar.releaseDelay() / 2);

        uint256 reserveSecret = 1337;
        address slasher = makeAddr("slasher");
        bytes32 secret = keccak256(abi.encodePacked(namehash, usernameRegistrar.getCreationTime(label), reserveSecret));

        vm.startPrank(slasher);
        usernameRegistrar.reserveSlash(secret);
        vm.roll(block.number + 1);

        vm.expectRevert("Not invalid character.");
        usernameRegistrar.slashInvalidUsername(username, 4, reserveSecret);
        vm.stopPrank();
    }

    function testShouldNotSlashUsernameThatStartsWith0xButIsSmallerThan12() public {
        string memory username = "0xc6b95bd26";

        address registrant = testUser;
        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        uint256 reserveSecret = 1337;
        address slasher = makeAddr("slasher");
        bytes32 secret = keccak256(abi.encodePacked(namehash, usernameRegistrar.getCreationTime(label), reserveSecret));

        vm.startPrank(slasher);
        usernameRegistrar.reserveSlash(secret);
        vm.roll(block.number + 1);

        vm.expectRevert("Too small to look like an address.");

        usernameRegistrar.slashAddressLikeUsername(username, reserveSecret);
        vm.stopPrank();
    }

    function testShouldNotSlashUsernameThatDoesNotStartWith0xAndIsBiggerThan12() public {
        string memory username = "0a002322c6b95bd26";

        address registrant = testUser;

        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        uint256 reserveSecret = 1337;
        address slasher = makeAddr("slasher");
        bytes32 secret = keccak256(abi.encodePacked(namehash, usernameRegistrar.getCreationTime(label), reserveSecret));

        vm.startPrank(slasher);
        usernameRegistrar.reserveSlash(secret);
        vm.roll(block.number + 1);

        vm.expectRevert("Second character need to be x");
        usernameRegistrar.slashAddressLikeUsername(username, reserveSecret);
        vm.stopPrank();
    }

    function testShouldNotSlashUsernameThatDoesNotStartWith0AndIsBiggerThan12() public {
        string memory username = "Ox002322c6b95bd26";

        address registrant = testUser;

        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        uint256 reserveSecret = 1337;
        address slasher = makeAddr("slasher");
        bytes32 secret = keccak256(abi.encodePacked(namehash, usernameRegistrar.getCreationTime(label), reserveSecret));

        vm.startPrank(slasher);
        usernameRegistrar.reserveSlash(secret);
        vm.roll(block.number + 1);

        vm.expectRevert("First character need to be 0");
        usernameRegistrar.slashAddressLikeUsername(username, reserveSecret);
        vm.stopPrank();
    }

    function testShouldNotSlashUsernameThatStartsWith0xButDoesNotUseHexChars() public {
        string memory username = "0xprotocolstatus";
        address registrant = testUser;

        (bytes32 label, bytes32 namehash) = registerName(usernameRegistrar, registrant, username);

        uint256 reserveSecret = 1337;
        address slasher = makeAddr("slasher");
        bytes32 secret = keccak256(abi.encodePacked(namehash, usernameRegistrar.getCreationTime(label), reserveSecret));

        vm.startPrank(slasher);
        usernameRegistrar.reserveSlash(secret);
        vm.roll(block.number + 1);

        vm.expectRevert("Does not look like an address");
        usernameRegistrar.slashAddressLikeUsername(username, reserveSecret);
        vm.stopPrank();
    }
}
