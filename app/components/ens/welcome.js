import lang from 'i18n-js';
import React from 'react';
import { Link } from 'react-router-dom';

import { StyledButton } from '../../ui/components';
import StatusCards from '../../ui/icons/svg/intro_name.svg';

import './welcome.css';

const WelcomeContent = () => (
  <div>
    <div className="ens-welcome__guide"><span>{lang.t('welcome.how')}</span></div>

    <ol className="ens-welcome__list">
      <li className="item">
        <div className="title">{lang.t('welcome.step.one.title')}</div>
        <div className="text">
          {lang.t('welcome.step.one.subtitle')}{' '}
          <span className="ens-welcome__highlight">{lang.t('welcome.eth_address_example')}</span>
        </div>
      </li>
      <li className="item">
        <div className="title">{lang.t('welcome.step.two.title')}</div>
        <div className="text">{lang.t('welcome.step.two.subtitle')}
        </div>
      </li>
      <li className="item">
        <div className="title">{lang.t('welcome.step.three.title')}</div>
        <div className="text">{lang.t('welcome.step.three.subtitle')}</div>
      </li>
    </ol>
    <div className="text-light">
      <small>{lang.t('welcome.disclaimer')}</small>
    </div>
  </div>
);

const Welcome = () => (
  <div className="ens-welcome">
    <img className="ens-welcome__img" src={StatusCards} />
    <h2 className="ens-welcome__title">{lang.t('welcome.title')}</h2>
    <Link to="/search">
      <StyledButton>
        <div>{lang.t('welcome.cta')}</div>
      </StyledButton>
    </Link>
    <WelcomeContent />
  </div>
);

export default Welcome;
