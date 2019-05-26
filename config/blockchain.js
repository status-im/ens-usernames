module.exports = {
  default: {
    enabled: true,
    syncMode: "light",
    rpcHost: "localhost", 
    rpcPort: 8545, 
    rpcCorsDomain: {
      auto: true,
      additionalCors: []
    },
    wsHost: "localhost",
    wsPort: 8546,
    wsOrigins: { 
      auto: true,
      additionalCors: []
    },    
    wsRPC: true,
  },

  development: {
    ethereumClientName: "geth", 
    networkType: "custom", 
    networkId: 1337,
    isDev: true,
    datadir: ".embark/development/datadir",
    mineWhenNeeded: true, 
    nodiscover: true, 
    maxpeers: 0, 
    proxy: true, 
    targetGasLimit: 8000000, 
    simulatorBlocktime: 0
  },

  livenet: {
    networkType: "livenet",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/livenet/.password"
      }
    ]
  },

  testnet: {
    networkType: "testnet",
    rpcPort: 8645, 
    wsPort: 8646, 
    accounts: [
      {
        nodeAccounts: true,
        password: "config/testnet/.password"
      }
    ]
  },
  
  rinkeby: {
    enabled: true,
    rpcPort: 8745, 
    wsPort: 8746, 
    networkType: "rinkeby",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/rinkeby/.password"
      }
    ],
  }
 
};
