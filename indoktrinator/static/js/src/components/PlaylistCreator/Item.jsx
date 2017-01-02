import * as React from 'react'
import moment from 'moment'
import 'moment-duration-format'
import {BrowserHistory} from '../../actions'
import {RemoveButton} from '../form/button/RemoveButton'
import {CancelButton} from '../form/button/CancelButton'
import {add3Dots} from '../../util/string'
import {FormattedMessage} from 'react-intl'
import {Types} from './Types'
import {StoreTypes} from './../../stores/StoreTypes'

export var Item = React.createClass({

  delete() {

    if (this.props.uuid) {
      this.props.deleteItemHandler(this.props.uuid)
    } else if (
      // TODO: eh?
      !this.props.state != StoreTypes.DEFAULT
      && this.props.state != StoreTypes.LOADED
      && this.props.added)
    {
      this.props.cancelItemHandler(this.props.index)
    }
  },

  getInitialState() {
    return {
      'file': {file: {}}
    }
  },

  render() {
    const {
      type,
      //React DnD
      connectDragSource,
      connectDropTarget} = this.props

    const opacity = (type === Types.SYNTH_ITEM && this.props.isDragging) || this.props.hide ? 0 : 1

    let item = (
        <div className="list-group-item" style={{opacity}}>
          <div className="list-view-pf-main-info">
            <div className="list-view-pf-left">
              <img src={this.props.file.preview} style={{height: 32, width: 32}}
                   alt="placeholder image"/>
            </div>
            <div className="list-view-pf-body">
              <div className="list-view-pf-description">
                <div className="list-group-item-heading">
                  {add3Dots(this.props.file.name, 40)}
                </div>
              </div>
              <div className="list-view-pf-additional-info">
                <div className="list-view-pf-additional-info">
                  <span className="fa fa-clock-o"></span>
                  {moment.duration(this.props.file.duration, 'seconds').format('m:ss', {trim: false})}
                </div>
              </div>
            </div>
          </div>
          <div className="list-view-pf-actions">
            <button onClick={this.delete} type="button" className="close">
                  <span className="pficon pficon-close"> </span>
            </button>
          </div>
        </div>
      )

    if (type === Types.SYNTH_ITEM) {
      item = connectDropTarget(item)
    }

    return connectDragSource(item)
  }
})
