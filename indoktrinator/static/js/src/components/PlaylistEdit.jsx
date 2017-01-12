import * as React from 'react'
import * as Reflux from 'reflux'
import {PlaylistCreator} from './PlaylistCreator'
import {PlaylistDetail} from './PlaylistDetail'
import {PlaylistActions, FileActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import {FileStore} from '../stores/File'
import {StoreTypes} from './../stores/StoreTypes'
import {Types} from './PlaylistCreator/Types'
import {v4 as uuid} from 'uuid'

export function getItems(playlist) {
  console.log('moo', playlist)
  return playlist.items.map(item => {
    return {
      uuid: item.uuid,
      hide: false,
      file: item.file,
      duration: item.duration,
      _type: Types.ITEM,
    }
  })
}

export var PlaylistEdit = React.createClass({

  mixins: [
    Reflux.connect(PlaylistStore, 'playlist'),
    Reflux.connect(FileStore, 'file')
  ],

  componentDidMount() {
    PlaylistActions.read(this.props.params.uuid)
    PlaylistActions.list()
    FileActions.list()
  },

  getInitialState() {
    return {
      playlist: {list: [], playlist: {items: [], system: true}},
      file: {list: []}
    }
  },

  render() {
    console.log(this.state.playlist.playlist.system)
    return <div>{this.state.playlist.playlist.system ?
       <PlaylistDetail
         uuid={this.state.playlist.playlist.uuid}
         name={this.state.playlist.playlist.name}
         items={this.state.playlist.playlist.items}
       />
     : <PlaylistCreator
       playlist={this.state.playlist}
       files={this.state.file.list}
       items={getItems(this.state.playlist.playlist)}
     />}</div>
  }
})
