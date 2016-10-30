import * as React from "react";
import {AdminNavBar} from "./AdminNavBar";
import {IntlProvider} from "react-intl";

export var App = React.createClass({
  render() {
    return <IntlProvider locale="en">
      <div>
        <AdminNavBar />
        {this.props.children}
      </div>
    </IntlProvider>
  }
});
