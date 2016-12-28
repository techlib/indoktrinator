import * as React from "react"
import {FormattedMessage} from "react-intl"

export var RemoveButton = React.createClass({
  render() {
    if (this.props.id) {
      return (
        <button className='btn btn-danger pull-right'
          onClick={this.props.handler}>
          <FormattedMessage
            id="app.buttons.remove"
            description="Remove button"
            defaultMessage="Remove"
          />
        </button>)
    } else {
      return null
    }
  }
})