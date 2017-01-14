import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {DeviceStore} from '../stores/Device'
import {DeviceActions} from '../actions'
import {Link} from 'react-router'
import {DeviceListPanel} from './DeviceListPanel'
import {translate} from 'react-i18next'

export var DeviceList = translate(['device'])(React.createClass({

  mixins: [Reflux.connect(DeviceStore, 'data')],

  componentDidMount() {
    DeviceActions.list()
  },

  getInitialState() {
    return {data: {list: []}}
  },

  render() {
    return (
      <div className='container-fluid col-xs-12'>
        <div className="row">
          <div className="col-xs-12 col-sm-10">
            <h1>
              {this.props.t('device:list.title')}
            </h1>
          </div>
          <div className="col-xs-12 col-sm-2 h1 text-right">
            <a className='btn btn-success' href='#/device/new'>
              <i className='fa fa-plus'></i> {this.props.t('device:list.new')}
            </a>
          </div>
        </div>
        <Feedback />

        <div className="row">
        {this.state.data.list.map(function (item) {
          return <DeviceListPanel {...item} />
          }
        )}
        </div>

    </div>
    )
  }
}))

