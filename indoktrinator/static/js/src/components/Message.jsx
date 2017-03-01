import * as React from 'react'
import classNames from 'classnames'
import {translate} from 'react-i18next'
import {Icon} from './Icon'

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
      icon = 'ok'
    } else if (this.props.type == 'error') {
      cls = 'alert-danger'
      title = t('messages:labels.error')
      icon = 'error-circle-o'
    }

    var clsAlert = classNames('alert', cls)

    return (
      <div className={clsAlert}>
        <Icon pf={icon} />
        <strong>{title}: </strong> {this.props.message}

        {this.renderExtra()}
      </div>
    )
  }
}))
