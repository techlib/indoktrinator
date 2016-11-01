'use strict'

import * as Reflux from "reflux";
import {EventActions, FeedbackActions} from "../actions";
import {ErrorMixin} from "./Mixins";

export var EventStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [EventActions],
  data: {'event': [], 'list': [], 'errors': []},

  onRead(uuid, callbackDone) {
    $.ajax({
      url: `/api/event/${uuid}`,
      success: result => {
        this.data.errors = []
        this.data.event = result
        this.data.event.state = 'Loaded'
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
    $.ajax({
      url: `/api/event/${uuid}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        FeedbackActions.set('success', 'Event deleted')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },


  onUpdate(event, callbackDone) {
    $.ajax({
      url: `/api/event/${event.uuid}`,
      method: 'PATCH',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(event),
      success: function success(result) {
        FeedbackActions.set('success', 'Event updated')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onCreate(event, callbackDone) {
    $.ajax({
      url: '/api/event/',
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(event),
      success: function success(result) {
        FeedbackActions.set('success', 'Event created')
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
      url: '/api/event/', success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    });
  }
})
