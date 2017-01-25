import * as React from 'react'
import {Item} from './Item'
import {Empty} from './Empty'
import {Placeholder} from './Placeholder'
import update from 'react/lib/update'
import {Types} from './Types'
import {cloneDeep, filter, map} from 'lodash'
import {translate} from 'react-i18next'
import {isEqual} from 'lodash'

export var Column = translate(['program', 'common'], {withRef: true})(
React.createClass({

  spaceCounter: 0,

  getData() {
    var items = this.removeSpaces(this.state.items)
    return map(items, (item) => {
      return {
        playlist: item._playlist.uuid,
        range: item.range,
        mode: 'full',
        day: this.props.day
      }
    })
  },

  componentWillReceiveProps(p) {
    var newState = {}

    if (!isEqual(p.segments, this.props.segments) || !this.state.itemsLoaded) {
      newState['items'] = this.flowFrom(this.createEmptyItems(p.segments),0)
      newState['itemsLoaded'] = true
    }

    this.setState(newState)
  },

  getInitialState() {
    return {items: [], itemsLoaded: false}
  },

  addToItems(obj, pos) {
    obj._dirty = true
    this.setState(update(this.state, {
      items: {$splice: [[pos, 0, obj]]}
    }))
  },

  createSpace(start, end) {
    return {
        uuid: ++this.spaceCounter,
        empty: true,
        _playlist: {
          name: '- empty -',
          duration: start - end
        },
        range: [start, end]
      }
  },

  createEmptyItems(items) {
    var result = []

    if (items.length == 0) {
      return result
    }

    if (items[0].range[0] !== 0) {
      result.push(this.createSpace(0, items[0].range[0]))
    }
    for (var i = 0; i < items.length - 1; i++) {
      result.push(items[i])
      if (items[i].range[1] != items[i + 1].range[0]) {
        result.push(this.createSpace(items[i].range[1], items[i + 1].range[0]))
      }
    }

    result.push(items[items.length - 1])

    return result
  },

  moveItem(dragIndex, hoverIndex) {
    const dragItem = this.state.items[dragIndex]

    this.setState(update(this.state, {
      items: {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragItem]
        ]
      }
    }))
  },

  cleanupDrag() {
    this.setState(update(this.state, {
      items: {
        $set: this.state.items.filter((item) => {
          return item._dirty !== true
        })
      }
    }))
  },

  dropPlaylist() {
    this.setState(update(this.state, {
      items: {
        $set: this.flowFrom(this.state.items.map((item) => {
          item._dirty = false
          item._type = Types.ITEM
          item.day = this.props.day
          return item
        }), 0)
      }
    }))
  },

  saveSegment(pos, start, end) {
    var items = cloneDeep(this.state.items)
    items[pos].range = [start, end]
    items = this.flowFrom(items, pos)

    this.setState({
      items: this.createEmptyItems(this.removeSpaces(items))
    })

  },

  makeDirty(pos) {
    var items = cloneDeep(this.state.items)
    items[pos]._dirty = true
    this.setState({
      items: items
    })
  },

  deleteSegment(pos) {
    var items = cloneDeep(this.state.items)
    items.splice(pos, 1)
    items = this.flowFrom(items, Math.max(pos - 1, 0))
    this.setState({items: items})
  },

  flowFrom(srcItems, from) {
    var items = cloneDeep(srcItems)

    if (items.length == 0 || from > items.length) {
      return []
    }

    for (var i = from; i < items.length - 1; i++) {
      let next = items[i + 1]
      let currentEnd  = items[i].range[1]
      next.range = [currentEnd, currentEnd + next.range[1] - next.range[0]]
      items.splice(i + 1, 1, next)
    }

    return items

  },

  removeSpaces(items) {
    return filter(items, ['empty', false])
  },

  render() {
    return <div className="col">
      <div className="list-group">
        <div className="list-group-item">
          <h4 className="list-group-item-heading">
            {this.props.t('program:days.' + this.props.day)}
          </h4>
        </div>
        {this.state.items.length == 0 && 
          <Placeholder addToItems={this.addToItems}
            index={-1}
            cleanup={this.props.cleanup}
            day={this.props.day}
                       moveItem={this.moveItem} />}

        {this.state.items.map((item, index) => {
          var prevEnd = 0

          if (index > 0) {
            var pos = this.state.items[index - 1].empty ? 0 : 1
            prevEnd = this.state.items[index - 1].range[pos]
          }

          if (item.empty) {
            return <Empty />
          }

          return <Item playlist={item._playlist}
                       range={item.range}
                       duration={item.duration}
                       uuid={item.uuid}
                       key={item.uuid}
                       mode={item.mode}
                       panel={item.panel}
                       sidebar={item.sidebar}
                       index={index}
                       day={this.props.day}
                       addToItems={this.addToItems}
                       cleanup={this.props.cleanup}
                       dropPlaylist={this.dropPlaylist}
                       prevEnd={prevEnd}
                       save={this.saveSegment.bind(null, index)}
                       moveItem={this.moveItem}
                       delete={this.deleteSegment}
                       makeDirty={this.makeDirty}
                       empty={item.empty} />
        })}
    </div>
  </div>
  }

}))
