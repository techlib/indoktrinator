import * as React from 'react'
import * as Reflux from 'reflux'
import {Device} from './Device'
import {DeviceActions, ProgramActions, FeedbackActions} from '../actions'
import {ProgramStore} from '../stores/Program'
import {DeviceStore} from '../stores/Device'
import {hashHistory as BrowserHistory} from 'react-router'
import {confirmModal} from './ModalConfirmMixin'
import {translate} from 'react-i18next'

export var DeviceEdit = translate(['device','common'])(React.createClass({

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
      program: {list: []}
    }
  },

  handleSave(data) {
    delete data['preview']
    delete data['state']

    const {t} = this.props

    var updatePromise = DeviceActions.update.triggerAsync(data)
    var imagePromise = DeviceActions.setImage.triggerAsync(data['photo'], data['id'])
    Promise.all([updatePromise, imagePromise]).then(() => {
      DeviceActions.read(this.props.params.id)
      FeedbackActions.set('success', t('device:alerts.update'))
    })
  },

  handleDelete(id) {
    const {t} = this.props

    confirmModal(
      t('confirm.areyousure'),
      t('device:confirm.delete', {name: this.state.device.device.name})
    ).then(() => {
      DeviceActions.delete.triggerAsync(id)
      .then(() => {
        BrowserHistory.push('/device/')
        FeedbackActions.set('success', t('device:alerts.delete'))
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
}))

