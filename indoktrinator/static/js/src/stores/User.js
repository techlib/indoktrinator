'use strict'

import * as Reflux from "reflux"
import {UserActions} from "../actions"
import {API_URL} from './config'

export var UserStore = Reflux.createStore({
  listenables: [UserActions],
  data: {'user': [], 'list': []},

  onRead(id) {
    $.ajax({
      url: `${API_URL}/api/user/${id}`, success: result => {
        this.data.user = result
        this.trigger(this.data)
      }
    })
  },

  onDelete(id) {
    var _this = this
    $.ajax({
      url: `${API_URL}/api/user/${id}`,
      method: 'DELETE',
      dataType: 'json',
      contentType: 'application/json',
      success: () => {
        _this.onList()
      }
    })
  },


  onUpdate(user) {
    $.ajax({
      url: `${API_URL}/api/user/${user.id}`,
      method: 'PUT',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(user)
    })
  },

  onCreate(user) {
    var _this = this
    $.ajax({
      url: `${API_URL}/api/user/`,
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(user),
      success: () => {
        _this.onList()
      }
    })
  },

  onList() {
    $.ajax({
      url: `${API_URL}/api/user/`, success: result => {
        this.data.list = result.result
        this.trigger(this.data)
      }
    })
  }
})
