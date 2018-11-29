import lang from 'i18n-js';
import styled from 'styled-components';
import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import { ArrowButton } from '../../ui/components';

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

const Terms = ({ open, onSubmit }) => (
  <Dialog fullScreen open={open}>
    <TermsContainer>
      <InfoHeading className="ens-terms__title">{lang.t('terms.title')}</InfoHeading>
      <TermsDescription>
        <ListContainer>
          <li>{lang.t('terms.funds_deposit')}</li>
          <li>{lang.t('terms.funds_release')}</li>
          <li>{lang.t('terms.names_creation', { stateofus: <i>stateofus.eth</i> })}</li>
          <li>{lang.t('terms.contract', { stateofus: <i>stateofus.eth</i> })}</li>
          <li>{lang.t('terms.rule.title')}
            <ol type="1">
              <li>{lang.t('terms.rule.one')}</li>
              <li>{lang.t('terms.rule.two')}</li>
              <li>{lang.t('terms.rule.three')}</li>
              <li>{lang.t('terms.rule.four', { reserved_list_link: <a href="https://github.com/status-im/ens-usernames/blob/master/config/ens-usernames/reservedNames.js">{lang.t('terms.reserved_list')}</a> })}</li>
              <li>{lang.t('terms.rule.five', { eth_address: <code>Ox</code> })}</li>
            </ol>
          </li>
          <li>{lang.t('terms.illegal_name')}</li>
          <li>{lang.t('terms.contact')}</li>
        </ListContainer>
      </TermsDescription>

      <div
        style={{
          display: 'flex', flexDirection: 'row-reverse', marginBottom: '16px', marginRight: '8px',
        }}
      >
        <ArrowButton type="submit" onClick={onSubmit}>
          <div>{lang.t('action.send_snt')}</div>
        </ArrowButton>
      </div>

    </TermsContainer>
  </Dialog>
);

export default Terms;
