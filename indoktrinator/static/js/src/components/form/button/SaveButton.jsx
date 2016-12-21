import * as React from "react";
import {FormattedMessage} from "react-intl";

export var SaveButton = React.createClass({
  render() {
    return (
      <button className='btn btn-primary'
        onClick={this.props.handler}>
        <FormattedMessage
          id="app.buttons.save"
          description="Save button"
          defaultMessage="Save"
        />
      </button>);
  }
})
