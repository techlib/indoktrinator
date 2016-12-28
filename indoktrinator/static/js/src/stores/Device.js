'use strict'

import * as Reflux from "reflux"
import {DeviceActions, FeedbackActions} from "../actions"
import {ErrorMixin} from "./Mixins"
import {StoreTypes} from "./StoreTypes"
import {API_URL} from './config'

export var DeviceStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [DeviceActions],
  data: {'device': [], 'list': [], 'errors': []},

  onRead(id, callbackDone) {
    $.ajax({
      url: `${API_URL}/api/device/${id}`,
      success: result => {
        this.data.errors = []
        this.data.device = result
        this.data.device.state = StoreTypes.LOADED
        this.trigger(this.data)
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') {
        if (typeof callbackDone === 'function') { callbackDone() }
      }
    })
  },

  onDelete(id, callbackDone) {
    $.ajax({
      url: `${API_URL}/api/device/${id}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        FeedbackActions.set('success', 'Program deleted')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') {
        if (typeof callbackDone === 'function') { callbackDone() }
      }
    })
  },


  onUpdate(device, callbackDone) {
    $.ajax({
      url: `${API_URL}/api/device/${device.id}`,
      method: 'PATCH',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(device),
      success: function success(result) {
        FeedbackActions.set('success', 'Device updated')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone() }
    })
  },

  onCreate(device, callbackDone) {
    $.ajax({
      url: `${API_URL}/api/device/`,
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(device),
      success: function success(result) {
        FeedbackActions.set('success', 'Device created')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone() }
    })
  },

  onList(callbackDone) {
    $.ajax({
      url: `${API_URL}/api/device/`, success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone() }
    })
  }
})
