'use strict'

import * as Reflux from "reflux";
import {ItemActions, FeedbackActions} from "../actions";
import {ErrorMixin} from "./Mixins";

export var ItemStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [ItemActions],
  data: {'item': [], 'list': [], 'errors': []},

  onRead(uuid, callbackDone) {
    $.ajax({
      url: `/api/item/${uuid}`,
      success: result => {
        this.data.errors = []
        this.data.item.state = 'Loaded'
        this.data.item = result
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
      url: `/api/item/${uuid}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        BrowserHistory.push('/item/')
        FeedbackActions.set('success', 'Item deleted')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },


  onUpdate(item, callbackDone) {
    $.ajax({
      url: `/api/item/${item.uuid}`,
      method: 'PATCH',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(item),
      success: function success(result) {
        FeedbackActions.set('success', 'Item updated')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onCreate(item, callbackDone) {
    $.ajax({
      url: '/api/item/',
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(item),
      success: function success(result) {
        FeedbackActions.set('success', 'Item created')
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
      url: '/api/item/', success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  }
})
