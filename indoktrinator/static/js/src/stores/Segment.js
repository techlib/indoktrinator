'use strict'

import * as Reflux from 'reflux'
import {SegmentActions, FeedbackActions} from '../actions'
import {ErrorMixin} from './Mixins'

export var SegmentStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [SegmentActions],
  data: {'segment': [], 'list': [], 'errors': []},

  onRead(uuid) {
    $.ajax({url: `/api/segment/${uuid}`,
      success: result => {
        this.data.errors = []
        this.data.segment = result
        this.data.segment.state = 'Loaded'
        this.trigger(this.data)
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    })
  },

  onDelete(uuid) {
    $.ajax({
      url: `/api/segment/${uuid}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        FeedbackActions.set('success', 'Segment deleted')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    })
  },


  onUpdate(segment) {
    $.ajax({
      url: `/api/segment/${segment.uuid}`,
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
    })
  },

  onCreate(segment) {
    $.ajax({
      url: '/api/segment/',
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


      })
  },

  onList() {
    $.ajax({url: '/api/segment/', success: result => {
      this.data.errors = []
    this.data.list = result.result
    this.trigger(this.data)
  }
  })
}})
