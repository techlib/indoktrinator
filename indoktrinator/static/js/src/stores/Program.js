'use strict'

import * as Reflux from 'reflux'
import {ProgramActions, FeedbackActions} from '../actions'
import {ErrorMixin, Api} from './Mixins'
import {StoreTypes} from './StoreTypes'
import {API_URL} from './config'
import * as _ from 'lodash'

export var ProgramStore = Reflux.createStore({
  mixins: [ErrorMixin, Api],
  listenables: [ProgramActions],
  data: {'program': [], 'list': [], 'errors': []},


  processSegments(data) {
    var segments = [[],[],[],[],[],[],[]]

    _.each(data.segments, (item) => {
      item.duration = item.range[1] - item.range[0]
      item.empty = false
      segments[item.day].push(item)
    })

    _.each(segments, (items, index) => {
      segments[index] = _.sortBy(items, [(o) => {return o.range[0]}]);
    })

    data.segments = segments
    return data
  },

  onRead(uuid) {
    this.req('GET', `${API_URL}/api/program/${uuid}?depth=3`,
             {dest: 'program', action: ProgramActions.read,
              modifyResponse: this.processSegments})
  },

  onDelete(id) {
    this.req('DELETE', `${API_URL}/api/program/${id}`,
             {action: ProgramActions.delete})
  },

  onUpdate(uuid, program) {
    this.req('PATCH', `${API_URL}/api/program/${uuid}`,
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
