'use strict'

import * as Reflux from "reflux";
import {PlaylistActions, FeedbackActions} from "../actions";
import {ErrorMixin} from "./Mixins";

export var PlaylistStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [PlaylistActions],
  data: {'playlist': [], 'list': [], 'errors': []},

  onRead(uuid, callbackDone) {
    $.ajax({
      url: `/api/playlist/${uuid}`,
      success: result => {
        this.data.errors = []
        this.data.playlist.state = 'Loaded'
        this.data.playlist = result
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
      url: `/api/playlist/${id}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        FeedbackActions.set('success', 'Playlist deleted')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onUpdate(playlist, callbackDone) {
    $.ajax({
      url: `/api/playlist/${playlist.uuid}`,
      method: 'PATCH',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(playlist),
      success: function success() {
        FeedbackActions.set('success', 'Playlist updated')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onCopy(uuid, callbackDone) {
    $.ajax({
      url: `/api/playlist/${uuid}/copy`,
      success: result => {
        this.data.errors = []
        this.data.playlist.state = 'Loaded'
        this.data.playlist = result
        this.trigger(this.data)
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  },

  onCreate(playlist, callbackDone) {
    $.ajax({
      url: '/api/playlist/',
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(playlist),
      success: function success(result) {
        FeedbackActions.set('success', 'Playlist created')
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
      url: '/api/playlist/', success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    }).done(() => {
      if (typeof callbackDone === 'function') { callbackDone(); }
    })
  }
})
