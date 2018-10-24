const { MerkleTree } = require('../utils/merkleTree.js');
const { ReservedUsernames } = require('./ens-usernames/reservedNames.js');

const merkleTree = new MerkleTree(ReservedUsernames);

module.exports = {
  "default": {
    "deployment": {
      "host": "localhost",
      "port": 8545,
      "type": "rpc"
    },
    "dappConnection": [
      "$WEB3",
      "http://localhost:8545"
    ],
    "gas": "auto",
    "contracts": {
      "TestToken": {},
      "MerkleProofWrapper": {
        "deploy": false
      },
      "ERC20Receiver": { 
        "deploy": false 
      },
      "ENSRegistry": {},
      "PublicResolver": {
        "args": ["$ENSRegistry"]
      },
      "UsernameRegistrar": {
        "args": [
          "$TestToken",
          "$ENSRegistry",
          "$PublicResolver",
          "0x5f7791d31ca0493e9ca7c9ca16695ecd9d5044768674d14d31ab5d8277518fff",
          3,
          merkleTree.getHexRoot(),
          "0x9e183BC54Bb4f3cCa1A478CA6f2c3EdC37B60478"
        ]
      }
    }
  },
  "development": {
    "contracts": {
      "TestToken": {
        "deploy": true
      },
      "ENSRegistry": {
        "deploy": true,
        "onDeploy": [
          "ENSRegistry.methods.setSubnodeOwner('0x0000000000000000000000000000000000000000000000000000000000000000', '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0', web3.eth.defaultAccount).send()"
        ]
      },
      "PublicResolver": {
        "deploy": true,
        "args": [
          "$ENSRegistry"
        ]
      },
      "UsernameRegistrar": {
        "onDeploy": [
          "ENSRegistry.methods.setSubnodeOwner('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae', '0xbd99f8d5e7f81d2d7c1da34b67a2bb3a94dd8c9b0ab40ddc077621b98405983b', UsernameRegistrar.address).send()"
        ]
      }
    }
  },
  "livenet":{
    "contracts": {
      "ENSRegistry": {
        "address": "0x314159265dd8dbb310642f98f50c066173c1259b"
      },
      "PublicResolver": {
        "address": "0x5FfC014343cd971B7eb70732021E26C35B744cc4"
      },
      "TestToken": {
        "address": "0x744d70fdbe2ba4cf95131626614a1763df805b9e"
      },
      "UsernameRegistrar": {
        "address": "0xDB5ac1a559b02E12F29fC0eC0e37Be8E046DEF49"
      },
      "MerkleProof": {
        "address": "0x713ED9846463235df08D92B886938651105D3940"
      },
      "MerkleProofWrapper": {
        "address": "0x76E55E13C5891a90f7fCA2e1238a6B3463F564e2"
      },
      "SafeMath": {
        "address": "0xA115a57952D3337e2a1aB3Cb82bA376EEcDDc469"
      }
    }
  },
  "testnet":{
    "contracts": {
      "ENSRegistry": {
        "address": "0x112234455c3a32fd11230c42e7bccd4a84e02010"
      },
      "PublicResolver": {
        "address": "0x29754bADB2640b98F6deF0f52D41418b0d2e0C51"
      },
      "TestToken": {
        "address": "0xc55cF4B03948D7EBc8b9E8BAD92643703811d162"
      },
      "SafeMath": {
        "address": "0x0F9992f7737f9ba3aceD170D4D1259cb2CEcc050"
      },
      "MerkleProof": {
        "address": "0x5df00E70AD165D50228DB6d8285fB6EAAc630FD7"
      },
      "MerkleProofWrapper": {
        "address": "0x58E01078d14142E0370526dFdAE44E4f508c844B"
      },
      "UsernameRegistrar": {
        "address": "0x11d9F481effd20D76cEE832559bd9Aca25405841"
      }
    }
  },
  "rinkeby":{
    "contracts": {
      "ENSRegistry": {
        "address": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A"
      },
      "PublicResolver": {
        "address": "0x5d20cf83cb385e06d2f2a892f9322cd4933eacdc"
      }
    }
  }
}
