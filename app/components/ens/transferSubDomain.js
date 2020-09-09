import lang from 'i18n-js';

import ENSRegistry from '../../../embarkArtifacts/contracts/ENSRegistry';

import React, { Fragment } from 'react';
import {connect} from 'react-redux';
import Hidden from '@material-ui/core/Hidden';
import CircularProgress from '@material-ui/core/CircularProgress';
import {ArrowButton, Button} from '../../ui/components';
import {withFormik} from 'formik';
import {hash} from 'eth-ens-namehash';
import FieldGroup from '../standard/FieldGroup';
import Field from '../../ui/components/Field';
import MobileSearch from '../../ui/components/MobileSearch';
import LinearProgress from '@material-ui/core/LinearProgress';
import Terms from './terms';

const { soliditySha3, fromWei } = web3.utils;

const formRef = React.createRef();
const displayTerms = status => status === 'terms';

class InnerForm extends React.Component {
  onRegisterClick = ({ values, setStatus }) => {
    setStatus(null);
    formRef.current.dispatchEvent(new Event('submit'));
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
      address,
      setStatus,
      status,
      statusContactCode,
      requestStatusContactCode
    } = this.props;

    return (
      <form onSubmit={handleSubmit} ref={formRef}>
        <div style={{margin: '12px'}}>        
          <Hidden mdDown>
            <FieldGroup
              id="address"
              name="address"
              type="text"
              label={lang.t('domain.ethereum_address.label')}
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.address}
              error={errors.address}
              button={
                <Button
                  mode="strong"
                  style={{padding: '5px 15px 5px 15px', marginTop: '5px'}}
                  onClick={() => setFieldValue('address', web3.eth.defaultAccount)}
                >
                  {lang.t('action.use_my_primary_address')}
                </Button>
              }
            />
            {!isSubmitting ? <Button wide mode="strong" type="submit"
                               disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? 'Submit' : 'Submitting to the Blockchain - (this may take awhile)'}</Button> :
             <LinearProgress/>}
          </Hidden>

          <Hidden mdUp>

          <Fragment>
              <Field label={lang.t('constants.transfer_address')}>
                <MobileSearch
                  name="address"
                  style={{ marginTop: '10px' }}
                  placeholder={lang.t('constants.transfer_address')}
                  value={values.address}
                  onChange={handleChange}
                  onClick={() => setFieldValue('address', '')}
                  required
                  wide />
              </Field>
            </Fragment>

            <div style={{display: 'flex', flexDirection: 'row-reverse', marginTop: '16px', marginBottom: '16px'}}>
              {!isSubmitting ?
               <ArrowButton type="button" onClick={(e) => {
                   this.onRegisterClick(this.props);
               }}>
                 <div>
                   {`${lang.t('action.transfer')}`}
                 </div>
               </ArrowButton>
               :
               <div style={{flex: 1, textAlign: 'center'}}>
                 <CircularProgress/>
               </div>
              }

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

const TransferSubDomain = withFormik({
  mapPropsToValues: props => ({ subDomain: '', domainName: '', address: props.address || '' }),
  validate(values, props) {
    const errors = {};
    const { address } = values;
    const { subDomain } = props || values;
    if (!address || !web3.utils.isAddress(address)) errors.address = lang.t('domain.ethereum_address.error');
    if (!subDomain) errors.subDomain = lang.t('sub_domain.error.required');
    return errors;
  },
  async handleSubmit(values, { setSubmitting, props }) {
    const { preRegisteredCallback } = props;
    const { address } = values;
    const { subDomain, domainName, registeredCallbackFn } = props || values;
    const { methods: { setOwner } } = ENSRegistry;
    const subdomainHash = soliditySha3(subDomain);
    //const domainNameHash = hash(domainName);
    const newController = address;
    const node = hash(subDomain.includes('eth') ? subDomain : `${subDomain}.${domainName}`);


    const funcsToSend = [];
    const args = [
      subdomainHash,
      newController
    ];
    if (address !== web3.eth.defaultAccount) funcsToSend.push(setOwner(node, newController));

    while (funcsToSend.length) {
      const toSend = funcsToSend.pop();
      toSend.estimateGas().then((gasEstimated) => {
        const gas = gasEstimated + 1000;
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
                  registeredCallbackFn(newController);
                }, 200);
                setSubmitting(false);
              })
      }).catch(err => {
        console.log("Register would error. :/ Already Registered? Have Token Balance? Is Allowance set?")
        console.dir(err);
        setSubmitting(false);
      });
    }
  }
})(InnerForm);

const mapStateToProps = state => ({

});

const mapDispatchToDisplayBoxProps = dispatch => ({

});

export default connect(mapStateToProps, mapDispatchToDisplayBoxProps)(TransferSubDomain);
