'use strict'

import * as Reflux from 'reflux'
import {EventActions} from '../actions'
import {ErrorMixin, Api} from './Mixins'
import {API_URL} from './config'

export var EventStore = Reflux.createStore({
  mixins: [ErrorMixin, Api],
  listenables: [EventActions],

  onDelete(id) {
    this.req('DELETE', `${API_URL}/api/event/${id}`,
             {action: EventActions.delete})
  },

  onUpdate(uuid, event) {
    this.req('PATCH', `${API_URL}/api/event/${uuid}`,
             {data: event, action: EventActions.update})
  },

  onCreate(event) {
    this.req('POST', `${API_URL}/api/event/`,
             {data: event, action: EventActions.create})
  },

})
