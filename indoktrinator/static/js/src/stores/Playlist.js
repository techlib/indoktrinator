'use strict'

import * as Reflux from 'reflux'
import {PlaylistActions, FeedbackActions} from '../actions'
import {Api} from './Mixins'
import {StoreTypes} from './StoreTypes'
import {API_URL} from './config'

export var PlaylistStore = Reflux.createStore({
  mixins: [Api],
  listenables: [PlaylistActions],
  data: {'playlist': [], 'list': [], 'errors': []},

  onRead(uuid) {
    this.req('GET', `${API_URL}/api/playlist/${uuid}`,
             {action: PlaylistActions.read, dest: 'playlist',
              modifyResponse: (data) => {
                data.state = StoreTypes.LOADED
                return data
              }})
  },

  onDelete(id) {
    this.req('DELETE', `${API_URL}/api/playlist/${id}`,
             {action: PlaylistActions.delete})
  },

  onUpdate(playlist) {
    this.req('PATCH', `${API_URL}/api/playlist/${playlist.uuid}`,
             {data: playlist, action: PlaylistActions.update})
  },

  onCopy(uuid, callbackDone) {
    this.req('GET', `${API_URL}/api/playlist/${uuid}/copy`,
             {action: PlaylistActions.copy, dest: 'playlist',
              modifyResponse: (data) => {
                data.state = StoreTypes.LOADED
                return data
              }})
  },

  onCreate(playlist) {
		this.req('POST', `${API_URL}/api/playlist/`,
							{data: playlist, action: PlaylistActions.create})
  },

  onList() {
		this.req('GET', `${API_URL}/api/playlist/`,
							{action: PlaylistActions.list, dest: 'list'})
	}

})
