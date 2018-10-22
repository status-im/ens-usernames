import ERC20Token from 'Embark/contracts/ERC20Token'
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar'
import TestToken from 'Embark/contracts/TestToken'

import { getDefaultAccount } from '../utils/web3Helpers'
import { actions as accountActions } from '../reducers/accounts'
import { isNil } from 'lodash'

const { receiveAccounts, receiveStatusContactCode } = accountActions;

export const fetchAndDispatchAccountsWithBalances = (web3, dispatch) => {
  web3.eth.getAccounts((err, addresses) => {
    if (addresses) {
      const defaultAccount = web3.eth.defaultAccount || addresses[0]
      const accounts = addresses.map(async address => {
        const balance = await web3.eth.getBalance(address, 'latest')
        const SNTBalance = await ERC20Token.methods.balanceOf(address).call()
        return { address, balance, SNTBalance }
      })
      Promise.all(accounts).then(accounts => {
        dispatch(receiveAccounts(defaultAccount, accounts))
      })
    }
  })
}
export const checkAndDispatchStatusContactCode = (dispatch, callback) => {
  window.web3.currentProvider.status
    .getContactCode()
    .then(data => {
      callback(data);
      dispatch(receiveStatusContactCode(data));
    })
    .catch(err => {
      console.warn('Error:', err);
    })
};

export const fetchAndDispatchSNTAllowance = dispatch => {
  const { methods: { allowance } } = TestToken;
  const { receiveSntAllowance } = accountActions;
  const spender = UsernameRegistrar._address;
  allowance(getDefaultAccount(), spender)
    .call()
    .then(allowance => {
      dispatch(receiveSntAllowance(allowance))
    })
};
