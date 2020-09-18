import lang from 'i18n-js';
import UsernameRegistrar from '../../../embarkArtifacts/contracts/UsernameRegistrar';

import React from 'react';
import { Button } from 'react-bootstrap';
import FieldGroup from '../standard/FieldGroup';
import { withFormik } from 'formik';

const InnerForm = ({
  values,
  errors,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}) => (
  <form onSubmit={handleSubmit}>
    <FieldGroup
      id="newAddress"
      name="newAddress"
      type="text"
      label={lang.t('domain.new_address.label')}
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.newAddress}
      error={errors.newAddress}
    />
    <Button bsStyle="primary" type="submit" disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? lang.t('action.submit') : lang.t('action.submitting_to_blockchain')}</Button>
  </form>
)

const MoveDomain = withFormik({
  mapPropsToValues: props => ({ newAddress: '' }),
  async validate(values) {
    const { utils: { isAddress } } = web3;
    const { newAddress } = values;
    const errors = {};
    if (!isAddress(newAddress)) errors.newAddress = lang.t('error.valid_address')
    if (Object.keys(errors).length) throw errors;
  },
  async handleSubmit(values, { setSubmitting }) {
    const { newAddress } = values;
    const { methods: { moveDomain } } = UsernameRegistrar;
    console.log(
      `inputs for moveDomain:}`,
      newAddress
    );

    moveDomain(newAddress)
      .send()
      .then((res) => {
        setSubmitting(false);
        console.log(res);
      })
      .catch((err) => {
        setSubmitting(false);
        console.log(err);
      })
  }
})(InnerForm);

export default MoveDomain;
