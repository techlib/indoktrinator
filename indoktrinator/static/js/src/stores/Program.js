'use strict'

import * as Reflux from 'reflux'
import {ProgramActions} from '../actions'
import {ErrorMixin, Api} from './Mixins'
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
      segments[index] = _.sortBy(items, [(o) => {return o.range[0]}])
    })

    data.segments = segments
    return data
  },

  onRead(uuid) {
    this.req('GET', `/api/program/${uuid}?depth=3`,
             {dest: 'program', action: ProgramActions.read,
              modifyResponse: this.processSegments})
  },

  onDelete(id) {
    this.req('DELETE', `/api/program/${id}`,
             {action: ProgramActions.delete})
  },

  onUpdate(uuid, program) {
    this.req('PATCH', `/api/program/${uuid}`,
             {data: program, action: ProgramActions.update})
  },

  onCreate(program) {
    this.req('POST', `/api/program/`,
             {data: program, action: ProgramActions.create})
  },

  onList() {
    this.req('GET', `/api/program/?depth=1`,
             {action: ProgramActions.list, dest: 'list'})
  }

})
