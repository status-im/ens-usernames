import lang from 'i18n-js';
import React, { Fragment } from 'react';
import Warning from '../../ui/components/Warning';

const Web3Render = ({ ready, children, network }) => (
  <Fragment>
    {ready
      ? <Fragment>{children}</Fragment>
      : <Warning>{lang.t('error.connect', { network })}</Warning>
    }
  </Fragment>
);

export default Web3Render;
