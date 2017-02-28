import * as React from 'react'
import classNames from 'classnames'

export var Icon = React.createClass({

  render() {
    var cls = []

    if (this.props.fa) {
      cls.push('fa', `fa-${this.props.fa}`)
    } else if (this.props.pf) {
      cls.push('pficon', `pficon-${this.props.pf}`)
    } else if (this.props.glyph) {
      cls.push('glyphicon', `glyphicon-${this.props.glyph}`)
    }

    if (this.props.className) {
      cls.push(this.props.className)
    }

    var classes = classNames(cls)
    return <span className={classes}></span>
  },

})
