
import EmbarkJS from 'Embark/EmbarkJS'
import store from './configureStore'
import { fetchAndDispatchSNTAllowance, fetchAndDispatchAccountsWithBalances } from '../actions/accounts'

const dispatch = action => store.dispatch(action)

export default () => {
  EmbarkJS.onReady(async (err) => {
    fetchAndDispatchAccountsWithBalances(web3, dispatch)
    fetchAndDispatchSNTAllowance(dispatch)
  })
}
