const {
    BN,         
    constants,    
    expectEvent,  
    expectRevert, 
  } = require('@openzeppelin/test-helpers');
const ENSRegistry = artifacts.require('ENSRegistry');
const web3Utils = require('web3-utils');
const namehash = require('eth-ens-namehash');

config({
    contracts: {
        deploy: {"ENSRegistry": { }}
    }
});

contract('ENS', function () {
    this.timeout(0);
    let accountsArr;

    before(function(done) {
        web3.eth.getAccounts().then(function (res) {
            accountsArr = res;
            done();
        });
    });

    it('should allow ownership transfers', async () => {
        let result = await ENSRegistry.methods.setOwner(constants.ZERO_BYTES32, accountsArr[1]).send({from: accountsArr[0]});       
        expectEvent(result, "Transfer", {
            node: constants.ZERO_BYTES32,
            owner: accountsArr[1]
        })
        assert.equal(await ENSRegistry.methods.owner(constants.ZERO_BYTES32).call(), accountsArr[1])
    });

    it('should prohibit transfers by non-owners', async () => {
        await expectRevert(ENSRegistry.methods.setOwner(constants.ZERO_BYTES32, accountsArr[2]).send({from: accountsArr[0]}), 'ENS: Not Authorized');
    });

    it('should allow setting resolvers', async () => {
        let result = await ENSRegistry.methods.setResolver(constants.ZERO_BYTES32, accountsArr[3]).send({from: accountsArr[1]});        
        expectEvent(result, 'NewResolver', {
            node: constants.ZERO_BYTES32,
            resolver: accountsArr[3]
        })
        assert.equal(await ENSRegistry.methods.resolver(constants.ZERO_BYTES32).call(), accountsArr[3]);
    });

    it('should prevent setting resolvers by non-owners', async () => {
        await expectRevert(ENSRegistry.methods.setResolver(constants.ZERO_BYTES32, accountsArr[4]).send({from: accountsArr[0]}),'ENS: Not Authorized');
    });

    it('should allow setting the TTL', async () => {
        let result = await ENSRegistry.methods.setTTL(constants.ZERO_BYTES32, 3600).send({from: accountsArr[1]});
        expectEvent(result, 'NewTTL', {
            node: constants.ZERO_BYTES32,
            ttl: new BN(3600)
        })
        assert.equal(+await ENSRegistry.methods.ttl(constants.ZERO_BYTES32).call(), 3600);
    });

    it('should prevent setting the TTL by non-owners', async () => {
        await expectRevert(ENSRegistry.methods.setTTL(constants.ZERO_BYTES32, 1200).send({from: accountsArr[0]}),'ENS: Not Authorized');
    });

    it('should allow the creation of subnodes', async () => {
        let result = await ENSRegistry.methods.setSubnodeOwner(constants.ZERO_BYTES32, web3Utils.sha3('eth'), accountsArr[2]).send({from: accountsArr[1]});
        expectEvent(result, 'NewOwner', {
            node: constants.ZERO_BYTES32,
            label:  web3Utils.sha3('eth'),
            owner: accountsArr[2]
        })
        assert.equal(await ENSRegistry.methods.owner(namehash.hash('eth')).call(), accountsArr[2]);
    });

    it('should prohibit subnode creation by non-owners', async () => {
        await expectRevert(ENSRegistry.methods.setSubnodeOwner(constants.ZERO_BYTES32, web3Utils.sha3('eth'), accountsArr[3]).send({from: accountsArr[0]}),'ENS: Not Authorized');
    });
});
