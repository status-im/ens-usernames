import React, { Fragment, PureComponent } from 'react';
import web3 from 'web3';
import EmbarkJS from 'Embark/EmbarkJS';
import { connect } from 'react-redux';
import { actions as accountActions, getDefaultAccount } from '../../reducers/accounts';
import { checkAndDispatchStatusContactCode } from '../../actions/accounts';
import { hash } from 'eth-ens-namehash';
import { isNil } from 'lodash';
import Hidden from '@material-ui/core/Hidden';
import Typography from '@material-ui/core/Typography';
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import { Button, Field, TextInput, MobileSearch, MobileButton, Card, Info, Text } from '../../ui/components'
import { IconCheck } from '../../ui/icons'
import { keyFromXY } from '../../utils/ecdsa';
import EditOptions from './EditOptions';
import ReleaseDomainAlert from './ReleaseDomain';
import theme from '../../ui/theme'
import { withFormik } from 'formik';
import PublicResolver from 'Embark/contracts/PublicResolver';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import RegisterSubDomain from '../ens/registerSubDomain';
import StatusLogo from '../../ui/icons/components/StatusLogo'
import EnsLogo from '../../ui/icons/logos/ens.png';
import { formatPrice } from '../ens/utils';
import CheckCircle from '../../ui/icons/components/baseline_check_circle_outline.png';
import Warning from '../../ui/components/Warning';
const { getPrice, getExpirationTime, getCreationTime, release } = UsernameRegistrar.methods;
import NotInterested from '@material-ui/icons/NotInterested';
import Face from '@material-ui/icons/Face';
import Copy from './copy';
import IDNANormalizer from 'idna-normalize';
import { nullAddress, getResolver } from './utils/domain';
import { YOUR_CONTACT_CODE } from './constants';
import DisplayBox from './DisplayBox';

const normalizer = new IDNANormalizer();
const invalidSuffix = '0000000000000000000000000000000000000000'
const validAddress = address => address != nullAddress;
const validStatusAddress = address => !address.includes(invalidSuffix);
const formatName = domainName => domainName.includes('.') ? normalizer.normalize(domainName) : normalizer.normalize(`${domainName}.stateofus.eth`);
const getDomain = fullDomain => formatName(fullDomain).split('.').slice(1).join('.');
const hashedDomain = domainName => hash(getDomain(domainName));
const registryIsOwner = address => address == UsernameRegistrar._address;
const { soliditySha3, fromWei } = web3.utils;


const cardStyle = {
  width: '100%',
  padding: '30px',
  height: '425px'
}

const addressStyle = {
  fontSize: '18px',
  fontWeight: 400,
  cursor: 'copy',
  wordWrap: 'break-word',
}

const backButton = {
  fontSize: '40px',
  color: theme.accent,
  cursor: 'pointer'
}

const validTimestamp = timestamp => Number(timestamp) > 99999999;
const generatePrettyDate = timestamp => new Date(timestamp * 1000).toDateString();
const pastReleaseDate = timestamp => new Date > new Date(timestamp * 1000);

const MobileAddressDisplay = ({ domainName, address, statusAccount, expirationTime, creationTime, defaultAccount, isOwner, edit, onSubmit, handleChange, values, handleSubmit }) => (
  <Fragment>
    <LookupForm {...{ handleSubmit, values, handleChange }} justSearch />
    <Info background={isOwner ? '#44D058' : '#000000'} style={{ margin: '0.4em', boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.2)' }}>
      <Typography variant="title" style={
        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', height: '4em', color: '#ffffff', textAlign: 'center', margin: '10%' }
      }>
        {isOwner ? <Face style={{ marginBottom: '0.5em', fontSize: '2em' }} /> : <NotInterested style={{ marginBottom: '0.5em', fontSize: '2em' }}/>}
        <b>{formatName(domainName)}</b>
        <div style={{ fontWeight: 300, fontSize: '15px', marginTop: '10px' }}>
          {isOwner
           ? edit ? 'Edit Contact Code' : 'You own this ENS name'
           : 'unavailable'}

        </div>
      </Typography>
    </Info>
    <Typography type='subheading' style={{ textAlign: 'center', fontSize: '17px', fontWeight: '500', margin: '1.5em 0 0.3em 0' }}>
      Registered {validTimestamp(creationTime) && generatePrettyDate(creationTime)}
    </Typography>
    <Typography type='body2' style={{ textAlign: 'center', margin: 10 }}>
      {edit
       ? 'The contact code connects the domain with a unique Status account'
       : validAddress(address) ? 'to the addresses below' : 'Click \'Edit\' to add a valid address and contact code'}
    </Typography>
    {edit && <RegisterSubDomain
               subDomain={domainName}
               domainName="stateofus.eth"
               domainPrice="DO NOT SHOW"
               editAccount={true}
               preRegisteredCallback={onSubmit}
               registeredCallbackFn={console.log} />}
    {!edit && <DisplayBox displayType='Your wallet address' pubKey={address} />}
    {!edit && validStatusAddress(statusAccount) && <DisplayBox displayType={YOUR_CONTACT_CODE} pubKey={statusAccount} />}
  </Fragment>
)

class RenderAddresses extends PureComponent {
  state = { copied: false, editMenu: false, editAction: false }

  render() {
    const { domainName, address, statusAccount, expirationTime, defaultAccount, ownerAddress, setStatus, registryOwnsDomain } = this.props
    const { copied, editMenu, editAction, submitted } = this.state
    const markCopied = (v) => { this.setState({ copied: v }) }
    const isCopied = address => address == copied;
    const renderCopied = address => isCopied(address) && <span style={{ color: theme.positive }}><IconCheck/>Copied!</span>;
    const onClose = value => { this.setState({ editAction: value, editMenu: false }) }
    const onClickEdit = () => { validAddress(address) ? this.setState({ editMenu: true }) : this.setState({ editAction: 'edit' }) }
    const isOwner = defaultAccount === ownerAddress;
    const canBeReleased = validTimestamp(expirationTime) && pastReleaseDate(expirationTime);
    const closeReleaseAlert = value => {
      if (!isNil(value)) {
        this.setState({ submitted: true })
        release(
          soliditySha3(domainName)
        )
          .send()
      } else {
        this.setState({ editAction: null })
      }
    }
    return (
      <Fragment>
        <Hidden mdDown>
          <div style={{ display: 'flex', flexDirection: 'column', margin: 50 }}>
            <Info.Action title="Click to copy"><b>{formatName(domainName)}</b>{expirationTime && <i> (Expires {generatePrettyDate(expirationTime)})</i>} Resolves To:</Info.Action>
            {address && <Text style={{ marginTop: '1em' }}>Ethereum Address {renderCopied(address)}</Text>}
            <CopyToClipboard text={address} onCopy={markCopied}>
              <div style={addressStyle}>{address}</div>
            </CopyToClipboard>
            {validStatusAddress(statusAccount) && <Text style={{ marginTop: '1em' }}>Status Address {renderCopied(statusAccount)}</Text>}
            {validStatusAddress(statusAccount) && <CopyToClipboard text={statusAccount} onCopy={markCopied}>
              <div style={{ ...addressStyle, color: isCopied ? theme.primary : null }}>{statusAccount}</div>
            </CopyToClipboard>}
          </div>
        </Hidden>
        <Hidden mdUp>
          {submitted ? <TransactionComplete type={editAction} setStatus={setStatus} /> : <MobileAddressDisplay {...this.props} isOwner={isOwner} edit={editAction === 'edit'} onSubmit={() => { this.setState({ submitted: true}) }}/>}
          {isOwner && !editAction && <MobileButton text="Edit" style={{ margin: 'auto', display: 'block' }} onClick={onClickEdit}/>}
          <EditOptions open={editMenu} onClose={onClose} canBeReleased={canBeReleased} />
          <ReleaseDomainAlert open={editAction === 'release' && !submitted} handleClose={closeReleaseAlert} />
        </Hidden>
      </Fragment>
    )
  }
}

const RegisterInfoCard = ({ formattedDomain, domainPrice, registryOwnsDomain }) => (
  <Fragment>
    <Hidden mdDown>
      <Info.Action title="No address is associated with this domain">
        <span style={{ color: theme.accent }}>{formattedDomain.toLowerCase()}</span> can be registered for {!!domainPrice && formatPrice(fromWei(domainPrice))} SNT
      </Info.Action>
    </Hidden>
    <Hidden mdUp>
      <Info background="#415be3" style={{ margin: '0.4em' }}>
        <Typography variant="title" style={
          { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', height: '4em', color: '#ffffff', textAlign: 'center', margin: '10%' }
        }>
          <img src={CheckCircle} style={{ maxWidth: '2.5em', marginBottom: '0.5em' }} />
          <b>{formattedDomain.toLowerCase()}</b>
          <div style={{ fontWeight: 300, fontSize: '15px' }}>
            available
          </div>
        </Typography>
      </Info>
    </Hidden>
    <Hidden mdUp>
      <Typography style={{ textAlign: 'center', fontSize: '17px', fontWeight: '500', margin: '1.5em 0 0.3em 0' }}>
        {!!domainPrice && formatPrice(fromWei(domainPrice))} SNT to register
      </Typography>
      <Typography style={{ textAlign: 'center', padding: '1.5em' }}>
        {registryOwnsDomain ?
         'Add your contact code to use your name in Status chat.' :
         'This domain is not owned by the registry'}
      </Typography>
    </Hidden>
  </Fragment>
)

const TransactionComplete = ({ type, setStatus }) => (
  <div style={{ textAlign: 'center', margin: '40% 15 10' }}>
    <Typography variant="title" style={{ marginBottom: '1rem' }}>
      {Copy[type]['title']['sub']}<br/>
      {Copy[type]['title']['body']}
    </Typography>
    <Typography variant="subheading" style={{ color: '#939BA1' }}>
      {Copy[type]['subheading']}
    </Typography>
    <MobileButton text="Main Page" style={{ marginTop: '12rem' }} onClick={() => { setStatus(null) } } />
  </div>
);

class Register extends PureComponent {
  state = { domainPrice: null };

  componentDidMount() {
    const { domainName } = this.props;
    getPrice()
      .call()
      .then((res) => { this.setState({ domainPrice: res })});
  }

  onRegistered = (address, statusAccount) => {
    const { domainPrice } = this.state;
    const { subtractFromBalance } = this.props;
    subtractFromBalance(domainPrice);
    this.setState({ registered: { address, statusAccount } });
  }

  render() {
    const { domainName, setStatus, style, registryOwnsDomain, ownerAddress, defaultAccount } = this.props;
    const { domainPrice, registered, submitted } = this.state;
    const formattedDomain = formatName(domainName);
    const formattedDomainArray = formattedDomain.split('.');
    const isOwner = defaultAccount === ownerAddress;
    return (
      <div style={style}>
        {!registered && !submitted ?
         <Fragment>
           <RegisterInfoCard {...{ formattedDomain, domainPrice, registryOwnsDomain }}/>
           {registryOwnsDomain &&
            <RegisterSubDomain
             subDomain={formattedDomainArray[0]}
             domainName={formattedDomainArray.slice(1).join('.')}
             domainPrice={domainPrice}
             preRegisteredCallback={() => { this.setState({ submitted: true }) }}
             registeredCallbackFn={this.onRegistered} />}
         </Fragment> :
         submitted && !registered ? <TransactionComplete type="registered"  setStatus={setStatus} /> : <RenderAddresses {...this.props} address={registered.address} statusAccount={registered.statusAccount} />}
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => ({
  subtractFromBalance(amount) {
    dispatch(accountActions.subtractfromSntTokenBalance(amount));
  },
});

const mapStateToProps = state => ({
  defaultAccount: getDefaultAccount(state)
})

const ConnectedRegister = connect(mapStateToProps, mapDispatchToProps)(Register);

const DisplayAddress = connect(mapStateToProps)((props) => (
  <Fragment>
    {validAddress(props.address) || props.defaultAccount === props.ownerAddress ?
     <RenderAddresses {...props} />
     :
     <Hidden mdUp>
       <Info.Action title="No address is associated with this domain">
         {props.domainName}
       </Info.Action>
     </Hidden>
    }
  </Fragment>
))

const LookupForm = ({ handleSubmit, values, handleChange, justSearch }) => (
  <Fragment>
    <form onSubmit={handleSubmit} onBlur={handleSubmit} >
      <Hidden mdDown>
        <Field label="Enter Domain or Status Name" style={{ margin: 50 }}>
          <TextInput
            value={values.domainName}
            name="domainName"
            onChange={handleChange}
            wide
            required />
        </Field>
      </Hidden>
      <Hidden mdUp>
        <MobileSearch
          search
          name="domainName"
          placeholder='Search for available name'
          value={values.domainName}
          onChange={handleChange}
          required
          wide />
        {!justSearch && <Warning>Names are made with<br/>letters and numbers only</Warning>}
      </Hidden>
      <Hidden mdDown>
        <Button mode="strong" type="submit" style={{ marginLeft: '3%', maxWidth: '95%' }} wide>
          Lookup Address
        </Button>
      </Hidden>
    </form>
  </Fragment>
)

const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
  status,
  setStatus,
  defaultAccount
}) => (
  <div>
    <Hidden mdDown>
      <span style={{ display: 'flex', justifyContent: 'space-evenly', margin: '50 0 10 0' }}>
        <StatusLogo />
        <img  style={{ maxWidth: '150px', alignSelf: 'center' }} src={EnsLogo} alt="Ens Logo"/>
      </span>
     </Hidden>
    {!status
     ? <LookupForm {...{ handleSubmit, values, handleChange }} />
     : validAddress(status.address) || defaultAccount === status.ownerAddress ?
     <DisplayAddress
       {...{ handleSubmit, values, handleChange }}
       domainName={status.resolvedDomainName}
       address={status.address}
       statusAccount={status.statusAccount}
       expirationTime={status.expirationTime}
       creationTime={status.creationTime}
       ownerAddress={status.ownerAddress}
       registryOwnsDomain={status.registryOwnsDomain}
       setStatus={setStatus} /> :
     <div>
       <LookupForm {...{ handleSubmit, values, handleChange }} justSearch />
       <ConnectedRegister
         style={{ position: 'relative' }}
         setStatus={setStatus}
         registryOwnsDomain={status.registryOwnsDomain}
         ownerAddress={status.ownerAddress}
         domainName={status.resolvedDomainName}  />
     </div>
    }
  </div>
)

const NameLookup = withFormik({
  mapPropsToValues: props => ({ domainName: '' }),
  async handleSubmit(values, { status, setSubmitting, setStatus }) {
    const { domainName } = values;
    const { methods: { owner, resolver } } = ENSRegistry;
    const lookupHash = hash(formatName(domainName));
    const subdomainHash = soliditySha3(domainName);
    const resolverContract = await getResolver(lookupHash);
    const { addr, pubkey } = resolverContract.methods;
    const address = addr(lookupHash).call();
    const keys = pubkey(lookupHash).call();
    const ownerAddress = owner(lookupHash).call();
    const suffixOwner = owner(hash(getDomain(domainName))).call();
    const expirationTime = getExpirationTime(subdomainHash).call();
    const creationTime = getCreationTime(subdomainHash).call();
    Promise.all([address, keys, ownerAddress, expirationTime, creationTime, suffixOwner])
           .then(([ address, keys, ownerAddress, expirationTime, creationTime, suffixOwner ]) => {
             const statusAccount = keyFromXY(keys[0], keys[1]);
             const registryOwnsDomain = registryIsOwner(suffixOwner)
             const resolvedDomainName = domainName;
             setStatus({ address, statusAccount, expirationTime, creationTime, ownerAddress, registryOwnsDomain, resolvedDomainName });
           })
  }
})(InnerForm)

export default connect(mapStateToProps)(NameLookup);
