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

    var cls, icon

    if (this.props.type == 'success') {
      cls = 'alert-success'
      icon = 'ok'
    } else if (this.props.type == 'error') {
      cls = 'alert-danger'
      icon = 'error-circle-o'
    } else if (this.props.type == 'warning') {
      cls = 'alert-warning'
      icon = 'warning-triangle-o'
    }

    var clsAlert = classNames('alert', cls)

    return (
      <div className={clsAlert}>
          <Icon pf={icon} />
          {this.props.message}
          {this.renderExtra()}
      </div>
    )
  }
}))
