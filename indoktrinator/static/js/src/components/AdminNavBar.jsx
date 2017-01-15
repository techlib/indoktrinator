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
      <div className='navbar navbar-pf navbar-default'>
        <Header>
          <Brand>
            <a href="/#/">
              <b>{t('app:name')}</b> {t('app:description')}
            </a>
          </Brand>
        </Header>
        <Nav className="nav navbar-nav navbar-utility">
            <LocaleSwitcher
              changeLocaleHandler={this.props.changeLocaleHandler}
              language={this.props.i18n.language}
            />
            <NavItem href="#">
              <i className="pficon pficon-user"> </i> {this.state.user.username}
            </NavItem>
        </Nav>

        <Nav className='navbar-nav navbar-primary'>
          {this.getAvailableLinks()}
        </Nav>
      </div>
    )
  }
}))

