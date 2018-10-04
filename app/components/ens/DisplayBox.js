import React from 'react';
import Typography from '@material-ui/core/Typography';
import { connect } from 'react-redux';
import { YOUR_CONTACT_CODE } from './constants';
import { checkAndDispatchStatusContactCode } from '../../actions/accounts';

const WrappedDisplayBox = ({ displayType, pubKey, getStatusContactCode }) => (
  <div onClick={() => getStatusContactCode(displayType, pubKey)}>
    <div style={{ fontSize: '14px', color: '#939BA1', margin: '0 1em' }}>{displayType}</div>
    <div style={{ border: '1px solid #EEF2F5', borderRadius: '8px', margin: '7px 12px 14px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', minHeight: '4em' }}>
      <div style={{ margin: '16px', wordBreak: 'break-word' }}>
        <Typography type='body1'>{pubKey}</Typography>
      </div>
    </div>
  </div>
);

const mapDispatchToDisplayBoxProps = dispatch => ({
  getStatusContactCode(displayType, pubKey) {
    if (displayType === YOUR_CONTACT_CODE && !pubKey) checkAndDispatchStatusContactCode(dispatch);
  },
});

export default connect(null, mapDispatchToDisplayBoxProps)(WrappedDisplayBox);
