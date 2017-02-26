import * as ReactDOM from 'react-dom'
import * as React from 'react'
import {Router, Route, hashHistory, IndexRedirect, IndexRoute} from 'react-router'
import {App} from './App'
import {DeviceList} from './DeviceList'
import {DeviceNew} from './DeviceNew'
import {DeviceEdit} from './DeviceEdit'
import {FeedbackActions} from '../actions'
import {PlaylistList} from './PlaylistList'
import {PlaylistNew} from './PlaylistNew'
import {PlaylistEdit} from './PlaylistEdit'
import {ProgramList} from './ProgramList'
import {Program} from './Program'
import {ProgramNew} from './ProgramNew'
import {ProgramEdit} from './ProgramEdit'
import {ProgramEventList} from './ProgramEventList'
import {ProgramEventNew} from './ProgramEventNew'
import {ProgramEventEdit} from './ProgramEventEdit'

function onRouterUpdate() {
  FeedbackActions.clear()
}

ReactDOM.render((
    <Router onUpdate={onRouterUpdate} history={hashHistory}>
      <Route path="/" component={App}>
        <IndexRedirect to="/device"/>
        <Route path="/device" component={DeviceList}/>
        <Route path="/device/new" component={DeviceNew}/>
        <Route path="/device/:id" component={DeviceEdit}/>
        <Route path="/program" component={ProgramList}/>
        <Route path="/program/new" component={ProgramNew}/>
        <Route path="/program/:uuid" component={Program}>
          <IndexRoute component={ProgramEdit}
            eventView={false} simpleHeader={false} />
          <Route path="event" component={ProgramEventList}
            eventView={true} simpleHeader={false} />
          <Route path="event/new" component={ProgramEventNew}
            eventView={true} simpleHeader={true} />
          <Route path="event/:event" component={ProgramEventEdit}
            eventView={true} simpleHeader={true}/>
        </Route>
        <Route path="/playlist" component={PlaylistList}/>
        <Route path="/playlist/new" component={PlaylistNew}/>
        <Route path="/playlist/:uuid" component={PlaylistEdit}/>
      </Route>
    </Router>
  ), document.getElementById('AdminatorApp')
)
