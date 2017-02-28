import * as React from 'react'
import {AdminNavBar} from './AdminNavBar'
import {ErrorFeedback} from './ErrorFeedback'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'

const enMessages = require('json!./../../../dist/lang/en-US.json')
const czMessages = require('json!./../../../dist/lang/cz.json')

export var App = React.createClass({

  getInitialState() {
    return {
      'languages': ['en', 'cs'],
      'defaultLanguage': 'en'
    }
  },

  handleChangeLang(lang) {
    i18n.changeLanguage(lang)
  },

  render() {
    return (
      <I18nextProvider i18n={i18n}>
        <ErrorFeedback/>
        <AdminNavBar
          changeLocaleHandler={this.handleChangeLang}
          defaultLanguage={this.state.defaultLanguage}
          languages={this.state.languages}
          i18n={i18n}
        />
        {this.props.children}
      </I18nextProvider>
    )
  }
})
