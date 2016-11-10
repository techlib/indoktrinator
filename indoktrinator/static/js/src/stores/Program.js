'use strict'

import * as Reflux from "reflux";
import {ProgramActions, FeedbackActions} from "../actions";
import {ErrorMixin} from "./Mixins";
import {StoreTypes} from "./StoreTypes";

export var ProgramStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [ProgramActions],
  data: {'program': [], 'list': [], 'errors': []},

  onRead(uuid, callbackDone) {
    $.ajax({
      url: `/api/program/${uuid}`,
      success: result => {
        this.data.errors = []
        this.data.program = result
        this.data.program.state = StoreTypes.LOADED
        this.trigger(this.data)
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onDelete(id, callbackDone) {
    $.ajax({
      url: `/api/program/${id}`,
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
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },


  onUpdate(program, callbackDone) {
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
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onCreate(program, callbackDone) {
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
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onList(callbackDone) {
    $.ajax({
      url: '/api/program/', success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  }
})
