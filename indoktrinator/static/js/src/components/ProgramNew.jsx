import * as React from "react";
import * as Reflux from "reflux";
import {Program} from "./Program";
import {ProgramActions} from "../actions";
import {hashHistory as BrowserHistory} from "react-router";
import {ProgramStore} from "../stores/Program";
import {guid} from "../util/database";

export var ProgramNew = React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program'),
  ],

  getInitialState() {
    return {program: {uuid: guid(), state: 'New'}}
  },

  handleSave(data) {
    ProgramActions.create(data);
    BrowserHistory.push('/program/' + data.uuid);
  },

  render() {
    return (
      <Program
        title='New Program'
        program={this.state.program}
        saveHandler={this.handleSave}
      />
    )
  }

})
