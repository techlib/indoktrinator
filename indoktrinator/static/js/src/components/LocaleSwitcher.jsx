import * as React from 'react'
import {Nav, Navbar, NavItem} from 'react-bootstrap'
import {translate} from 'react-i18next'

export var LocaleSwitcher = translate('common')(React.createClass({

  toggle() {
    let language = this.props.language == 'cs' ? 'en' : 'cs'
    this.props.changeLocaleHandler(language)
  },

  render() {
    let text = this.props.t('common:languagetoggle')
    return <NavItem href="#" onClick={this.toggle}>{text}</NavItem>
  }
}))
