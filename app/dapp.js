import React from 'react';
import 'typeface-roboto'
import Toggle from 'react-toggle';
import EmbarkJS from 'Embark/EmbarkJS';
import TestToken from 'Embark/contracts/TestToken';
import { startCase } from 'lodash';
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import NameLookup from './components/ens/nameLookup';
import AdminMode from './components/AdminMode';
import TokenPermissions from './components/standard/TokenPermissionConnect';
import web3 from "Embark/web3";
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

const isReady = (network, environment) => {
  if (!network || !environment) return;
  const formattedNetwork = network.toLowerCase();
  if (formattedNetwork.includes('main') || formattedNetwork.includes('live')) {
    if (environment === 'livenet') return true
  }
  return formattedNetwork.includes(environment.toLowerCase());
}

const Web3RenderContent = ({ network, history, match, environment }) => (
  <Web3Render ready={isReady(network, environment)} network={startCase(environment)}>
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
      getNetworkType().then(network => {
        const { environment } = EmbarkJS
        this.setState({ network, environment })
      });
    });
  }

  render() {
    const { admin, network, environment } = this.state;

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
            <Web3RenderContent {...{history, match, network, environment}} />
          )}/>
        </div>
      </HashRouter>
    );
  }
}

export default App;
