import * as React from 'react'
import classNames from 'classnames'

export var Spinner = React.createClass({

  render() {

    var cls = classNames('spinner', {
      'spinner-lg': this.props.lg,
      'spinner-sm': this.props.sm,
      'spinner-xs': this.props.xs,
      'spinner-inline': this.props.inline
    })

    if (!this.props.inline) {
      return (
        <div style={{marginTop: 50, marginBottom: 50}} className={cls}></div>
      )
    } else {
      return <span className={cls}></span>
    }
  }

})
