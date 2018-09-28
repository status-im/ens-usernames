import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS'
import store from './configureStore'
import { fetchAndDispatchSNTAllowance, fetchAndDispatchAccountsWithBalances, checkAndDispatchStatusContactCode } from '../actions/accounts'

const dispatch = action => store.dispatch(action)

export default () => {
  EmbarkJS.onReady(async (err) => {
    fetchAndDispatchAccountsWithBalances(web3, dispatch)
    checkAndDispatchStatusContactCode(dispatch)
    fetchAndDispatchSNTAllowance(dispatch)
  })
}
