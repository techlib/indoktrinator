import * as ReactDOM from 'react-dom'
import * as React from 'react'
import {Router, Route, hashHistory, IndexRedirect} from 'react-router'
import {App} from './App'
import {Dhcp} from './Dhcp'
import {Domain} from './Domain'
import {DomainDetail} from './DomainDetail'
import {DomainEdit} from './DomainEdit'
import {NetworkAclList} from './NetworkAclList'
import {NetworkAclEdit} from './NetworkAclEdit'
import {NetworkList} from './NetworkList'
import {NetworkNew} from './NetworkNew'
import {NetworkEdit} from './NetworkEdit'
import {DeviceList} from './DeviceList'
import {DeviceNew} from './DeviceNew'
import {DeviceEdit} from './DeviceEdit'
import {RecordDetail} from './RecordDetail'
import {Record} from './Record'
import {Lease} from './Lease'
import {FeedbackActions} from '../actions'
import {TopologyList} from './TopologyList'

import {PlaylistList} from './PlaylistList'
import {PlaylistDetail} from './PlaylistDetail'
import {PlaylistCreator} from './PlaylistCreator'

function onRouterUpdate() {
    FeedbackActions.clear()
}

ReactDOM.render((
  <Router onUpdate={onRouterUpdate} history={hashHistory}>
    <Route path="/" component={App}>
        <IndexRedirect to="/device" />
        <Route path="/device" component={DeviceList} />
        <Route path="/device/new" component={DeviceNew} />
        <Route path="/device/:id" component={DeviceEdit} />
        <Route path="/program" component={Domain} />
        <Route path="/program/:id" component={DomainDetail} />
        <Route path="/event/" component={DomainEdit} />
        <Route path="/event/:id" component={NetworkAclList} />
        <Route path="/playlist" component={PlaylistList} />
        <Route path="/playlist/new" component={PlaylistCreator} />
        <Route path="/playlist/:id" component={PlaylistDetail} />
    </Route>
  </Router>
 ), document.getElementById('AdminatorApp')
)
