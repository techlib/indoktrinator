'use strict'

import * as Reflux from 'reflux'
import {PlaylistActions} from '../actions'
import {Api} from './Mixins'
import {StoreTypes} from './StoreTypes'
import {API_URL} from './config'

export var PlaylistStore = Reflux.createStore({
  mixins: [Api],
  listenables: [PlaylistActions],
  data: {'playlist': [], 'list': [], 'errors': []},

  onRead(uuid) {
    this.req('GET', `${API_URL}/api/playlist/${uuid}?depth=2`,
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

  onUpdate(uuid, playlist) {
    this.req('PATCH', `${API_URL}/api/playlist/${uuid}`,
             {data: playlist, action: PlaylistActions.update})
  },

  onCreate(playlist) {
		this.req('POST', `${API_URL}/api/playlist/`,
							{data: playlist, action: PlaylistActions.create})
  },

  onList() {
		this.req('GET', `${API_URL}/api/playlist/?depth=2`,
							{action: PlaylistActions.list, dest: 'list'})
	}

})
