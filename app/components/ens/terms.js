import React from 'react';
import classNames from 'classnames';
import {withStyles} from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import {Button} from '../../ui/components';
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

const StyledButton = styled(Button)`
  background-color: rgba(67, 96, 223, 0.1);
  
  div {
    color: #4360df;
    margin: 0 20px;
    font-weight: 400;
    text-transform: uppercase;
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
          <li>After 1 year, you can release the name and get your deposit back, or take no action to keep the name.</li>
          <li>If terms of the contract change — e.g. Status makes contract upgrades — user has the right to release the
            username regardless of time held.
          </li>
          <li>The contract controller cannot access your deposited funds. They can only be moved back to the address
            that sent them.
          </li>
          <li>Your address(es) will be publicly associated with your ENS name.</li>
          <li>Usernames are created as subdomain nodes of stateofus.eth and are subject to the ENS smart contract
            terms.
          </li>
          <li>You authorize the contract to transfer SNT on your behalf. This can only occur when you approve a
            transaction to authorize the transfer.
          </li>
        </ListContainer>

        <p>These terms are guaranteed by the smart contract logic at addresses:</p>

        <ListContainer>
          <li>0xb1C47B61CDaeee3fA85Fe8B93FcE6311165E6291 (ENSSubdomainRegistry — Status)</li>
        </ListContainer>

        <ListContainer>
          <li>0x112234455C3a32FD11230C42E7Bccd4A84e02010 (ENS).</li>
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
