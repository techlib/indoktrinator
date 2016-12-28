import * as React from "react"
import {FormattedMessage} from "react-intl"

export var AddButton = React.createClass({
  render() {
    return (
      <button className='btn btn-danger pull-right'
        onClick={this.props.handler}>
        <FormattedMessage
          id="app.buttons.add"
          description="Add button"
          defaultMessage="Add"
        />
      </button>)
  }
})