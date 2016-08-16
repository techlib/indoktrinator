import * as Reflux from 'reflux-core'

export var DeviceActions = Reflux.createActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var EventActions = Reflux.createActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var ItemActions = Reflux.createActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var PlaylistActions = Reflux.createActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var ProgramActions = Reflux.createActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var SegmentActions = Reflux.createActions([
  'create', 'read', 'update', 'delete', 'list'
])

export var FeedbackActions = Reflux.createActions([
    'clear', 'set'
])

export var UserInfoActions = Reflux.createActions([
    'read'
])
