import * as React from 'react'
import * as Reflux from 'reflux'
import {Device} from './Device'
import {DeviceActions, ProgramActions, FeedbackActions} from '../actions'
import {ProgramStore} from '../stores/Program'
import {hashHistory as BrowserHistory} from 'react-router'
import {StoreTypes} from './../stores/StoreTypes'

export var DeviceNew = React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program')
  ],

  componentDidMount() {
    ProgramActions.list()
  },

  handleSave(data) {
    delete data['preview']
    DeviceActions.create.triggerAsync(data).then(() => {
      DeviceActions.setImage.triggerAsync(data['photo'], data['id']).then(() => {
          BrowserHistory.push('/device/')
          FeedbackActions.set('success', 'Device created')
      })
    })
  },

  getInitialState() {
    return {
      device: {id: '', state: StoreTypes.NEW},
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
