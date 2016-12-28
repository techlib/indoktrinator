import * as React from 'react'
import * as Reflux from 'reflux'
import {ModalConfirmMixin} from './ModalConfirmMixin'
import {PlaylistActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import moment from 'moment'
import {Types} from './PlaylistCreator/Types'
import {StoreTypes} from './../stores/StoreTypes'
import {add3Dots} from './../util/string'

export var PlaylistDetail = React.createClass({

  mixins: [
    Reflux.connect(PlaylistStore, 'data'),
    ModalConfirmMixin
  ],

  componentDidMount() {
    PlaylistActions.read(this.props.uuid)
  },

  getInitialState() {
    return {data: {playlist: {items: []}}}
  },

  getItems() {
    var items = []
    var playlist = this.state.data.playlist

    playlist.items.forEach((item) => {
      items.push({
        uuid: item.uuid,
        type: Types.SYNTH_ITEM,
        state: StoreTypes.LOADED,
        file: {
          name: item.file_name,
          token: item.file_token,
          duration: item.file_duration,
          path: item.file_path,
          preview: item.file_preview,
          type: item.file_type,
          uuid: item.file_uuid
        },
        hide: false,
        editable: !playlist.system
      })
    })
    return items
  },

  render() {
    return (
      <div className='col-xs-12 container-fluid'>
        <h1>{this.state.data.playlist.name}</h1>

        <div className="list-group list-view-pf list-view-pf-view playlist">

          {this.getItems().map((item) => {
            return (
              <div className="list-group-item">
                <div className="list-view-pf-main-info">
                  <div className="list-view-pf-body">
                    <div className="list-view-pf-description">
                      <div className="list-group-item-heading">
                        {add3Dots(item.file.name, 40)}
                      </div>
                    </div>
                    <div className="list-view-pf-additional-info">

                      <div className="list-view-pf-additional-info-item">
                        <img src={item.file.preview} style={{height: 32, width: 32}}
                          alt="placeholder image"/>
                      </div>

                      <div className="list-view-pf-additional-info-item">
                        <span className="fa fa-clock-o"></span>
                        {moment.duration(item.file.duration, 'seconds').format('m:ss', {trim: false})}
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
