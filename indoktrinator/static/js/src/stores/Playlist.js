'use strict'

import * as Reflux from 'reflux'
import {PlaylistActions, FeedbackActions} from '../actions'
import {ErrorMixin} from './Mixins'
import {hashHistory as BrowserHistory} from 'react-router'

export var PlaylistStore = Reflux.createStore({
  mixins: [ErrorMixin],
  listenables: [PlaylistActions],
  data: {'playlist': [], 'list': [], 'errors': []},

  onRead(id) {
    $.ajax({url: `/playlist/${id}`, 
      success: result => {
        this.data.errors = []
        this.data.playlist = result
        this.trigger(this.data)
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    })
  },

  onDelete(id) {
    $.ajax({
      url: `/playlist/${id}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        BrowserHistory.push('/playlist/')
        FeedbackActions.set('success', 'Playlist deleted')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    })
  },


  onUpdate(playlist) {
    $.ajax({
      url: `/playlist/${playlist.uuid}`,
      method: 'PATCH',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(playlist),
      success: function success() {
        BrowserHistory.push('/playlist/')
        FeedbackActions.set('success', 'Playlist updated')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }
    })
  },

  onCreate(playlist) {
    $.ajax({
      url: '/playlist/',
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(playlist),
      success: function success(result) {
        BrowserHistory.push('/playlist/' + result.id)
        FeedbackActions.set('success', 'Playlist created')
      },
      error: result => {
        FeedbackActions.set('error', result.responseJSON.message)
      }


      })
  },

  onList() {
    $.ajax({url: '/playlist/', success: result => {
        this.data.errors = []
        this.data.list = result.result
        this.trigger(this.data)
      }
    })
  }
})
