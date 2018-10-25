import React from 'react';
import Typography from '@material-ui/core/Typography';
import styled from "styled-components";

const DisplayLabel = styled.div`
  font-size: 14px;
  color: #939BA1;
  margin: 0 1em;
`;

const DisplayBoxDiv = styled.div`
  border: 1px solid #EEF2F5;
  border-radius: 8px;
  margin: 7px 12px 14px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: ${props => props.showBlueBox ? "center" : "initial"};
  word-wrap: break-word;
  min-height: ${props => props.onClick ? "112px" : "0px"};
`;

const InnerDisplayBox = styled.div`
  margin: 16px;
`;

const BlueBox = styled.div`
  color: #4360df;
`;

const DisplayBox = ({ displayType, pubKey, onClick, showBlueBox }) => (
  <div>
    <DisplayLabel>
      {displayType}
    </DisplayLabel>
    <DisplayBoxDiv showBlueBox={showBlueBox} onClick={onClick}>
      <InnerDisplayBox>
        {
          showBlueBox && onClick ?
          <BlueBox>
            Grant access
          </BlueBox>
          :
          <Typography type='body1'>
            {pubKey}
          </Typography>
        }
      </InnerDisplayBox>
    </DisplayBoxDiv>
  </div>
);

export default DisplayBox;
