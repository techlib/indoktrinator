'use strict'

import * as Reflux from "reflux";
import {FileActions, FeedbackActions} from "../actions";
import {ErrorMixin} from "./Mixins";

export var FileStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [FileActions],
  data: {'file': [], 'list': [], 'errors': []},

  onRead(uuid, callbackDone) {
    $.ajax({
      url: `/api/file/${uuid}`,
      success: result => {
        this.data.errors = []
        this.data.file.state = 'Loaded'
        this.data.file = result
        this.trigger(this.data)
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
      url: '/api/file/', success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  }
})
