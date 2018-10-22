import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import {StyledButton} from '../../ui/components';
import styled from "styled-components";

const TermsContainer = styled.div`
  word-wrap: break-word;
`;

const TermsDescription = styled.div`
  padding: 24px;
  font-size: 14px;
  line-height: 20.5px;
`;

const InfoHeading = styled.h2`
  line-height: 26px;
  font-size: 22px;
  text-align: center;
  letter-spacing: -0.275px;
  padding: 40px 24px;
  background: #EEF2F5;
  margin: 0;
  color: #000000;
`;

const ListContainer = styled.ul`
  padding-left: 16px;

  li {
    margin-bottom: 16px;
    padding-left: 12px;
  }
`;

const buttonText = { color: '#4360df', margin: '0 20px', fontWeight: 300 };

const Terms = ({ classes, open, onSubmit }) => (
  <Dialog fullScreen open={open}>
    <TermsContainer>
      <InfoHeading className="ens-terms__title">Terms of name registration</InfoHeading>

      <TermsDescription>
        <ListContainer>
          <li>Funds are deposited for 1 year. Your SNT will be locked, but not spent.</li>
          <li>After 1 year, you can release the name and get your deposit back. The name is yours until you release it.</li>
          <li>Names are created as a subdomain of <i>stateofus.eth</i>. They are property of Status and may be subject to new terms.</li>
          <li>If the <i>stateofus.eth</i> contract terms change—e.g. Status makes contract upgrades—you have the right to get your deposit back, even for names held less than 1 year.</li>
          <li> Names may not:
            <ol type="1">
              <li>contain less than 4 characters;</li>
              <li>n non-alphanumeric characters;</li>
              <li>contain uppercase letters;</li>
              <li>appear on this <a href="https://github.com/status-im/ens-usernames/blob/master/config/ens-usernames/reservedNames.js">reserved list</a></li>
              <li>mimic an Ethereum address (start with <code>Ox</code> and contain only hexadecimal characters in the first 12 digits)</li>
            </ol>
          </li>
          <li>Registering an illegal name via the registry contract will result in the loss of your SNT deposit and removal of the name.</li>
          <li>Contact codes and wallet addresses associated with your name are publicly available information.</li>
        </ListContainer>
        <div style={{textAlign: 'center'}}>
          <StyledButton type="submit" onClick={onSubmit}>
            <div>Let's Go</div>
          </StyledButton>
        </div>
      </TermsDescription>
    </TermsContainer>
  </Dialog>
);

export default Terms;
