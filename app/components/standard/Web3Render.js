import React, { Fragment } from 'react';
import Warning from '../../ui/components/Warning';

const Web3Render = ({ ready, children, network }) => (
  <Fragment>
    {ready ? <Fragment>{children}</Fragment> : <Warning>Please connect to Ethereum {network}<br />to continue.</Warning>}
  </Fragment>
);

export default Web3Render;
