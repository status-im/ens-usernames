import lang from 'i18n-js';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import TestToken from 'Embark/contracts/TestToken';
import React, { Fragment } from 'react';
import AddDomain from './ens/addDomain';
import MoveDomain from './ens/moveDomain';
import RegisterSubDomain from './ens/registerSubDomain';
import TokenPermissions from './standard/TokenPermission';
import SetupENS from './ens/setupENS';
import UpdateController from './ens/updateController';

const ENSSubManagement = () => (
  <Fragment>
    <h2 style={{ textAlign: 'center' }}>{lang.t('sub_domain.management.title')}</h2>
    <h3>{lang.t('sub_domain.management.change_registry')}</h3>
    <UpdateController />
    <h3>{lang.t('sub_domain.management.activate_registry')}</h3>
    <AddDomain />
    <h3>{lang.t('sub_domain.management.move_domain')}</h3>
    <MoveDomain />
    <hr />
    <h3>{lang.t('sub_domain.management.register_sub_domain')}</h3>
    <RegisterSubDomain />
    <hr />
    <TokenPermissions
      symbol="SNT"
      spender={UsernameRegistrar._address}
      methods={TestToken.methods}
    />
    <hr />
    <SetupENS ENSRegistry={ENSRegistry} />
  </Fragment>
);

export default ENSSubManagement;
