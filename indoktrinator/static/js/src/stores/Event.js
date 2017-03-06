'use strict'

import * as Reflux from 'reflux'
import {EventActions} from '../actions'
import {ErrorMixin, Api} from './Mixins'

export var EventStore = Reflux.createStore({
  mixins: [ErrorMixin, Api],
  listenables: [EventActions],

  data: {},

  onDelete(id) {
    this.req('DELETE', `/api/event/${id}`,
             {action: EventActions.delete})
  },

  onUpdate(uuid, event) {
    this.req('PATCH', `/api/event/${uuid}`,
             {data: event, action: EventActions.update})
  },

  onCreate(event) {
    this.req('POST', `/api/event/`,
             {data: event, action: EventActions.create})
  },

})
