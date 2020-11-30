

const utils = require('../utils/testUtils.js');
const {
  BN, 
  time,        
  constants,    
  expectEvent,  
  expectRevert, 
} = require('@openzeppelin/test-helpers');
const web3Utils = require('web3-utils');
const namehash = require('eth-ens-namehash');
const { MerkleTree } = require('../utils/merkleTree.js');
const { ReservedUsernames } = require('../config/ens-usernames/reservedNames')
const ControlledSpec = require('./abstract/controlled');
const ethregistrarDuration = time.duration.years(9999)
const eth = {
  name: 'eth',
  label: web3Utils.sha3('eth'),
  namehash: namehash.hash('eth')
}
const registry = {
  name: 'stateofus',
  registry:  'stateofus.eth',
  label: web3Utils.sha3('stateofus'),
  namehash: namehash.hash('stateofus.eth'),
  price: '1000'
}

const dummyRegistry = {
  name: 'dummyreg',
  registry:  'dummyreg.eth',
  label: web3Utils.sha3('dummyreg'),
  namehash: namehash.hash('dummyreg.eth'),
  price: '1000'
}


const dummy2Registry = {
  name: 'dummy2reg',
  registry:  'dummy2reg.eth',
  label: web3Utils.sha3('dummy2reg'),
  namehash: namehash.hash('dummy2reg.eth'),
  price: '1000'
}

// TODO: load file of reserved names and balance array lenght to be even

const merkleTree = new MerkleTree(ReservedUsernames);
const merkleRoot = merkleTree.getHexRoot();
let accountsArr;
config(
  {
    contracts: {        
      deploy: {    
        "TestToken": { },
        "ENSRegistry": {
        },
        "PublicResolver": {
          "args": [
            "$ENSRegistry"
          ]
        },
        "BaseRegistrarImplementation": {
          "args": [
            "$ENSRegistry", 
            eth.namehash
          ],
          "onDeploy": [
            "await ENSRegistry.methods.setSubnodeOwner('"+constants.ZERO_BYTES32+"','"+eth.label+"', BaseRegistrarImplementation.address).send()",
            "await BaseRegistrarImplementation.methods.addController(web3.eth.defaultAccount).send()",
            "await BaseRegistrarImplementation.methods.setResolver(PublicResolver.address).send()",
          ]
        },
        "SlashMechanism": {
          "args": [
            "3", 
            merkleRoot
          ],
        },
        "UsernameToken": {
          "args": [
            "$accounts[0]"
          ],
        },
        "UsernameRegistrar": {
          "args": [
            "$UsernameToken",
            "$TestToken",
            "$ENSRegistry",
            "$PublicResolver",
            registry.namehash,
            "$SlashMechanism",
            constants.ZERO_ADDRESS
          ],
          "onDeploy": [
            "await BaseRegistrarImplementation.methods.register('"+registry.label+"', web3.eth.defaultAccount,"+ethregistrarDuration+").send()",
            "await ENSRegistry.methods.setOwner('"+registry.namehash+"',UsernameRegistrar.address).send()",
            "await UsernameToken.methods.changeController(UsernameRegistrar.address).send()"
          ]
        },
        "UpdatedUsernameRegistrar": {
          "args": [
            "$UsernameToken",
            "$TestToken",
            "$ENSRegistry",
            "$PublicResolver",
            registry.namehash,
            "$SlashMechanism",
            "$UsernameRegistrar"
          ]
        },
        "DummyUsernameToken": {
          "args": [
            "$accounts[0]"
          ],
        },
        "DummyUsernameRegistrar": {
          "args": [
            "$DummyUsernameToken",
            "$TestToken",
            "$ENSRegistry",
            "$PublicResolver",
            dummyRegistry.namehash,
            "$SlashMechanism",
            constants.ZERO_ADDRESS
          ],
          "onDeploy": [
            "await BaseRegistrarImplementation.methods.register('"+dummyRegistry.label+"', web3.eth.defaultAccount,"+ethregistrarDuration+").send()",
            "await ENSRegistry.methods.setOwner('"+dummyRegistry.namehash+"', DummyUsernameRegistrar.address).send()",
            "await DummyUsernameToken.methods.changeController(DummyUsernameRegistrar.address).send()"
          ]
        },
        "UpdatedDummyUsernameRegistrar": {
          "args": [
            "$DummyUsernameToken",
            "$TestToken",
            "$ENSRegistry",
            "$PublicResolver",
            dummyRegistry.namehash,
            "$SlashMechanism",
            "$DummyUsernameRegistrar"
          ]
        },
        "Dummy2SlashMechanism": {
          "args": [
            "3", 
            constants.ZERO_BYTES32
          ],
        },
        "Dummy2UsernameToken": {
          "args": [
            "$accounts[0]"
          ],
        },
        "Dummy2UsernameRegistrar": {
          "args": [
            "$Dummy2UsernameToken",
            "$TestToken",
            "$ENSRegistry",
            "$PublicResolver",
            dummy2Registry.namehash,
            "$Dummy2SlashMechanism",
            constants.ZERO_ADDRESS
          ],
          "onDeploy": [
            "await BaseRegistrarImplementation.methods.register('"+dummy2Registry.label+"', web3.eth.defaultAccount,"+ethregistrarDuration+").send()",
            "await ENSRegistry.methods.setOwner('"+dummy2Registry.namehash+"',Dummy2UsernameRegistrar.address).send()",
            "await Dummy2UsernameToken.methods.changeController(Dummy2UsernameRegistrar.address).send()",
            "await Dummy2UsernameRegistrar.methods.activate("+dummy2Registry.price+").send()"
          ]
        },
        "UpdatedDummy2UsernameRegistrar": {
          "args": [
            "$Dummy2UsernameToken",
            "$TestToken",
            "$ENSRegistry",
            "$PublicResolver",
            dummy2Registry.namehash,
            "$SlashMechanism",
            "$Dummy2UsernameRegistrar"
          ]
        }
      }
    }
  }, (_err, web3_accounts) => {
    accountsArr = web3_accounts
  }
);

const TestToken = artifacts.require('TestToken');
const UsernameToken = artifacts.require('UsernameToken');
const DummyUsernameToken = artifacts.require('DummyUsernameToken');
const Dummy2UsernameToken = artifacts.require('Dummy2UsernameToken');
const ENSRegistry = artifacts.require('ENSRegistry');
const PublicResolver = artifacts.require('PublicResolver');
const UsernameRegistrar = artifacts.require('UsernameRegistrar');
const UpdatedUsernameRegistrar = artifacts.require('UpdatedUsernameRegistrar');
const DummyUsernameRegistrar = artifacts.require('DummyUsernameRegistrar');
const UpdatedDummyUsernameRegistrar = artifacts.require('UpdatedDummyUsernameRegistrar');
const Dummy2UsernameRegistrar = artifacts.require('Dummy2UsernameRegistrar');
const UpdatedDummy2UsernameRegistrar = artifacts.require('UpdatedDummy2UsernameRegistrar');
const SlashMechanism = artifacts.require('SlashMechanism');
const Dummy2SlashMechanism = artifacts.require('Dummy2SlashMechanism');
const BaseRegistrarImplementation = artifacts.require('BaseRegistrarImplementation');

contract('UsernameRegistrar', function () {
  
  ControlledSpec.Test(UsernameRegistrar);

  describe('activate(uint256)', function() {
    it('should activate registry', async () => {
      const initialPrice = '100'
      const resultSetRegistryPrice = await UsernameRegistrar.methods.activate(initialPrice).send({from: accountsArr[0]});
      expectEvent(resultSetRegistryPrice, 'RegistryPrice', {
        price: initialPrice
      })
      assert.equal(await UsernameRegistrar.methods.getState().call(), '1', "Wrong registry state")
      assert.equal(await UsernameRegistrar.methods.price().call(), initialPrice, "Wrong registry price")
    });
  });

  describe('updateRegistryPrice(uint256)', function() {
    it('should change registry price', async () => {
      const newPrice = registry.price;
      const resultUpdateRegistryPrice = await UsernameRegistrar.methods.updateRegistryPrice(newPrice).send({from: accountsArr[0]});
      expectEvent(resultUpdateRegistryPrice, 'RegistryPrice', {
        price: newPrice
      })
      assert.equal(await UsernameRegistrar.methods.getState().call(), '1', "Wrong registry state")
      assert.equal(await UsernameRegistrar.methods.price().call(), newPrice, "Wrong registry price")
    });
  });

  describe('register(bytes32,address,bytes32,bytes32)', function() {
    it('should register username', async () => {
      const registrant = accountsArr[5];
      const username = 'erin';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const label = web3Utils.sha3(username);
      const registryPrice = await UsernameRegistrar.methods.getPrice().call()
      await TestToken.methods.mint(registry.price).send({from: registrant});
      const initialRegistrantBalance = +await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = +await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const resultRegister = await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      /*expectEvent.inTransaction(resultRegister.transactionHash, TestToken, 'Transfer', {
        from: registrant,
        to: UsernameRegistrar.address,
        value: registry.price
      }) // Waiting bugfix on https://github.com/OpenZeppelin/openzeppelin-test-helpers/issues/132 */
      assert.equal(resultRegister.events['0'].address, TestToken.address, "Wrong Event emitter");
      assert.equal(resultRegister.events['0'].raw.topics[0], web3Utils.sha3("Transfer(address,address,uint256)"), "Wrong Event signature");
      assert.equal(utils.eventAddress(resultRegister.events['0'].raw.topics[1]), registrant, "Wrong Transfer from");
      assert.equal(utils.eventAddress(resultRegister.events['0'].raw.topics[2]), UsernameRegistrar.address, "Wrong transfer to");
      assert.equal(new BN(resultRegister.events['0'].raw.data.substr(2),16).toString(), registry.price, "Wrong transfer value");
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'NewOwner', {
        node: registry.namehash,
        label: label,
        owner: registrant
      })
      expectEvent.inTransaction(resultRegister.transactionHash, UsernameToken, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: registrant,
        tokenId: new BN(label.substr(2),16).toString()
      })
      expectEvent(resultRegister, 'UsernameOwner', {
        owner: registrant,
        nameHash: usernameHash
      })
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), constants.ZERO_ADDRESS, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registryPrice, "Registry username account balance wrong");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(+await TestToken.methods.balanceOf(registrant).call(), +initialRegistrantBalance-registryPrice, "User final balance wrong")
      assert.equal(+await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)+(+registry.price), "Registry final balance wrong")
    });
    it('should register username only resolveing address  ', async () => {
      const registrant = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const username = 'bob';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const label = web3Utils.sha3(username);
      const resultRegister = await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        registrant,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      /*expectEvent.inTransaction(resultRegister.transactionHash, TestToken, 'Transfer', {
        from: registrant,
        to: UsernameRegistrar.address,
        value: registry.price
      }) // Waiting bugfix on https://github.com/OpenZeppelin/openzeppelin-test-helpers/issues/132 */
      assert.equal(resultRegister.events['0'].address, TestToken.address, "Wrong Event emitter");
      assert.equal(resultRegister.events['0'].raw.topics[0], web3Utils.sha3("Transfer(address,address,uint256)"), "Wrong Event signature");
      assert.equal(utils.eventAddress(resultRegister.events['0'].raw.topics[1]), registrant, "Wrong Transfer from");
      assert.equal(utils.eventAddress(resultRegister.events['0'].raw.topics[2]), UsernameRegistrar.address, "Wrong transfer to");
      assert.equal(new BN(resultRegister.events['0'].raw.data.substr(2),16).toString(), registry.price, "Wrong transfer value");
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'NewOwner', {
        node: registry.namehash,
        label: label,
        owner: UsernameRegistrar.address
      })
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'NewResolver', {
        node: usernameHash,
        resolver: PublicResolver.address
      })
      expectEvent.inTransaction(resultRegister.transactionHash, PublicResolver, 'AddrChanged', {
        node: usernameHash,
        a: registrant
      })
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'Transfer', {
        node: usernameHash,
        owner: registrant
      })
      expectEvent.inTransaction(resultRegister.transactionHash, UsernameToken, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: registrant,
        tokenId: new BN(label.substr(2),16).toString()
      })
      expectEvent(resultRegister, 'UsernameOwner', {
        owner: registrant,
        nameHash: usernameHash
      })
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      assert.equal(resolverPubKey[0], constants.ZERO_BYTES32 , "Unexpected resolved pubkey[0]");
      assert.equal(resolverPubKey[1], constants.ZERO_BYTES32 , "Unexpected resolved pubkey[1]");
    });
    it('should register username with only status contact', async () => {
      const username = 'carlos';
      const registrant = accountsArr[3];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(username);
      const resultRegister = await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        points.x,
        points.y
      ).send({from: registrant});
      /*expectEvent.inTransaction(resultRegister.transactionHash, TestToken, 'Transfer', {
        from: registrant,
        to: UsernameRegistrar.address,
        value: registry.price
      }) // Waiting bugfix on https://github.com/OpenZeppelin/openzeppelin-test-helpers/issues/132 */
      assert.equal(resultRegister.events['0'].address, TestToken.address, "Wrong Event emitter");
      assert.equal(resultRegister.events['0'].raw.topics[0], web3Utils.sha3("Transfer(address,address,uint256)"), "Wrong Event signature");
      assert.equal(utils.eventAddress(resultRegister.events['0'].raw.topics[1]), registrant, "Wrong Transfer from");
      assert.equal(utils.eventAddress(resultRegister.events['0'].raw.topics[2]), UsernameRegistrar.address, "Wrong transfer to");
      assert.equal(new BN(resultRegister.events['0'].raw.data.substr(2),16).toString(), registry.price, "Wrong transfer value");
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'NewOwner', {
        node: registry.namehash,
        label: label,
        owner: UsernameRegistrar.address
      })
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'NewResolver', {
        node: usernameHash,
        resolver: PublicResolver.address
      })
      expectEvent.inTransaction(resultRegister.transactionHash, PublicResolver, 'PubkeyChanged', {
        node: usernameHash,
        x: points.x,
        y: points.y
      })
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'Transfer', {
        node: usernameHash,
        owner: registrant
      })
      expectEvent.inTransaction(resultRegister.transactionHash, UsernameToken, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: registrant,
        tokenId: new BN(label.substr(2),16).toString()
      })
      expectEvent(resultRegister, 'UsernameOwner', {
        owner: registrant,
        nameHash: usernameHash
      })
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), constants.ZERO_ADDRESS, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
    it('should register username with status contact code and address', async () => {
      const registrant = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const username = 'bob2';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(username);
      const resultRegister = await UsernameRegistrar.methods.register(
        label,
        registrant,
        points.x,
        points.y
      ).send({from: registrant}); 
      /*expectEvent.inTransaction(resultRegister.transactionHash, TestToken, 'Transfer', {
        from: registrant,
        to: UsernameRegistrar.address,
        value: registry.price
      }) // Waiting bugfix on https://github.com/OpenZeppelin/openzeppelin-test-helpers/issues/132 */
      assert.equal(resultRegister.events['0'].address, TestToken.address, "Wrong Event emitter");
      assert.equal(resultRegister.events['0'].raw.topics[0], web3Utils.sha3("Transfer(address,address,uint256)"), "Wrong Event signature");
      assert.equal(utils.eventAddress(resultRegister.events['0'].raw.topics[1]), registrant, "Wrong Transfer from");
      assert.equal(utils.eventAddress(resultRegister.events['0'].raw.topics[2]), UsernameRegistrar.address, "Wrong transfer to");
      assert.equal(new BN(resultRegister.events['0'].raw.data.substr(2),16).toString(), registry.price, "Wrong transfer value");
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'NewOwner', {
        node: registry.namehash,
        label: label,
        owner: UsernameRegistrar.address
      })
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'NewResolver', {
        node: usernameHash,
        resolver: PublicResolver.address
      })
      expectEvent.inTransaction(resultRegister.transactionHash, PublicResolver, 'AddrChanged', {
        node: usernameHash,
        a: registrant
      })
      expectEvent.inTransaction(resultRegister.transactionHash, PublicResolver, 'PubkeyChanged', {
        node: usernameHash,
        x: points.x,
        y: points.y
      })
      expectEvent.inTransaction(resultRegister.transactionHash, ENSRegistry, 'Transfer', {
        node: usernameHash,
        owner: registrant
      })
      expectEvent.inTransaction(resultRegister.transactionHash, UsernameToken, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: registrant,
        tokenId: new BN(label.substr(2),16).toString()
      })
      expectEvent(resultRegister, 'UsernameOwner', {
        owner: registrant,
        nameHash: usernameHash
      })  
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
  });

  describe('receiveApproval(address,uint256,address,bytes)', function() {
    it('should register username', async () => {
      const registrant = accountsArr[5];
      const username = 'erinauto';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const label = web3Utils.sha3(username);
      const registryPrice = await UsernameRegistrar.methods.getPrice().call()
      await TestToken.methods.mint(registry.price).send({from: registrant});
      const initialRegistrantBalance = +await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = +await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      
      const registerCall = UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).encodeABI();
      const approveAndCallResult = await TestToken.methods.approveAndCall(UsernameRegistrar.address, registry.price, registerCall).send({from: registrant});  
      // TODO: check events
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), constants.ZERO_ADDRESS, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registryPrice, "Registry username account balance wrong");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(+await TestToken.methods.balanceOf(registrant).call(), +initialRegistrantBalance-registryPrice, "User final balance wrong")
      assert.equal(+await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)+(+registry.price), "Registry final balance wrong")
    });
    it('should register username only resolving address  ', async () => {
      const registrant = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      const username = 'bobauto';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const label = web3Utils.sha3(username);
      const registerCall = UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        registrant,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).encodeABI();

      const approveAndCallResult = await TestToken.methods.approveAndCall(UsernameRegistrar.address, registry.price, registerCall).send({from: registrant});  
      // TODO: check events

      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      assert.equal(resolverPubKey[0], constants.ZERO_BYTES32 , "Unexpected resolved pubkey[0]");
      assert.equal(resolverPubKey[1], constants.ZERO_BYTES32 , "Unexpected resolved pubkey[1]");
    });

    it('should register username with only status contact', async () => {
      const username = 'carlosauto';
      const registrant = accountsArr[3];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(username);
      const registerCall = UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        points.x,
        points.y
      ).encodeABI();

      const approveAndCallResult = await TestToken.methods.approveAndCall(UsernameRegistrar.address, registry.price, registerCall).send({from: registrant});  
      // TODO: check events
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), constants.ZERO_ADDRESS, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
    it('should register username with status contact code and address', async () => {
      const registrant = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      const username = 'bob2auto';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(username);
      const registerCall = UsernameRegistrar.methods.register(
        label,
        registrant,
        points.x,
        points.y
      ).encodeABI();

      const approveAndCallResult = await TestToken.methods.approveAndCall(UsernameRegistrar.address, registry.price, registerCall).send({from: registrant});  
      // TODO: check events
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
  });

  describe('release(bytes32)', function() {
    it('should not release username due delay', async () => {
      let registrant = accountsArr[6];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      let username = 'mistaker';
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await expectRevert(
        UsernameRegistrar.methods.release(web3Utils.sha3(username)).send({from: registrant}),
        "Release period not reached."
      );
    });
    it('should release username', async () => {;
      const registrant = accountsArr[6];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      const username = 'frank';
      const label = web3Utils.sha3(username);
      await UsernameRegistrar.methods.register(
        label,
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      const expirationTime = +await UsernameRegistrar.methods.getExpirationTime(label).call();
      await time.increaseTo(expirationTime+1)
      const initialAccountBalance = await UsernameRegistrar.methods.getAccountBalance(label).call();
      const initialRegistrantBalance = +await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = +await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      const resultRelease = await UsernameRegistrar.methods.release(
        web3Utils.sha3(username),
        
      ).send({from: registrant});
      //TODO: check events
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), '0', "Final balance didnt zeroed");
      assert.equal(+await TestToken.methods.balanceOf(registrant).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "Releaser token balance didnt increase")
      assert.equal(+await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
    });
    it('should release transfered username', async () => {
      let registrant = accountsArr[7];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
      let username = 'grace';
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      let label = web3Utils.sha3(username);
      let newOwner = accountsArr[8];
      await UsernameRegistrar.methods.register(
        label,
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await UsernameToken.methods.transferFrom(registrant, newOwner, label).send({from: registrant});
      let expirationTime = await UsernameRegistrar.methods.getExpirationTime(label).call();
      await time.increaseTo(expirationTime+1)
      let initialAccountBalance = await UsernameRegistrar.methods.getAccountBalance(label).call();
      let initialRegistrantBalance = +await TestToken.methods.balanceOf(newOwner).call();
      let initialRegistryBalance = +await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      let resultRelease = await UsernameRegistrar.methods.release(
        label
      ).send({from: newOwner});
      //TODO: check events
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), '0', "Final balance didnt zeroed");
      assert.equal(+await TestToken.methods.balanceOf(newOwner).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "New owner token balance didnt increase")
      assert.equal(+await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
    });
    it('should release moved username account balance by owner', async () => {
      let tst = 0;
      const registrant = accountsArr[5];
      await TestToken.methods.mint(dummyRegistry.price).send({from: registrant});
      await DummyUsernameRegistrar.methods.activate(dummyRegistry.price).send({from: accountsArr[0]});
      await TestToken.methods.approve(DummyUsernameRegistrar.address, dummyRegistry.price).send({from: registrant});  

      const username = 'hardhead';
      const label = web3Utils.sha3(username);
      const usernameHash = namehash.hash(username + '.' + dummyRegistry.registry);
      await DummyUsernameRegistrar.methods.register(
        label,
        registrant,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      let initialAccountBalance = +await DummyUsernameRegistrar.methods.getAccountBalance(label).call();
      const initialRegistrantBalance = +await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = +await TestToken.methods.balanceOf(DummyUsernameRegistrar.address).call();
      await BaseRegistrarImplementation.methods.reclaim(dummyRegistry.label, UpdatedDummyUsernameRegistrar.address).send();
      await DummyUsernameRegistrar.methods.moveRegistry(UpdatedDummyUsernameRegistrar.address).send();

      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");
      const resultRelease = await DummyUsernameRegistrar.methods.release(
        label
      ).send({from: registrant});
      //TODO: verify events
      assert.equal(+await TestToken.methods.balanceOf(registrant).call(), (+initialRegistrantBalance)+(+initialAccountBalance), "New owner token balance didnt increase")
      assert.equal(+await TestToken.methods.balanceOf(DummyUsernameRegistrar.address).call(), (+initialRegistryBalance)-(+initialAccountBalance), "Registry token balance didnt decrease")
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), constants.ZERO_ADDRESS, "Resolver not undefined");
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), constants.ZERO_ADDRESS, "Owner not removed");
      //We are not cleaning PublicResolver or any resolver, so the value should remain the same.
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
    });
  });
  
  describe('reclaim(bytes32)', function() {
    it('should reclaim username', async () => {
      let username = 'heidi';
      let label = web3Utils.sha3(username);
      let registrant = accountsArr[8];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      let newOwner = accountsArr[9];
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      
      await UsernameRegistrar.methods.register(
        label,
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await UsernameToken.methods.transferFrom(registrant, newOwner, label).send({from: registrant});
      let resultUpdateOwner = await UsernameRegistrar.methods.reclaim(
        label,
        newOwner
      ).send({from: newOwner});
      //TODO: check events
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), newOwner, "Backup owner not updated");
    });
  });
  
  describe('slashInvalidUsername(string,uint256,uint256)', function() {
    it('should slash invalid username', async () => {
      let username = 'alicé';
      let label = web3Utils.sha3(username);
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),

        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      time.duration.s
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      assert.notEqual(+await UsernameRegistrar.methods.getCreationTime(label).call(), 0);
      await SlashMechanism.methods.slashInvalidUsername(username, 4, UsernameRegistrar.address).send()
      //TODO: check events
      assert.equal(+await UsernameRegistrar.methods.getCreationTime(label).call(), 0);
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), constants.ZERO_ADDRESS);
    });
    it('should not slash valid username', async () => {
      const username = 'legituser';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant}); 
      await time.increase(time.duration.seconds(20))   
      await expectRevert(
        SlashMechanism.methods.slashInvalidUsername(username, 4, UsernameRegistrar.address).send(),
        "Not invalid character."
      );
    });
  });

  describe('slashReservedUsername(string,bytes32[],uint256)', function() {
    it('should not slash not reserved name username', async () => {
      const username = 'somedummyname123';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      await expectRevert(
        SlashMechanism.methods.slashReservedUsername(username, merkleTree.getHexProof(ReservedUsernames[0]), UsernameRegistrar.address).send(),
        "Invalid Proof."
      );
    });
    it('should not slash reserved name username with wrong proof ', async () => {
      const username = ReservedUsernames[5];
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      await expectRevert(
        SlashMechanism.methods.slashReservedUsername(username, merkleTree.getHexProof(ReservedUsernames[1]), UsernameRegistrar.address).send(),
        "Invalid Proof."
      );
    });
    it('should slash reserved name username', async () => {
      const username = ReservedUsernames[7];
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      await SlashMechanism.methods.slashReservedUsername(username, merkleTree.getHexProof(username), UsernameRegistrar.address).send()  
      //TODO: check events
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), constants.ZERO_ADDRESS);
    });
  });

  describe('slashSmallUsername(string,uint256)', function() {
    it('should not slash big username', async() =>{
      let username = '1234567890';
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      //await time.increase(1000)
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      await expectRevert(
        SlashMechanism.methods.slashSmallUsername(username, UsernameRegistrar.address).send(),
        "Not a small username."
      );
    })
    it('should slash small username', async () => {
      let username = 'a';
      let usernameHash = namehash.hash(username + '.' + registry.registry);
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});  
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      result = await SlashMechanism.methods.slashSmallUsername(username, UsernameRegistrar.address).send()    
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), constants.ZERO_ADDRESS);
    });
  });
  
  describe('slashAddressLikeUsername(string,uint256)', function() {
    it('should slash username that starts with 0x and is 12 of lenght or bigger', async () => {
      let username = '0xc6b95bd26123';
      const userlabelHash = web3Utils.soliditySha3({value: username, type: "string"});
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        userlabelHash,
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      result = await SlashMechanism.methods.slashAddressLikeUsername(username, UsernameRegistrar.address).send()    
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), constants.ZERO_ADDRESS);
    });
    it('should not slash username that starts with 0x but is smaller then 12', async () => {
      let username = "0xc6b95bd26";
      const userlabelHash = web3Utils.soliditySha3({value: username, type: "string"});
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      let registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        userlabelHash,
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      await expectRevert(
        SlashMechanism.methods.slashAddressLikeUsername(username, UsernameRegistrar.address).send(),
        "Too small to look like an address."
      );
    });
    it('should not slash username that dont starts 0x and is bigger than 12', async () => {
      const username = "0a002322c6b95bd26";
      const userlabelHash = web3Utils.soliditySha3({value: username, type: "string"});
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        userlabelHash,
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      await expectRevert(
        SlashMechanism.methods.slashAddressLikeUsername(username, UsernameRegistrar.address).send(),
        "Second character need to be x"
      );     
    });
    it('should not slash username that starts with 0x but dont use hex chars', async () => {
      const username = "0xprotocolstatus";
      const userlabelHash = web3Utils.soliditySha3({value: username, type: "string"});
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        userlabelHash,
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      await expectRevert(
        SlashMechanism.methods.slashAddressLikeUsername(username, UsernameRegistrar.address).send(),
        "Does not look like an address"
      );
    });
  });
  describe('slashUsername(bytes,uint256)', function() {
    it('should slash a username and get funds from registrant', async () => {
      const username = 'b';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      const slasher = accountsArr[2];
      const label = web3Utils.sha3(username);
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        label,
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      const partReward = await UsernameRegistrar.methods.getSlashRewardPart(label).call();
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      const initialSlasherBalance = +await TestToken.methods.balanceOf(slasher).call();
      await SlashMechanism.methods.slashSmallUsername(username, UsernameRegistrar.address).send({from: slasher})
      //TODO: check events
      assert.equal(+await TestToken.methods.balanceOf(slasher).call(), (+initialSlasherBalance)+((+partReward)*2));    
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), constants.ZERO_ADDRESS);
    });
    
    it('should return funds of slashing when changed rules', async () => {
      const registrant = accountsArr[5];
      const notRegistrant = accountsArr[6];

      await TestToken.methods.mint(dummy2Registry.price).send({from: registrant});
      await TestToken.methods.approve(Dummy2UsernameRegistrar.address, dummy2Registry.price).send({from: registrant});  

      const username = ReservedUsernames[10];
      const label = web3Utils.sha3(username);
      const usernameHash = namehash.hash(username + '.' + dummy2Registry.registry);
      await Dummy2UsernameRegistrar.methods.register(
        label,
        registrant,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      let initialAccountBalance = await Dummy2UsernameRegistrar.methods.getAccountBalance(label).call();
      const initialRegistrantBalance = +await TestToken.methods.balanceOf(registrant).call();
      const initialRegistryBalance = +await TestToken.methods.balanceOf(Dummy2UsernameRegistrar.address).call();

      
      await Dummy2UsernameRegistrar.methods.setSlashMechanism(SlashMechanism.address).send();

      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.address, "Resolver wrongly defined");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
      await SlashMechanism.methods.slashReservedUsername(
        username, 
        merkleTree.getHexProof(username),
        Dummy2UsernameRegistrar.address
      ).send({from: notRegistrant });
      //TODO: verify events
      
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), constants.ZERO_ADDRESS, "Resolver not undefined");
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), constants.ZERO_ADDRESS, "Owner not removed");
      //We are not cleaning PublicResolver or any resolver, so the value should remain the same.
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
    });
  });

  describe('reserveSlash(bytes32)', function() {
    it('should send 2/3 funds to reserver', async() =>{
      const username = 'c';
      const label = web3Utils.sha3(username);
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const registrant = accountsArr[1];
      const slashReserverCaller = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});
      await UsernameRegistrar.methods.register(
        web3Utils.sha3(username),
        constants.ZERO_ADDRESS,
        constants.ZERO_BYTES32,
        constants.ZERO_BYTES32
      ).send({from: registrant});
      await time.increase(time.duration.seconds(20))
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);
      const partReward = await UsernameRegistrar.methods.getSlashRewardPart(label).call();
      const initialSlashReserverBalance = +await TestToken.methods.balanceOf(slashReserverCaller).call();
      await SlashMechanism.methods.slashSmallUsername(username, UsernameRegistrar.address).send({from: slashReserverCaller})
      //TODO: check events
      assert.equal(+await TestToken.methods.balanceOf(slashReserverCaller).call(), (+initialSlashReserverBalance)+(+partReward*2));    
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), constants.ZERO_ADDRESS);
    });
  });
  
describe('eraseNode(bytes32[])', function() {
  it('should clear unowned subdomains of users', async () => {;
    const registrant = accountsArr[6];
    const anyone = accountsArr[5];
    await TestToken.methods.mint(registry.price).send({from: registrant});
    await TestToken.methods.approve(UsernameRegistrar.address, registry.price).send({from: registrant});  
    const username = "root";
    const usernameHash = namehash.hash(username + '.' + registry.registry);
    const label = web3Utils.sha3(username);
    const labels = [
      web3Utils.sha3("10"),
      web3Utils.sha3("9"),
      web3Utils.sha3("8"),
      web3Utils.sha3("7"),
      web3Utils.sha3("6"),
      web3Utils.sha3("5"),
      web3Utils.sha3("4"),
      web3Utils.sha3("3"),
      web3Utils.sha3("2"),
      web3Utils.sha3("1"),
      web3Utils.sha3("0"),
      web3Utils.sha3(username),
    ];
    await UsernameRegistrar.methods.register(
      label,
      constants.ZERO_ADDRESS,
      constants.ZERO_BYTES32,
      constants.ZERO_BYTES32
    ).send({from: registrant});
    assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant);    
    const expirationTime = await UsernameRegistrar.methods.getExpirationTime(label).call();
    await time.increaseTo(expirationTime+1)
    //await time.increase(1000)
    //await time.increase(1000)
    let subnode = usernameHash;
    for (let index = labels.length - 1; index > 0; index--) {
      const label = labels[index - 1];
      await ENSRegistry.methods.setSubnodeOwner(subnode, label, registrant).send({from: registrant}); 
      subnode = web3Utils.soliditySha3(subnode, label);
      assert.equal(await ENSRegistry.methods.owner(subnode).call(), registrant);   
      
    }
   
    const resultRelease = await UsernameRegistrar.methods.release(web3Utils.sha3(username)).send({from: registrant});
    
    subnode = usernameHash;
    for (let index = labels.length - 1; index > 0; index--) {
      const label = labels[index - 1];
      subnode = web3Utils.soliditySha3(subnode, label);
      assert.equal(await ENSRegistry.methods.owner(subnode).call(), registrant);   
    }

    const resultErase = await UsernameRegistrar.methods.eraseNode(
      labels
    ).send({from: anyone});
    //TODO: check events
    
    subnode = usernameHash;
    for (let index = labels.length - 1; index > 0; index--) {
      const label = labels[index - 1];
      subnode = web3Utils.soliditySha3(subnode, label);
      assert.equal(await ENSRegistry.methods.owner(subnode).call(), constants.ZERO_ADDRESS);   
    }
  });


});

describe('moveRegistry(address)', function() {
    it('should move registry to new registry and migrate', async () => {
      await BaseRegistrarImplementation.methods.reclaim(registry.label, UpdatedUsernameRegistrar.address).send();
      const result = await UsernameRegistrar.methods.moveRegistry(UpdatedUsernameRegistrar.address).send();
      //TODO: check events
      assert.equal(await ENSRegistry.methods.owner(registry.namehash).call(), UpdatedUsernameRegistrar.address, "registry ownership not moved correctly")
      assert.equal(await UpdatedUsernameRegistrar.methods.getPrice().call(), registry.price, "updated registry didnt migrated price")
    });
  });

  describe('moveAccount(label,address)', function() {

    it('should move username to new registry by account owner when registry moved internally', async () => {
      const registrant = accountsArr[5];
      const username = 'erin';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const label = web3Utils.sha3(username);
      
      const accountBalance = await UsernameRegistrar.methods.getAccountBalance(label).call()
      assert.notEqual(accountBalance, 0);
      const initialRegistryBalance = +await TestToken.methods.balanceOf(UsernameRegistrar.address).call();
      const initialUpdatedRegistryBalance = +await TestToken.methods.balanceOf(UpdatedUsernameRegistrar.address).call();
      const creationTime = +await UsernameRegistrar.methods.getCreationTime(label).call();
      assert.notEqual(creationTime, 0);
      const result = await UsernameRegistrar.methods.moveAccount(label, UpdatedUsernameRegistrar.address).send({from: registrant});
      assert.equal(+await TestToken.methods.balanceOf(UsernameRegistrar.address).call(), (+initialRegistryBalance)-(+accountBalance))
      assert.equal(+await TestToken.methods.balanceOf(UpdatedUsernameRegistrar.address).call(), (+initialUpdatedRegistryBalance)+(+accountBalance))
    });
  });

});
