import * as React from "react";
import * as Reflux from "reflux";
import {Device} from "./Device";
import {DeviceActions, ProgramActions} from "../actions";
import {ProgramStore} from "../stores/Program";
import {DeviceStore} from "../stores/Device";
import {hashHistory as BrowserHistory} from "react-router";

export var DeviceEdit = React.createClass({

  mixins: [
    Reflux.connect(DeviceStore, 'device'),
    Reflux.connect(ProgramStore, 'program')
  ],

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
    DeviceActions.update(data, () => {
      this.setState({device: {device: data}});
    });
  },

  handleDelete(id) {
    DeviceActions.delete(id, () => {
      BrowserHistory.push('/device/');
    });
  },

  render() {
    return (
      <Device
        device={this.state.device.device}
        program={this.state.program.list}
        title={this.state.device.device.name}
        saveHandler={this.handleSave}
        deleteHandler={this.handleDelete}
      />
    )
  }
})

