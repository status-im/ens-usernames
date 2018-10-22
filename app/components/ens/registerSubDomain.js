import web3 from "Embark/web3"
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import TestToken from 'Embark/contracts/TestToken';
import React from 'react';
import {connect} from 'react-redux';
import Hidden from '@material-ui/core/Hidden';
import CircularProgress from '@material-ui/core/CircularProgress';
import {Button, StyledButton} from '../../ui/components';
import {withFormik} from 'formik';
import {hash} from 'eth-ens-namehash';
import {zeroAddress, zeroBytes32, formatPrice} from './utils';
import {getStatusContactCode, getSNTAllowance, getCurrentAccount} from '../../reducers/accounts';
import FieldGroup from '../standard/FieldGroup';
import LinearProgress from '@material-ui/core/LinearProgress';
import Terms from './terms';
import {generateXY} from '../../utils/ecdsa';
import {getResolver} from './utils/domain';
import DisplayBox from './DisplayBox';
import { YOUR_CONTACT_CODE, YOUR_WALLET_ADDRESS } from './constants';
import {checkAndDispatchStatusContactCode} from "../../actions/accounts";

const { soliditySha3, fromWei } = web3.utils;

const formRef = React.createRef();
const displayTerms = status => status === 'terms';

class InnerForm extends React.Component {
  requestStatusContactCode = ({getStatusContactCode, setValues, values}) => {
    getStatusContactCode((result) => {
      setValues({...values, statusAddress: result});
    });
  };

  onRegisterClick = ({values, setStatus}) => {
    if (values.statusAddress) {
      setStatus("terms");
    } else {
      alert("You have to grant access to your contact code first")
    }
  };

  render() {
    const {
      values,
      errors,
      handleChange,
      handleBlur,
      handleSubmit,
      isSubmitting,
      setFieldValue,
      subDomain,
      domainName,
      domainPrice,
      editAccount,
      setStatus,
      status
    } = this.props;

    return (
      <form onSubmit={handleSubmit} ref={formRef}>
        <div style={{margin: '12px'}}>
          {!subDomain &&
          <FieldGroup
            id="subDomain"
            name="subDomain"
            type="text"
            label="Sub Domain"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.subDomain}
            error={errors.subDomain}
          />}
          {!domainName &&
          <FieldGroup
            id="domainName"
            name="domainName"
            type="text"
            label="Domain Name"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.domainName}
            button={
              <Button
                mode="strong"
                style={{marginTop: '5px'}}
                onClick={() => {
                  UsernameRegistrar.methods.getPrice()
                    .call()
                    .then((res) => {
                      setFieldValue('price', fromWei(res));
                    });
                }}>
                Get Price
              </Button>
            }
          />}
          {!domainPrice &&
          <FieldGroup
            id="price"
            name="price"
            label="Domain Price"
            disabled
            value={values.price ? `${formatPrice(values.price)} SNT` : ''}/>}
          <Hidden mdDown>
            <FieldGroup
              id="statusAddress"
              name="statusAddress"
              type="text"
              label="Status messenger address domain resolves to"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.statusAddress}
              error={errors.statusAddress}
              wide="true"
            />
            <FieldGroup
              id="address"
              name="address"
              type="text"
              label="Ethereum address domain resolves to"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.address}
              error={errors.address}
              button={<Button mode="strong"
                              style={{padding: '5px 15px 5px 15px', marginTop: '5px'}}
                              onClick={() => setFieldValue('address', web3.eth.defaultAccount)}>Use My Primary
                Address</Button>}
            />
            {!isSubmitting ? <Button wide mode="strong" type="submit"
                                     disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? 'Submit' : 'Submitting to the Blockchain - (this may take awhile)'}</Button> :
              <LinearProgress/>}
          </Hidden>

          <Hidden mdUp>

            <DisplayBox displayType={YOUR_WALLET_ADDRESS}
                        text={values.address}/>

            <DisplayBox displayType={YOUR_CONTACT_CODE}
                        text={values.statusAddress}
                        showBlueBox={!values.statusAddress}
                        onClick={() => this.requestStatusContactCode(this.props)}/>

            <div style={{position: 'relative', left: 0, right: 0, bottom: 0, textAlign: 'center'}}>
              {!isSubmitting ?
                <StyledButton onClick={() => this.onRegisterClick(this.props)}>
                  <div>
                    {`${editAccount ? 'Save' : 'Register'}`}
                  </div>
                </StyledButton>
                :
                <CircularProgress/>}
              <Terms open={displayTerms(status)}
                     onSubmit={() => {
                       setStatus(null);
                       formRef.current.dispatchEvent(new Event('submit'))
                     }}
                     form={formRef}/>
            </div>
          </Hidden>
        </div>
      </form>
    );
  }
}

const RegisterSubDomain = withFormik({
  mapPropsToValues: props => ({ subDomain: '', domainName: '', price: '', statusAddress: props.statusContactCode || '', address: web3.eth.defaultAccount || '' }),
  validate(values, props) {
    const errors = {};
    const { address } = values;
    const { subDomain } = props || values;
    if (address && !web3.utils.isAddress(address)) errors.address = 'Not a valid address';
    if (!subDomain) errors.subDomain = 'Required';
    return errors;
  },
  async handleSubmit(values, { setSubmitting, props }) {
    const { editAccount, preRegisteredCallback } = props;
    const { address, statusAddress } = values;
    const { subDomain, domainName, domainPrice, registeredCallbackFn } = props || values;
    const { methods: { register } } = UsernameRegistrar;
    const { methods: { approveAndCall } } = TestToken;
    const subdomainHash = soliditySha3(subDomain);
    const domainNameHash = hash(domainName);
    const resolveToAddr = address || zeroAddress;
    const points = statusAddress ? generateXY(statusAddress) : null;
    const node = hash(subDomain.includes('eth') ? subDomain : `${subDomain}.${domainName}`);
    const { methods: { setAddr, setPubkey } } = await getResolver(node);

    const funcsToSend = [];
    const args = [
      subdomainHash,
      resolveToAddr,
      points ? points.x : zeroBytes32,
      points ? points.y : zeroBytes32,
    ];
    if (editAccount) {
      if (address !== web3.eth.defaultAccount) funcsToSend.push(setAddr(node, resolveToAddr));
      if (statusAddress && statusAddress !== props.statusContactCode) funcsToSend.push(setPubkey(node, args[3], args[4]));
    } else {
      funcsToSend.push(
        approveAndCall(UsernameRegistrar.address, domainPrice, register(...args).encodeABI())
      );
    }
    while (funcsToSend.length) {
      const toSend = funcsToSend.pop();
      toSend.estimateGas().then((gasEstimated) => {
        const gas = editAccount ? gasEstimated + 1000 : gasEstimated * 2;
        console.log("Register would work. :D Gas estimated: " + gasEstimated, { gas }, gasEstimated + 1000);
        console.log("Trying: register(\"" + subdomainHash + "\",\"" + domainNameHash + "\",\"" + resolveToAddr + "\",\"" + zeroBytes32 + "\",\"" + zeroBytes32 + "\")");
        toSend.send({ gas })
              .on('transactionHash', (txHash) => { if (preRegisteredCallback) preRegisteredCallback(txHash); })
              .then((txId) => {
                if (txId.status === "0x1" || txId.status === "0x01"){
                  console.log("Register send success. :)");
                } else {
                  console.log("Register send errored. :( Out of gas? ");
                }
                console.dir(txId)
              }).catch(err => {
                console.log("Register send errored. :( Out of gas?");
                console.dir(err)
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                // REQUIRED UNTIL THIS ISSUES IS RESOLVED: https://github.com/jaredpalmer/formik/issues/597
                setTimeout(() => {
                  registeredCallbackFn(resolveToAddr, statusAddress || zeroBytes32);
                }, 200);
                setSubmitting(false);
              })
      }).catch(err => {
        console.log("Register would error. :/ Already Registered? Have Token Balance? Is Allowance set?")
        console.dir(err);
        if (err && err.message) {
          alert(err.message);
        }
        setSubmitting(false);
      });
    }
  }
})(InnerForm);

const mapStateToProps = state => ({
  statusContactCode: getStatusContactCode(state),
  SNTAllowance: getSNTAllowance(state),
  SNTBalance: getCurrentAccount(state) && getCurrentAccount(state).SNTBalance,
});

const mapDispatchToDisplayBoxProps = dispatch => ({
  getStatusContactCode(callback) {
    checkAndDispatchStatusContactCode(dispatch, callback);
  },
});

export default connect(mapStateToProps, mapDispatchToDisplayBoxProps)(RegisterSubDomain);
