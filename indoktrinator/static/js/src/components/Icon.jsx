import * as React from 'react'

export var Icon = React.createClass({

  render() {
    if (this.props.fa) {
      return <span className={`fa fa-${this.props.fa}`}> </span>
    } else if (this.props.pf) {
      return <span className={`pficon pficon-${this.props.pf}`}> </span>
    } else if (this.props.glyph) {
      return <span className={`glyphicon glyphicon-${this.props.glyph}`}> </span>
    }

    return null
  },

})
