import lang from 'i18n-js';
import UsernameRegistrar from 'Embark/contracts/UsernameRegistrar';
import web3 from 'web3';
import ENSRegistry from 'Embark/contracts/ENSRegistry';
import React from 'react';
import { Button } from 'react-bootstrap';
import FieldGroup from '../standard/FieldGroup';
import { withFormik } from 'formik';
import { hash } from 'eth-ens-namehash';
import { debounce } from 'lodash/fp';

const { methods: { owner } } = ENSRegistry;

const delay = debounce(500);
const getRegistry = (hashedRegistry, registrys) => registrys(hashedRegistry).call();
const registryIsOwner = address => address == UsernameRegistrar._address;
const fetchOwner = registryName => owner(hash(registryName)).call();
const debounceFetchOwner = delay(fetchOwner);
const getAndIsOwner = async registryName => {
  const address = await debounceFetchOwner(registryName);
  return registryIsOwner(address);
}
const fetchRegistry = delay(getRegistry);
const setPrice = (registryFn, price) => registryFn(price || 0).send();

const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}) => (
  <form onSubmit={handleSubmit}>
    <FieldGroup
      id="registryName"
      name="registryName"
      type="text"
      label={lang.t('registry.name.label')}
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.registryName}
      error={errors.registryName}
    />
    <FieldGroup
      id="registryPrice"
      name="registryPrice"
      type="number"
      label={lang.t('registry.price.label')}
      placeholder={lang.t('registry.price.placeholder')}
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.registryPrice}
    />
    <Button bsStyle="primary" type="submit" disabled={isSubmitting || !!Object.keys(errors).length}>{!isSubmitting ? lang.t('action.submit') : lang.t('action.submitting_to_blockchain')}</Button>
  </form>
)

const AddRegistry = withFormik({
  mapPropsToValues: props => ({ registryName: '', registryPrice: '' }),
  async validate(values) {
    const { registryName } = values;
    const errors = {};
    if (!registryName) errors.registryName = lang.t('registry.error.name.required');
    if (registryName && !await getAndIsOwner(registryName)) errors.registryName = lang.t('registry.error.name.owned');
    if (Object.keys(errors).length) throw errors;
  },
  async handleSubmit(values, { setSubmitting }) {
    const { registryName, registryPrice } = values;
    const { methods: { state, activate, updateRegistryPrice } } = UsernameRegistrar;
    const { registryState } = await state();
    console.log(
      'Inputs for setPrice',
      Number(registryState) ? 'updateRegistryPrice' : 'activate',
      web3.utils.toWei(registryPrice.toString(), 'ether'),
    );
    setPrice(
      Number(registryState) ? updateRegistryPrice : activate,
      web3.utils.toWei(registryPrice.toString(), 'ether'),
    )
      .then(res => {
        setSubmitting(false);
        console.log(res);
      })
      .catch(err => {
        setSubmitting(false);
        console.log(err);
      })
  }
})(InnerForm);

export default AddRegistry;
