import * as React from "react";

export var LocaleSwitcher = React.createClass({

  getInitialState() {
    return {}
  },

  handleChangeLang(e) {
    this.props.changeLocaleHandler(e.target.value)
  },

  render() {
    return (<select defaultValue={this.state.defaultLanguage} onChange={this.handleChangeLang}>
      {this.props.languages.map((item) => {
        return <option>{item}</option>
      })}
    </select>);
  }
});
