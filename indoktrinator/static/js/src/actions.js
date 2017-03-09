import * as Reflux from 'reflux-core'
import RefluxPromise from 'reflux-promise'
import * as _ from 'lodash'
import Q from "q"

Reflux.use(RefluxPromise(Q.Promise))

// Simple helper to create actions with {asyncResult: true}
// Most of these actions call api anyway and it does nothing
// bad elsewhere.
function createAsyncActions(list) {
  var functions = {}
  _.each(list, (item) => {
    functions[item] = {asyncResult: true}
  })

  return Reflux.createActions(functions)
}

export var DeviceActions = createAsyncActions([
  'create', 'read', 'update', 'delete', 'list', 'setImage', 'resetImage'
])

export var EventActions = createAsyncActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var ItemActions = createAsyncActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var PlaylistActions = createAsyncActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var ProgramActions = createAsyncActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var SegmentActions = createAsyncActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var FeedbackActions = Reflux.createActions([
    'clear', 'set'
])

export var UserInfoActions = createAsyncActions([
    'read'
])

export var FileActions = createAsyncActions([
  'read', 'list'
])
