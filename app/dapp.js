import React from 'react';
import 'typeface-roboto'
import Toggle from 'react-toggle';
import EmbarkJS from 'Embark/EmbarkJS';
import TestToken from '../embarkArtifacts/contracts/TestToken';
import { startCase } from 'lodash';
import UsernameRegistrar from '../embarkArtifacts/contracts/UsernameRegistrar';
import NameLookup from './components/ens/nameLookup';
import AdminMode from './components/AdminMode';
import TokenPermissions from './components/standard/TokenPermissionConnect';
import Welcome from './components/ens/welcome';
import Hidden from '@material-ui/core/Hidden';
import Web3Render from './components/standard/Web3Render';
import StatusOptimized from './components/standard/StatusOptimized';
import { HashRouter, Route } from "react-router-dom";
import './dapp.css';

const { getNetworkType } = web3.eth.net;
const symbols = {
  'ropsten': 'STT',
  'private': 'SNT',
  'main': 'SNT'
}

const isReady = (network, blockchainEnabled) => {
  if (!network) return;
  console.log(blockchainEnabled)
  return blockchainEnabled;
}

// const getEnvironment = env => {
//   if (env === 'testnet') return startCase('ropsten')
//   return startCase(env)
// }

const Web3RenderContent = ({ network, history, match, blockchainEnabled }) => (
  <Web3Render ready={isReady(network, blockchainEnabled)} network={'livenet'}>
    <div>
      <NameLookup {...{history, match}}/>
      <Hidden mdDown>
        <div style={{textAlign: 'center', margin: '0px 40px'}}>
          <TokenPermissions
            symbol={symbols[network] || 'SNT'}
            spender={UsernameRegistrar._address}
            methods={TestToken.methods}/>
          <hr/>
          <Toggle onChange={() => {
            this.setState({admin: !admin})
          }}/>
          <br/>
          <span>Admin Mode</span>
        </div>
      </Hidden>
    </div>
  </Web3Render>
);

class App extends React.Component {
  constructor(props) {
    super(props)
  }
  state = { admin: false };

  componentDidMount(){
    EmbarkJS.onReady((err) => {
      if (err) {
        // If err is not null then it means something went wrong connecting to ethereum
        // you can use this to ask the user to enable metamask for e.g
        return this.setState({error: err.message || err});
      }
      EmbarkJS.Blockchain.isAvailable().then(result => {
        this.setState({blockchainEnabled: result});
      });
  
      EmbarkJS.Messages.isAvailable().then(result => {
        this.setState({whisperEnabled: result});
      });
  
      EmbarkJS.Storage.isAvailable().then((result) => {
        this.setState({storageEnabled: result});
      }).catch(() => {
        this.setState({storageEnabled: false});
      });
      getNetworkType().then(network => {
        this.setState({ network })
      });
    });
  }

  render() {
    const { admin, network, blockchainEnabled } = this.state;

    return (
      <HashRouter hashType="noslash">
        <div>
          <Hidden mdDown>
            <StatusOptimized/>
          </Hidden>
          <div style={{display: admin ? 'block' : 'none'}}>
            <AdminMode style={{display: admin ? 'block' : 'none'}}/>
          </div>

          <Route exact path="/" component={Welcome}/>
          <Route path="/search" render={({history, match}) => (
            <Web3RenderContent {...{history, match, network, blockchainEnabled }} />
          )}/>
        </div>
      </HashRouter>
    );
  }
}

export default App;
