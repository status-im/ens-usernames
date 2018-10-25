import React from 'react';
import {StyledButton} from '../../ui/components';
import StatusCards from '../../ui/icons/svg/intro_name.svg';
import {Link} from "react-router-dom";

import './welcome.css';

const WelcomeContent = () => (
  <div>
    <div className="ens-welcome__guide"><span>How it works</span></div>

    <ol className="ens-welcome__list">
      <li className="item">
        <div className="title">Simplify your ETH address</div>
        <div className="text">Your complex wallet address (0x...) becomes an easy to read, remember & share URL: <span
          className="ens-welcome__highlight">myname.stateofus.eth</span></div>
      </li>
      <li className="item">
        <div className="title">10 SNT to register</div>
        <div className="text">Register once to keep the name forever. After 1 year, you can release the name and get
          your SNT back.
        </div>
      </li>
      <li className="item">
        <div className="title">Connect & get paid</div>
        <div className="text">Share your name to chat on Status or receive ETH and tokens.</div>
      </li>
    </ol>
    <div className="text-light">
      <small>Powered by Ethereum Name Services</small>
    </div>
  </div>
);

const Welcome = () => (
  <div className="ens-welcome">
    <img className="ens-welcome__img" src={StatusCards} />
    <h2 className="ens-welcome__title">
        ENS names transform those crazy-long addresses into unique usernames
    </h2>
    <Link to="/search">
      <StyledButton>
        <div>Let's Go</div>
      </StyledButton>
    </Link>
    <WelcomeContent/>
  </div>
);

export default Welcome;
