

const utils = require('../utils/testUtils.js');
const web3Utils = require('web3-utils');
const namehash = require('eth-ens-namehash');
const { MerkleTree } = require('../utils/merkleTree.js');
const { ReservedUsernames } = require('../config/ens-usernames/reservedNames')

const registry = {
  name: 'stateofus',
  registry:  'stateofus.eth',
  label: web3Utils.sha3('stateofus'),
  namehash: namehash.hash('stateofus.eth'),
  price: 100000000
}

const merkleTree = new MerkleTree(ReservedUsernames);
const merkleRoot = merkleTree.getHexRoot();
let accountsArr;
config(
  {
    contracts: {        
      "TestToken": { },
      "ENSRegistry": {
        "onDeploy": [
          "await ENSRegistry.methods.setSubnodeOwner('0x0000000000000000000000000000000000000000000000000000000000000000', '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0', web3.eth.defaultAccount).send()"
        ]
      },
      "PublicResolver": {
        "args": [
          "$ENSRegistry"
        ]
      },
      "UsernameRegistrar": {
        "args": [
          "$TestToken",
          "$ENSRegistry",
          "$PublicResolver",
          registry.namehash,
          "3", 
          merkleRoot,
          "0x0"
        ],
        "onDeploy": [
            "await ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '"+registry.label+"', UsernameRegistrar.options.address).send()",
            "await UsernameRegistrar.methods.activate('"+registry.price+"').send()",
        ]
      },
      "RegistrarMigration": {
        "args": [
          "$ENSRegistry",
          registry.namehash,
          "$UsernameRegistrar"
        ]
      },
    }
  }, (_err, web3_accounts) => {
    accountsArr = web3_accounts
  }
);

const TestToken = require('Embark/contracts/TestToken');
const ENSRegistry = require('Embark/contracts/ENSRegistry');
const PublicResolver = require('Embark/contracts/PublicResolver');
const UsernameRegistrar = require('Embark/contracts/UsernameRegistrar');
const RegistrarMigration = require('Embark/contracts/RegistrarMigration');

contract('RegistrarMigration', function () {

  describe('UsernameRegistrar::register(bytes32,address,bytes32,bytes32)', function() {
    it('should register username with status contact code and address', async () => {
      const registrant = accountsArr[2];
      await TestToken.methods.mint(registry.price).send({from: registrant});
      await TestToken.methods.approve(UsernameRegistrar.options.address, registry.price).send({from: registrant});  
      const username = 'bob2';
      const usernameHash = namehash.hash(username + '.' + registry.registry);
      const contactCode = '0x04dbb31252d9bddb4e4d362c7b9c80cba74732280737af97971f42ccbdc716f3f3efb1db366880e52d09b1bfd59842e833f3004088892b7d14b9ce9e957cea9a82';
      const points = utils.generateXY(contactCode);
      const label = web3Utils.sha3(username);
      await UsernameRegistrar.methods.register(
        label,
        registrant,
        points.x,
        points.y
      ).send({from: registrant});    
      assert.equal(await ENSRegistry.methods.owner(usernameHash).call(), registrant, "ENSRegistry owner mismatch");
      assert.equal(await ENSRegistry.methods.resolver(usernameHash).call(), PublicResolver.options.address, "Resolver wrongly defined");
      assert.equal(await UsernameRegistrar.methods.getAccountBalance(label).call(), registry.price, "Wrong account balance");
      assert.equal(await UsernameRegistrar.methods.getAccountOwner(label).call(), registrant, "Account owner mismatch");
      assert.equal(await PublicResolver.methods.addr(usernameHash).call(), registrant, "Resolved address not set");      
      const resolverPubKey = await PublicResolver.methods.pubkey(usernameHash).call();
      const pubKey = utils.keyFromXY(resolverPubKey[0], resolverPubKey[1]);
      assert.equal(pubKey, contactCode, "pubKey does not match contract code");
    });
  });


  describe('UsernameRegistrar::moveRegistry(address)', function() {
    it('should move registry to controller of RegistrarMigration', async () => {
      assert.equal(await ENSRegistry.methods.owner(registry.namehash).call(), UsernameRegistrar.options.address, "registry ownership not owned by UsernameRegistrar")
      await UsernameRegistrar.methods.moveRegistry(RegistrarMigration.options.address).send();
      assert.equal(await ENSRegistry.methods.owner(registry.namehash).call(), accountsArr[0], "registry ownership not moved correctly")
    });
  });

});
