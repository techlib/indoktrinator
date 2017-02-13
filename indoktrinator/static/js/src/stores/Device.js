'use strict'

import * as Reflux from 'reflux'
import {DeviceActions, FeedbackActions} from '../actions'
import {Api} from './Mixins'
import {StoreTypes} from './StoreTypes'
import {API_URL} from './config'
import request from 'superagent'

export var DeviceStore = Reflux.createStore({
  mixins: [Api],
  listenables: [DeviceActions],
  data: {'device': [], 'list': [], 'errors': []},

  onRead(id) {
    this.req('GET', `${API_URL}/api/device/${id}`,
             {action: DeviceActions.read, dest: 'device',
               modifyResponse: (data) => {
                  data.state = StoreTypes.LOADED
                  return data
               }})
  },

  onDelete(id) {
    this.req('DELETE', `${API_URL}/api/device/${id}`,
             {action: DeviceActions.delete})
  },

  onUpdate(device) {
    this.req('PATCH', `${API_URL}/api/device/${device.id}`,
             {data: device, action: DeviceActions.update})
  },

  onCreate(device) {
    this.req('POST', `${API_URL}/api/device/`,
             {data: device, action: DeviceActions.create})
  },

  onList() {
    this.req('GET', `${API_URL}/api/device/?depth=1`,
             {action: DeviceActions.list, dest: 'list'})
  },

  onSetImage(image, device_id) {
      var req = request.put(`${API_URL}/api/preview-image/device/${device_id}`)
      req.send(image)
      req.end((data) => {
        DeviceActions.setImage.completed(data)
      })
  }
})
