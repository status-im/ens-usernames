import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';

import './terms.css';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
    borderRadius: '4px',
    backgroundColor: 'rgba(67, 96, 223, 0.1)',
  }
});

const buttonText = { color: '#4360df', margin: '0 20px', fontWeight: 300 };


const Terms = ({ classes, open, onSubmit }) => (
  <Dialog
    fullScreen
    open={open}
  >
    <div className="ens-terms">
      <h2 className="ens-terms__title">Terms of name registration</h2>
      <ul>
        <li>Funds are deposited for 1 year. Your SNT   will be locked, but not spent.</li>
        <li>After 1 year, you can release the name and get your deposit back, or take no action to keep the name.</li>
        <li>If terms of the contract change — e.g. Status makes contract upgrades — user has the right to release the username regardless of time held.</li>
        <li>The contract controller cannot access your deposited funds. They can only be moved back to the address that sent them.</li>
        <li>Your address(es) will be publicly associated with your ENS name.</li>
        <li>Usernames are created as subdomain nodes of stateofus.eth and are subject to the ENS smart contract terms.</li>
        <li>You authorize the contract to transfer SNT on your behalf. This can only occur when you approve a transaction to authorize the transfer.</li>
      </ul>

      <p>These terms are guaranteed by the smart contract logic at addresses:</p>

      <ul>
        <li>0xb1C47B61CDaeee3fA85Fe8B93FcE6311165E6291 (ENSSubdomainRegistry — Status)</li>
      </ul>


      <ul>
        <li>0x112234455C3a32FD11230C42E7Bccd4A84e02010 (ENS).</li>
      </ul>

      <Button type="submit" size="large" className={classNames(classes.button)} onClick={onSubmit}>
        <div style={buttonText}>Let's Go</div>
      </Button>
    </div>
  </Dialog>
);

export default withStyles(styles)(Terms);
