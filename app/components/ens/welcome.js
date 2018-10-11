import React from 'react';
import classNames from 'classnames';
import {withStyles} from '@material-ui/core/styles';
import {Button} from '../../ui/components';
import StatusCards from '../../ui/icons/svg/intro_name.svg';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";

import './welcome.css';

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
    backgroundColor: 'rgba(67, 96, 223, 0.1)',
  },
  buttonText: {
    color: '#4360df',
    margin: '0 20px',
    fontWeight: 400,
    textTransform: 'uppercase'
  }
});

const WelcomeContent = () => (
  <div>
    <div className="ens-welcome__guide"><span>How it works</span></div>

    <ol className="ens-welcome__list">
      <li className="item">
        <div className="title">Simplify your ETH address</div>
        <div className="text">Your complex wallet address (0x...) becomes an easy to read, remember & share URL: <span
          className="ens-welcome__highlight">myname.imtheone.eth</span></div>
      </li>
      <li className="item">
        <div className="title">100 SNT to register</div>
        <div className="text">Register once to keep the name forever. After 1 year, you can release the name and get
          your SNT back.
        </div>
      </li>
      <li className="item">
        <div className="title">Connect & get paid</div>
        <div className="text">Share your name to chat on Status or receive ETH and tokens.</div>
      </li>
    </ol>
    <div className="ens-welcome__info">Already have a Status subdomain? <a href="">Manage it</a></div>
    <div className="text-light">
      <small>Powered by Ethereum Name Services</small>
    </div>
  </div>
);

const Welcome = ({ classes }) => (
  <div className="ens-welcome">
    <img className="ens-welcome__img" src={StatusCards} />
    <h2 className="ens-welcome__title">
        ENS names transform those crazy-long addresses into unique usernames
    </h2>
    <Link to="/search">
      <Button className={classNames(classes.button)}>
        <div className={classNames(classes.buttonText)}>Let's Go</div>
      </Button>
    </Link>
    <WelcomeContent/>
  </div>
);

export default withStyles(styles)(Welcome);
