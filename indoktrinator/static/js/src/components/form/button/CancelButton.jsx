import * as React from 'react'
import {FormattedMessage} from 'react-intl'

export var CancelButton = React.createClass({
  render() {
    return (
      <button className='btn btn-danger pull-right'
        onClick={this.props.handler}>
        <FormattedMessage
          id="app.buttons.cancel"
          description="Cancel button"
          defaultMessage="Cancel"
        />
      </button>)
  }
})
