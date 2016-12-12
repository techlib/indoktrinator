'use strict'

import * as Reflux from "reflux";
import {SegmentActions, FeedbackActions} from "../actions";
import {ErrorMixin} from "./Mixins";
import {StoreTypes} from "./StoreTypes";
import {API_URL} from './config';

export var SegmentStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [SegmentActions],
  data: {'segment': [], 'list': [], 'errors': []},

  onRead(uuid, callbackDone) {
    $.ajax({
      url: `${API_URL}/api/segment/${uuid}`,
      success: result => {
        this.data.errors = []
        this.data.segment = result
        this.data.segment.state = StoreTypes.LOADED
        this.trigger(this.data)
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onDelete(uuid, callbackDone) {
    return $.ajax({
      url: `${API_URL}/api/segment/${uuid}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        FeedbackActions.set('success', 'Segment deleted')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },


  onUpdate(segment, callbackDone) {
    $.ajax({
      url: `${API_URL}/api/segment/${segment.uuid}`,
      method: 'PATCH',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(segment),
      success: function success(result) {
        FeedbackActions.set('success', 'Segment updated')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onCreate(segment, callbackDone) {
    $.ajax({
      url: `${API_URL}/api/segment/`,
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(segment),
      success: function success(result) {
        FeedbackActions.set('success', 'Segment created')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onList(callbackDone) {
    $.ajax({
      url: `${API_URL}/api/segment/`, success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  }
})
