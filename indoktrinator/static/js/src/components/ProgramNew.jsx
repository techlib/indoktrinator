import * as React from 'react'
import * as Reflux from 'reflux'
import {Program} from './Program'
import {PlaylistActions, ProgramActions, FeedbackActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import {hashHistory as BrowserHistory} from 'react-router'
import {guid} from '../util/database'

export var ProgramNew = React.createClass({

  mixins: [
    Reflux.connect(PlaylistStore, 'playlist')
  ],

  componentDidMount() {
    PlaylistActions.list()
  },

  getInitialState() {
    return {
      program: {program: {uuid: guid(), state: 'New'}},
      playlist: {list: []},
      segment: {list: []},
      event: {list: []}
    }
  },

  handleSave(data) {
    ProgramActions.create.triggerAsync(data)
    .then((data) => {
      BrowserHistory.push('/program/' + data.uuid)
      FeedbackActions.set('success', 'Program created')
    })
  },

  render() {
    return (
      <Program
        title='New Program'
        program={this.state.program.program}
        segment={[]}
        event={[]}
        playlist={this.state.playlist.list}
        saveHandler={this.handleSave}
      />)
  }

})
