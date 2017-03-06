'use strict'

import * as Reflux from 'reflux'
import {DeviceActions} from '../actions'
import {Api} from './Mixins'
import {StoreTypes} from './StoreTypes'
import request from 'superagent'

export var DeviceStore = Reflux.createStore({
  mixins: [Api],
  listenables: [DeviceActions],
  data: {'device': [], 'list': [], 'errors': []},

  onRead(id) {
    this.req('GET', `/api/device/${id}`,
             {action: DeviceActions.read, dest: 'device',
               modifyResponse: (data) => {
                  data.state = StoreTypes.LOADED
                  return data
               }})
  },

  onDelete(id) {
    this.req('DELETE', `/api/device/${id}`,
             {action: DeviceActions.delete})
  },

  onUpdate(device) {
    this.req('PATCH', `/api/device/${device.id}`,
             {data: device, action: DeviceActions.update})
  },

  onCreate(device) {
    this.req('POST', `/api/device/`,
             {data: device, action: DeviceActions.create})
  },

  onList() {
    this.req('GET', `/api/device/?depth=1`,
             {action: DeviceActions.list, dest: 'list'})
  },

  onSetImage(image, device_id) {
    if(image instanceof File) {
      var req = request.put(`/api/preview-image/device/${device_id}`)
      req.send(image)
      req.end((data) => {
        DeviceActions.setImage.completed(data)
      })
    } else {
        DeviceActions.setImage.completed()
    }
  },

  onResetImage(id) {
    this.req('RESET', `/api/preview-image/device/${id}`,
             {action: DeviceActions.resetImage})
  }
})
