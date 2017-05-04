'use strict'

import * as Reflux from 'reflux'
import {UserInfoActions} from '../actions'
import {ErrorMixin, Api} from './Mixins'

export var UserStore = Reflux.createStore({
  mixins: [ErrorMixin, Api],
  listenables: [UserInfoActions],
  data: {'user': {}},

  onRead(uuid) {
    this.req('GET', `/api/user-info`,
             {dest: 'user', action: UserInfoActions.read})
  },

})
