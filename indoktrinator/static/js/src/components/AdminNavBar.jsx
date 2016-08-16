import * as React from 'react'
import * as Reflux from 'reflux'
import {UserInfoStore} from '../stores/UserInfo'
import {Nav, Navbar, NavItem} from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'

var Header = Navbar.Header
var Brand = Navbar.Brand

export var AdminNavBar = React.createClass({
  mixins: [Reflux.connect(UserInfoStore, 'user')],

  getInitialState() {
    return {user: {}}
  },

  getAvailableLinks() {
    var res = []

        res.push(
            <LinkContainer to='/device/' key='device'>
                <NavItem eventKey={2}>Devices</NavItem>
            </LinkContainer>
        )

        res.push(
            <LinkContainer to='/program/' key='program'>
                <NavItem eventKey={2}>Programes</NavItem>
            </LinkContainer>
        )

        res.push(
            <LinkContainer to='/playlist/' key='playlist'>
                <NavItem eventKey={2}>Playlists</NavItem>
            </LinkContainer>
        )

        res.push(
            <LinkContainer to='/event/' key='event'>
                <NavItem eventKey={2}>Events</NavItem>
            </LinkContainer>
        )

    return res
  },

  render() {
    return (
    <div className='navbar navbar-pf'>
      <Header>
          <Brand>
              <a href="/#/"><b>Indoktrinator</b> Signage management</a>
        </Brand>
    </Header>

            <Nav className="nav navbar-nav navbar-utility">
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

