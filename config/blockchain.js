module.exports = {
  default: {
    enabled: true,
    client: "geth" 
  },

  development: {
    client: 'ganache-cli',
    clientConfig: {
      miningMode: 'dev'
    }
  },

  testnet: {
    networkType: "testnet",
    syncMode: "light",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/testnet/password"
      }
    ]
  },

  livenet: {
    networkType: "livenet",
    syncMode: "light",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/livenet/password"
      }
    ]
  },

  rinkeby: {
    networkType: "rinkeby",
    syncMode: "light",
    accounts: [
      {
        nodeAccounts: true,
        password: "config/rinkeby/password"
      }
    ]
  }
};
