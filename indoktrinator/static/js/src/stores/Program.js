'use strict'

import * as Reflux from 'reflux'
import {ProgramActions, FeedbackActions} from '../actions'
import {ErrorMixin, Api} from './Mixins'
import {StoreTypes} from './StoreTypes'
import {API_URL} from './config'

export var ProgramStore = Reflux.createStore({
  mixins: [ErrorMixin, Api],
  listenables: [ProgramActions],
  data: {'program': [], 'list': [], 'errors': []},

  onRead(uuid) {
    this.req('GET', `${API_URL}/api/program/${uuid}`,
             {dest: 'program', action: ProgramActions.read,
              modifyResponse: (data) => {
                data.state = StoreTypes.LOADED
                return data
              }})
  },

  onDelete(id) {
    this.req('DELETE', `${API_URL}/api/program/${id}`,
             {action: ProgramActions.delete})
  },

  onUpdate(program) {
    this.req('PATCH', `${API_URL}/api/program/${program.uuid}`,
             {data: program, action: ProgramActions.update})
  },

  onCreate(program) {
    this.req('POST', `${API_URL}/api/program/`,
             {data: program, action: ProgramActions.create})
  },

  onList() {
    this.req('GET', `${API_URL}/api/program/`, {dest: 'list'})
  }

})
