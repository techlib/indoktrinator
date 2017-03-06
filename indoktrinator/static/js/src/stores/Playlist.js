'use strict'

import * as Reflux from 'reflux'
import {PlaylistActions} from '../actions'
import {Api} from './Mixins'
import {StoreTypes} from './StoreTypes'

export var PlaylistStore = Reflux.createStore({
  mixins: [Api],
  listenables: [PlaylistActions],
  data: {'playlist': [], 'list': [], 'errors': []},

  onRead(uuid) {
    this.req('GET', `/api/playlist/${uuid}?depth=2`,
             {action: PlaylistActions.read, dest: 'playlist',
              modifyResponse: (data) => {
                data.state = StoreTypes.LOADED
                return data
              }})
  },

  onDelete(id) {
    this.req('DELETE', `/api/playlist/${id}`,
             {action: PlaylistActions.delete})
  },

  onUpdate(uuid, playlist) {
    this.req('PATCH', `/api/playlist/${uuid}`,
             {data: playlist, action: PlaylistActions.update})
  },

  onCreate(playlist) {
		this.req('POST', `/api/playlist/`,
							{data: playlist, action: PlaylistActions.create})
  },

  onList() {
		this.req('GET', `/api/playlist/?depth=2`,
							{action: PlaylistActions.list, dest: 'list'})
	}

})
