import * as React from 'react'
import * as Reflux from 'reflux'
import {Device} from './Device'
import {DeviceActions, ProgramActions, FeedbackActions} from '../actions'
import {ProgramStore} from '../stores/Program'
import {DeviceStore} from '../stores/Device'
import {hashHistory as BrowserHistory} from 'react-router'
import {confirmModal} from './ModalConfirmMixin'

export var DeviceEdit = React.createClass({

  mixins: [
    Reflux.connect(DeviceStore, 'device'),
    Reflux.connect(ProgramStore, 'program')
  ],

  componentWillReceiveProps(p) {
    this.setState({
      uuid: p.playlist.playlist.uuid,
      name: p.playlist.playlist.name,
      title: p.playlist.playlist.name,
      playlist: {list: p.playlist.list, playlist: {}},
      file: {list: p.file, file: {}}
    })
  },

  componentDidMount() {
    DeviceActions.read(this.props.params.id)
    ProgramActions.list()
  },

  getInitialState() {
    return {
      device: {device: {}},
      program: {list: []}
    }
  },

  handleSave(data) {
    delete data['preview']
    delete data['state']

    DeviceActions.update.triggerAsync(data)
    .then(() => {
      DeviceActions.read(this.props.params.id)
      FeedbackActions.set('success', 'Device updated')
    })
  },

  handleDelete(id) {
    confirmModal(
      'Are you sure?',
      'Would you like to remove device?'
    ).then(() => {
      DeviceActions.delete.triggerAsync(id)
      .then(() => {
        BrowserHistory.push('/device/')
        FeedbackActions.set('success', 'Device deleted')
      })
    })
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

