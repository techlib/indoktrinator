import * as React from 'react'
import * as Reflux from 'reflux'
//import {UserInfoStore} from "../stores/UserInfo"
import {Nav, Navbar, NavItem} from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'
import {LocaleSwitcher} from './LocaleSwitcher'
import {translate} from 'react-i18next'

var Header = Navbar.Header
var Brand = Navbar.Brand

export var AdminNavBar = translate(['app','menu'])(React.createClass({
  mixins: [
    //Reflux.connect(UserInfoStore, 'user')
    ],

  getInitialState() {
    return {user: {}}
  },

  getAvailableLinks() {
    var res = []
    const {t} = this.props

    res.push(
      <LinkContainer to='/device/' key='device'>
        <NavItem eventKey={2}>
          {t('menu:devices')}
        </NavItem>
      </LinkContainer>
    )

    res.push(
      <LinkContainer to='/program/' key='program'>
        <NavItem eventKey={2}>
          {t('menu:programs')}
        </NavItem>
      </LinkContainer>
    )

    res.push(
      <LinkContainer to='/playlist/' key='playlist'>
        <NavItem eventKey={2}>
          {t('menu:playlists')}
        </NavItem>
      </LinkContainer>
    )

    return res
  },

  render() {
    const {t} = this.props

    return (
      <div className='navbar navbar-pf'>
        <Header>
          <Brand>
            <a href="/#/">
              <b>
                {t('app:name')}
              </b>
              <p>
                {t('app:description')}
              </p>
            </a>
          </Brand>
        </Header>

        <Nav className="nav navbar-nav navbar-utility">
          <li>
            <LocaleSwitcher
              changeLocaleHandler={this.props.changeLocaleHandler}
              defaultLanguage={this.props.defaultLanguage}
              languages={this.props.languages}
            />
          </li>
          <li>
            <a href="#">
              <span className="pficon pficon-user"></span>
              {this.state.user.username}
            </a>
          </li>
        </Nav>

        <Nav className='navbar-nav navbar-primary'>
          {this.getAvailableLinks()}
        </Nav>
      </div>
    )
  }
}))

