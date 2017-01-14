import {DropTarget} from 'react-dnd'
import {Types} from './Types'
import * as React from 'react'
import {itemTarget as target} from './Item'
import {translate} from 'react-i18next'

var Placeholder = translate('playlist')(React.createClass({

  render() {
    const {connectDropTarget} = this.props

    return connectDropTarget(<div className="list-group-item">
      <div className="list-view-pf-main-info">
        <div className="list-view-pf-body">
          <div className="list-view-pf-description">
            <div className="list-group-item-heading" style={{textAlign: 'center'}}>
              {this.props.t('playlist:placeholder')}
            </div>
          </div>
        </div>
      </div>
    </div>)
  }
}))

export var Placeholder = DropTarget([Types.PLAYLIST_ITEM, Types.PLAYLIST],
  target,
  connect => ({
    connectDropTarget: connect.dropTarget(),
    index: -1 // stupid hack, but we need index in hover(), which is then incremented
              // by one to add new item. This is for cases, where there are no items
  }))(Placeholder)

