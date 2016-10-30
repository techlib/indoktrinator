import * as React from "react";
import * as Reflux from "reflux";
import {Device} from "./Device";
import {DeviceActions, ProgramActions, FileActions} from "../actions";
import {ProgramStore} from "../stores/Program";
import {DeviceStore} from "../stores/Device";
import {FileStore} from "../stores/File";
import {hashHistory as BrowserHistory} from 'react-router'
import {guid} from "../util/database";

export var DeviceNew = React.createClass({

  mixins: [
    Reflux.connect(DeviceStore, 'device'),
    Reflux.connect(ProgramStore, 'program'),
    Reflux.connect(FileStore, 'file')
  ],

  componentDidMount() {
    ProgramActions.list()
    FileActions.list()
  },

  handleSave(data) {
    DeviceActions.create(data)
    BrowserHistory.push('/device/' + data.id)
  },

  getInitialState() {
    return {
      device: {id: '', state: 'New'},
      program: {list: []},
      file: {list: []}
    }
  },

  render() {
    return (
      <Device
        device={this.state.device}
        program={this.state.program.list}
        file={this.state.file.list}
        title='New device'
        saveHandler={this.handleSave}
      />
    )
  }

})
