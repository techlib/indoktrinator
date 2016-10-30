'use strict'

import * as Reflux from 'reflux'
import {ProgramActions, FeedbackActions} from '../actions'
import {ErrorMixin} from './Mixins'

export var ProgramStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [ProgramActions],
  data: {'program': [], 'list': [], 'errors': []},

  onRead(uuid) {
    $.ajax({url: `/api/program/${uuid}`,
      success: result => {
        this.data.errors = []
        this.data.program = result
        this.data.program.state = 'Loaded'
        this.trigger(this.data)
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    })
  },

  onDelete(id) {
    $.ajax({
      url: `/api/program/${id}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        BrowserHistory.push('/program/')
        FeedbackActions.set('success', 'Program deleted')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    })
  },


  onUpdate(program) {
    $.ajax({
      url: `/api/program/${program.uuid}`,
      method: 'PATCH',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(program),
      success: function success(result) {
        FeedbackActions.set('success', 'Program updated')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    })
  },

  onCreate(program) {
    $.ajax({
      url: '/api/program/',
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(program),
      success: function success(result) {
        FeedbackActions.set('success', 'Program created')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
      })
  },

  onList() {
    $.ajax({url: '/api/program/', success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    })
  }
})
