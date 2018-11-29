import lang from 'i18n-js';
import React, { Fragment } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import TopNavbar from './topnavbar';
import TestTokenUI from './testtoken';
import ERC20TokenUI from './erc20token';
import ENSSubManagement from './ensSubManagement';
import NameLookup from './ens/nameLookup';


const AdminMode = () => (
  <Fragment>
    <TopNavbar />
    <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
      <Tab eventKey={1} title={lang.t('admin.tab.test_token')}>
        <TestTokenUI />
      </Tab>
      <Tab eventKey={2} title={lang.t('admin.tab.erc20_token')}>
        <ERC20TokenUI />
      </Tab>
      <Tab eventKey={3} title={lang.t('admin.tab.ens_management')}>
        <ENSSubManagement />
      </Tab>
      <Tab eventKey={4} title={lang.t('admin.tab.name_lookup')}>
        <NameLookup />
      </Tab>
    </Tabs>
  </Fragment>
);

export default AdminMode;
