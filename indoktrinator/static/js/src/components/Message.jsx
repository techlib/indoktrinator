import * as React from 'react'
import classNames from 'classnames'
import {translate} from 'react-i18next'

export var Message = translate('message')(React.createClass({
  renderExtra() {
    if (!this.props.extra) {
      return null
    }

    if (Array.isArray(this.props.extra)) {
      return <ul>
        {this.props.extra.map((item, index) => {
          return <li key={index}>{item}</li>
        })}
      </ul>

    } else {
      return this.props.extra
    }
  },

  render() {
    const {t} = this.props

    var cls, title, icon

    if (this.props.type == 'success') {
      cls = 'alert-success'
      title = t('messages:labels.success')
      icon = 'pficon-ok'
    } else if (this.props.type == 'error') {
      cls = 'alert-danger'
      title = t('messages:labels.error')
      icon = 'pficon-error-circle-o'
    }

    var clsIco = classNames('pficon', icon)
    var clsAlert = classNames('alert', cls)

    return (
      <div className={clsAlert}>
        <span className={clsIco}></span>
        <strong>{title}: </strong> {this.props.message}

        {this.renderExtra()}
      </div>
    )
  }
}))
