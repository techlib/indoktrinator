import * as React from "react";
import {FormattedMessage} from "react-intl";

export var DeleteButton = React.createClass({
  render() {
    if (this.props.id) {
      return (
        <button className='btn btn-danger pull-left'
          onClick={this.props.handler}>
          <FormattedMessage
            id="app.buttons.delete"
            description="Delete button"
            defaultMessage="Delete"
          />
        </button>);
    } else {
      return null;
    }
  }
})
