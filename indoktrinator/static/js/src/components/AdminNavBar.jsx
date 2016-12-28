import * as React from 'react'
import * as Reflux from 'reflux'
//import {UserInfoStore} from "../stores/UserInfo"
import {Nav, Navbar, NavItem} from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'
import {FormattedMessage, FormattedDate} from 'react-intl'
import {LocaleSwitcher} from './LocaleSwitcher'

var Header = Navbar.Header
var Brand = Navbar.Brand

export var AdminNavBar = React.createClass({
  mixins: [
    //Reflux.connect(UserInfoStore, 'user')
    ],

  getInitialState() {
    return {user: {}}
  },

  getAvailableLinks() {
    var res = []

    res.push(
      <LinkContainer to='/device/' key='device'>
        <NavItem eventKey={2}>
          <FormattedMessage
            id="app.menu.devices.title"
            description="Title"
            defaultMessage="Devices"
          />
        </NavItem>
      </LinkContainer>
    )

    res.push(
      <LinkContainer to='/program/' key='program'>
        <NavItem eventKey={2}>
          <FormattedMessage
            id="app.menu.programmes.title"
            description="Title"
            defaultMessage="Programs"
          />
        </NavItem>
      </LinkContainer>
    )

    res.push(
      <LinkContainer to='/playlist/' key='playlist'>
        <NavItem eventKey={2}>
          <FormattedMessage
            id="app.menu.playlists.title"
            description="Title"
            defaultMessage="Playlists"
          />
        </NavItem>
      </LinkContainer>
    )

    return res
  },

  render() {
    return (
      <div className='navbar navbar-pf'>
        <Header>
          <Brand>
            <a href="/#/">
              <b>
                <FormattedMessage
                  id="app.menu.brand.name"
                  description="Brand name"
                  defaultMessage="Indoktrinator"
                />
              </b>
              <p>
                <FormattedMessage
                  id="app.menu.brand.description"
                  description="Branch description"
                  defaultMessage="Signage management"
                />
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
})

