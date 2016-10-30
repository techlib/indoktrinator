import * as React from "react";
import {Device} from "./Device";
import {DeviceActions, ProgramActions} from "../actions";
import {ProgramStore} from "../stores/Program";
import {DeviceStore} from "../stores/Device";
import {hashHistory as BrowserHistory} from "react-router";

export var DeviceEdit = React.createClass({

  componentDidMount() {
    DeviceActions.read(this.props.params.id)
    ProgramActions.list()
  },

  getInitialState() {
    return {
      device: {device: {}},
      program: {list: []},
      file: {list: []}
    }
  },

  handleSave(data) {
    DeviceActions.update(data)
    this.state.device.device = data
    BrowserHistory.push('/device/' + data.id)
  },

  handleDelete(id) {
    DeviceActions.delete(id)
    BrowserHistory.push('/device/');
  },

  render() {
    return (
      <Device
        device={this.state.device.device}
        program={this.state.program.list}
        file={this.state.file.list}
        title={this.state.device.device.name}
        saveHandler={this.handleSave}
        deleteHandler={this.handleDelete}
      />
    )
  }
})

