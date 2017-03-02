import * as React from 'react'
import {Item} from './Item'
import {Empty} from './Empty'
import {Placeholder} from './Placeholder'
import update from 'react/lib/update'
import {Types} from './Types'
import {cloneDeep, filter, map} from 'lodash'
import {translate} from 'react-i18next'
import {isEqual, findIndex, reduce} from 'lodash'

export var Column = translate(['program', 'common'], {withRef: true})(
React.createClass({

  spaceCounter: 0,

  getData() {
    var items = this.removeSpaces(this.state.items)
    return map(items, (item) => {
      return {
        playlist: item._playlist.uuid,
        range: item.range,
        mode: item.mode,
        sidebar: item.sidebar,
        panel: item.panel,
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
    obj._moving = true
    if (pos === undefined) {
      var len = this.state.items.length
      this.setState(update(this.state, {
        items: {$push: [obj]}
      }))
      return len
    }
    else {
      this.setState(update(this.state, {
        items: {$splice: [[pos, 0, obj]]}
      }))
    }
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
    dragItem._moving = true

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
    var items = this.mergeSpaces(this.state.items.filter((item) => {
                return item._dirty !== true
    }))

    items = this.flowFrom(items, 0)
    /*items = items.map( i => {
      i._moving = false
      return i
      })*/


    this.setState(update(this.state, {
      items: {
        $set: items
      }
    }))
  },

  mergeSpaces(srcItems) {
    var res = reduce(srcItems, (result, item, index) => {
      if (!item.empty) {
        result.push(item)
      } else {
        if (index > 0 && result[index - 1].empty) {
          var prev = result[index - 1]
          var len = item.range[1] - item.range[0]
          prev.range[1] = prev.range[1] + len
        } else {
          result.push(item)
        }
      }
      return result
    }, [])

    // no space at the end
    if (res.length > 0 && res[res.length - 1].empty) {
      res.pop()
    }
    return res
  },

  eatSpaces(startIndex, allItems) {
    var items = cloneDeep(allItems)
    var next = items[startIndex + 1]
    var item = items[startIndex]

    if (next.empty) {
      var itemDuration = item.range[1] - item.range[0]
      var spaceDuration = next.range[1] - next.range[0]

      if (spaceDuration > itemDuration) {
        next.range = [item.range[1], item.range[1] + spaceDuration - itemDuration]
      } else {
        items.splice(startIndex + 1, 1)
      }
    }
    return items
  },

  drop() {
    var items = this.mergeSpaces(cloneDeep(this.state.items))
    var dropped = findIndex(items, '_dirty')

    if (dropped === -1) {
      return items
    }

    var item = items[dropped]
    var duration = item.range[1] - item.range[0]

    // item moved to first position
    if (dropped == 0) {
      item.range = [0, duration]
      if (items.length > 1) {
        items = this.eatSpaces(0, items)
      }
      items = this.flowFrom(items, 0)
    }

    // item moved to last position
    else if (dropped == items.length - 1) {
      var start = items[dropped - 1].range[1]
      item.range = [start, start + duration]
    }

    else {
      var next = items[dropped + 1]

      if (next.empty) {
        items = this.eatSpaces(dropped, items)
      }

      items = this.flowFrom(items, dropped)
    }

    return items
  },

  dropPlaylist() {
    var items = this.drop()
    this.setState(update(this.state, {
      items: {
        $set: this.createEmptyItems(this.flowFrom(items.map((item) => {
          item._dirty = false
          item._moving = false
          item._type = Types.ITEM
          item.day = this.props.day
          return item
        }), 0))
      }
      }))
  },

  saveSegment(pos, start, end, mode, sidebar, panel) {
    var items = cloneDeep(this.state.items)
    items[pos].range = [start, end]
    items[pos].mode = mode
    items[pos].sidebar = (mode == 'sidebar' || mode == 'panel') ? sidebar : null
    items[pos].panel = (mode == 'panel') ? panel : null
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
    items = this.mergeSpaces(items)
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
      let currentEnd = items[i].range[1]
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

        {this.state.items.map((item, index) => {
          var prevEnd = 0
          if (index > 0) {
            var pos = this.state.items[index - 1].empty ? 0 : 1
            prevEnd = this.state.items[index - 1].range[pos]
          }

          if (item.empty) {
            return <Empty index={index}
                          addToItems={this.addToItems}
                          cleanup={this.props.cleanup}
                          day={this.props.day}
                          moveItem={this.moveItem}
                          dropPlaylist={this.dropPlaylist}
                          empty={true}
                        />
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
                       dirty={item._dirty}
                       moving={item._moving}
                       empty={item.empty} />
          })}

          { <Placeholder addToItems={this.addToItems}
            index={this.state.items.length}
            cleanup={this.props.cleanup}
            dropPlaylist={this.dropPlaylist}
            day={this.props.day}
            moveItem={this.moveItem} />}
    </div>
  </div>
  }

}))
