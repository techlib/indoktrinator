import * as React from 'react'
import * as Reflux from 'reflux'
import {ModalConfirmMixin} from './ModalConfirmMixin'
import {PlaylistActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import * as _ from 'lodash'
import moment from 'moment'
import 'moment-duration-format'

export var PlaylistDetail = React.createClass({

  mixins: [Reflux.connect(PlaylistStore, 'data'),
           ModalConfirmMixin],

  componentDidMount() {
    PlaylistActions.read(this.props.params.id)
  },

	getInitialState() {
       return {data: {playlist: {items: []}}}
  },

  iconClasses: {
    'video': 'fa-film',
    'image': 'fa-picture-o',
    'stream': 'fa-wifi fa-rotate-90',
    'website': 'fa-globe'
  },

  getTypeIcon(type) {
    return this.iconClasses[type];
  },

  render() {
    return (
      <div className='col-xs-12 container-fluid'>
            <h1>{this.state.data.playlist.name}</h1>


<div className="list-group list-view-pf list-view-pf-view playlist">


  {this.state.data.playlist.items.map((item) => {
    let cls = 'fa ' + this.getTypeIcon(item.type)
    return (


  <div className="list-group-item">
    <div className="list-view-pf-main-info">
      <div className="list-view-pf-left">
        <span className={cls}></span>
      </div>
      <div className="list-view-pf-body">
        <div className="list-view-pf-description">
          <div className="list-group-item-heading">
            {item.path}
          </div>
        </div>
        <div className="list-view-pf-additional-info">

					<div className="list-view-pf-additional-info-item">
            <img src="https://placekitten.com/80/45" alt="placeholder image" />
          </div>

          <div className="list-view-pf-additional-info-item">
            <span className="fa fa-clock-o"></span>
            {moment.duration(item.duration, 'seconds').format('m:ss', {trim: false})}
          </div>
        </div>
      </div>
    </div>
  </div>
)
})}
</div>
            </div>
    )
    }
})
