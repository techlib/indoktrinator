import {DropTarget} from 'react-dnd'
import {Types} from './Types'
import * as React from 'react'
import {FormattedMessage} from 'react-intl'
import {itemTarget as target} from './Item'

var Placeholder = React.createClass({

  render() {
    const {connectDropTarget} = this.props

    return connectDropTarget(<div className="list-group-item">
      <div className="list-view-pf-main-info">
        <div className="list-view-pf-body">
          <div className="list-view-pf-description">
            <div className="list-group-item-heading" style={{textAlign: 'center'}}>
              <FormattedMessage
                id="app.menu.event.item.dragAndDropExample"
                description="Text"
                defaultMessage="Drag and drop here!"
              />
            </div>
          </div>
        </div>
      </div>
    </div>)
  }
})

export var Placeholder = DropTarget([Types.PLAYLIST_ITEM, Types.PLAYLIST],
  target,
  connect => ({
    connectDropTarget: connect.dropTarget(),
    index: -1 // stupid hack, but we need index in hover(), which is then incremented
              // by one to add new item. This is for cases, where there are no items
  }))(Placeholder)

