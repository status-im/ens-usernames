import React from 'react';
import Typography from '@material-ui/core/Typography';
import { connect } from 'react-redux';
import { YOUR_CONTACT_CODE } from './constants';
import { checkAndDispatchStatusContactCode } from '../../actions/accounts';
import styled from "styled-components";

const DisplayLabel = styled.div`
  font-size: 14px;
  color: #939BA1;
  margin: 0 1em;
`;

const DisplayBox = styled.div`
  border: 1px solid #EEF2F5;
  border-radius: 8px;
  margin: 7px 12px 14px 12px;
  display: flex;
  flex-direction: column;
  justifyContent: space-around;
  min-height: 4em;
  word-wrap: break-word;
`;

const WrappedDisplayBox = ({displayType, pubKey, getStatusContactCode}) => (
  <div onClick={() => getStatusContactCode(displayType, pubKey)}>
    <DisplayLabel>
      {displayType}
    </DisplayLabel>
    <DisplayBox>
      <div style={{margin: '16px'}}>
        <Typography type='body1'>{pubKey}</Typography>
      </div>
    </DisplayBox>
  </div>
);

const mapDispatchToDisplayBoxProps = dispatch => ({
  getStatusContactCode(displayType, pubKey) {
    if (displayType === YOUR_CONTACT_CODE && !pubKey) checkAndDispatchStatusContactCode(dispatch);
  },
});

export default connect(null, mapDispatchToDisplayBoxProps)(WrappedDisplayBox);
