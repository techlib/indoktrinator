import * as React from 'react'
import {AdminNavBar} from './AdminNavBar'
import {ErrorFeedback} from './ErrorFeedback'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'

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
        <div>
          <ErrorFeedback/>
          <AdminNavBar
            changeLocaleHandler={this.handleChangeLang}
            defaultLanguage={this.state.defaultLanguage}
            languages={this.state.languages}
            i18n={i18n}
          />
          {this.props.children}
        </div>
      </I18nextProvider>
    )
  }
})
