import lang from 'i18n-js';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import store from './store/configureStore';
import App from './dapp';
import init from './store/init';
import translations from './languages';
import './dapp.css';

// Init i18n translation
lang.defaultLocale = 'en';
lang.locale = navigator.language;
lang.fallbacks = true;
lang.translations = translations;

// Init Redux store
init();

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);
