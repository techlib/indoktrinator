import * as React from "react"
import * as Reflux from "reflux"
import {Device} from "./Device"
import {DeviceActions, ProgramActions} from "../actions"
import {ProgramStore} from "../stores/Program"
import {hashHistory as BrowserHistory} from 'react-router'

export var DeviceNew = React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program')
  ],

  componentDidMount() {
    ProgramActions.list()
  },

  handleSave(data) {
    delete data['preview']
    DeviceActions.create(data, () => {
      BrowserHistory.push('/device/')
    })
  },

  getInitialState() {
    return {
      device: {id: '', state: 'New'},
      program: {list: []}
    }
  },

  render() {
    return (
      <Device
        device={this.state.device}
        program={this.state.program.list}
        title='New device'
        saveHandler={this.handleSave}
      />
    )
  }

})
