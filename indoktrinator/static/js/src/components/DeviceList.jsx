import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {DeviceStore} from '../stores/Device'
import {DeviceActions} from '../actions'
import {DeviceListPanel} from './DeviceListPanel'
import {translate} from 'react-i18next'
import {Grid, Col, Row} from 'react-bootstrap'
import {Icon} from './Icon'
import {Spinner} from './Spinner'

export var DeviceList = translate(['device'])(React.createClass({

  mixins: [Reflux.connect(DeviceStore, 'data')],

  componentDidMount() {
    DeviceActions.list.triggerAsync()
      .done(() => {this.setState({dataLoaded: true})})
  },

  getInitialState() {
    return {data: {list: []}, dataLoaded: false}
  },

  getBlank() {
    return (
      <Row>
        <Col xs={12}>
          <div className="blank-slate-pf">
            <h1>{this.props.t('device:list.blank')}</h1>
            <div className="blank-slate-pf-main-action">
              <a className='btn btn-success btn-lg' href='#/device/new'>
                <Icon fa="plus" /> {this.props.t('device:list.new')}
              </a>
            </div>
          </div>
        </Col>
      </Row>
    )
  },

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col xs={12} sm={10}>
            <h1>
              {this.props.t('device:list.title')}
            </h1>
          </Col>
          <Col xs={12} sm={2} className='h1 text-right'>
            <a className='btn btn-success' href='#/device/new'>
              <Icon fa='plus' /> {this.props.t('device:list.new')}
            </a>
          </Col>
        </Row>

        <Feedback />

        <Row>
          {this.state.data.list.map(function (item) {
            return <DeviceListPanel {...item} />
            }
          )}
        </Row>
        {(this.state.data.list.length == 0 && this.state.dataLoaded)
          && this.getBlank()}
        {!this.state.dataLoaded && <Spinner lg />}
    </Grid>
    )
  }
}))

