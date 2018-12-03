import lang from 'i18n-js';
import React from 'react';
import { Navbar } from 'react-bootstrap';
import AccountList from './accountList';

class TopNavbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <React.Fragment>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#home">{lang.t('navbar.brand')}</a>
            </Navbar.Brand>
          </Navbar.Header>
          <AccountList classNameNavDropdown="pull-right" />
        </Navbar>
      </React.Fragment>
    );
  }
}

export default TopNavbar;
