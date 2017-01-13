import * as React from 'react'
import {AdminNavBar} from './AdminNavBar'
import {IntlProvider, addLocaleData} from 'react-intl'
import enLocaleData from 'react-intl/locale-data/en'
import {ErrorFeedback} from './ErrorFeedback'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'

addLocaleData(enLocaleData)

const enMessages = require('json!./../../../dist/lang/en-US.json')
const czMessages = require('json!./../../../dist/lang/cz.json')


export var App = React.createClass({

  getInitialState() {
    return {
      'messages': {},
      'language': 'en',
      'languages': ['en', 'cs'],
      'defaultLanguage': 'en'
    }
  },

  componentWillMount() {
    this.setState({
      messages: this.getLocaleMessages('en')
    })
  },

  getLocaleMessages(locale) {
    if (locale == 'cz') {
      return czMessages
    } else if (locale == 'en') {
      return enMessages
    }
  },

  handleChangeLang(lang) {
    i18n.changeLanguage(lang)
    this.setState({
      'lang': lang,
      'messages': this.getLocaleMessages(lang)
    })
  },

  getLocales() {
    return ['en', 'cs']
  },

  render() {
    return   <I18nextProvider i18n={ i18n }><IntlProvider locale={this.state.language} defaultLocale={this.state.defaultLanguage} messages={this.state.messages}>
      <div>
        <ErrorFeedback/>
        <AdminNavBar
          changeLocaleHandler={this.handleChangeLang}
          defaultLanguage={this.state.defaultLanguage}
          languages={this.state.languages}
        />
        {this.props.children}

      </div>
    </IntlProvider>
    </I18nextProvider>
  }
})
