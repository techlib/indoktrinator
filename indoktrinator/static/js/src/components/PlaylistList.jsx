import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {PlaylistStore} from '../stores/Playlist'
import {PlaylistActions as pa, FeedbackActions} from '../actions'
import {ListGroup, Col, Row, Grid} from 'react-bootstrap'
import {Link} from 'react-router'
import {confirmModal} from './ModalConfirmMixin'
import moment from 'moment'
import {translate} from 'react-i18next'
import {filter} from 'lodash'
import {Icon} from './Icon'

let Duration = React.createClass({
  render() {
    let d = moment.duration(this.props.duration, 'seconds')
                  .format('hh:mm:ss', {trim: false})

    return <span>{d}</span>
  }
})

var ListViewItem = translate(['playlist', 'common'])(React.createClass({

  handleDeletePlayList() {
    confirmModal(
      this.props.t('confirm.areyousure'),
      this.props.t('playlist:confirm.delete', {name: this.props.name}),
      {confirmLabel: this.props.t('playlist:confirm.deletebutton')}
    ).then(() => {
      pa.delete(this.props.uuid)
      .then(() => {
        pa.list()
        FeedbackActions.set('success', this.props.t('playlist:alerts.delete'))
      })
    })
  },


  render() {
    const {t} = this.props
    return (
      <div className="list-group-item">
        <div className="list-view-pf-actions">
          {!this.props.system &&
                <button className="btn btn-default" onClick={this.handleDeletePlayList}>{t('playlist:buttons.delete')}</button>
          }
        </div>
        <div className="list-view-pf-main-info">
          <div className="list-view-pf-body">
            <div className="list-view-pf-description">
              <div className="list-group-item-heading">
                <Link to={`/playlist/${this.props.uuid}`}>
                 {this.props.name}
               </Link>
              </div>
            </div>
            <div className="list-view-pf-additional-info">
              <div className="list-view-pf-additional-info-item">
                <Icon fa='clock-o' />
                <strong><Duration duration={this.props.duration} /></strong>
              </div>
              <div className="list-view-pf-additional-info-item">
                <Icon pf='image' />
                  <strong>{this.props.items.length}</strong> {t('playlist:items', {count: this.props.items.length})}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}))


export var PlaylistList = translate(['playlist','common'])(React.createClass({
  mixins: [Reflux.connect(PlaylistStore, 'data')],

  componentDidMount() {
    pa.list()
  },

  getInitialState() {
    return {data: {list: []}}
  },

  render() {

    const {t} = this.props

    return (
      <Grid fluid>
        <Row>
          <Col xs={12} sm={10}>
            <h1>
              {t('playlist:list.title')}
            </h1>
          </Col>
          <Col xs={12} sm={2} className="h1 text-right">
            <a className='btn btn-success' href='#/playlist/new'>
              <Icon fa='plus' /> {t('playlist:buttons.new.new')}
            </a>
          </Col>
        </Row>
        <Feedback />
        <Row>
         <Col xs={12} sm={6}>
          <h3>{t('playlist:type.system')}</h3>
            <ListGroup className='list-view-pf list-view-pf-view'>
              {filter(this.state.data.list, (item) => {return item.system})
                .map(function (item) {
                  return <ListViewItem {...item} key={item.uuid} />
                }
              )}
            </ListGroup>
          </Col>

          <Col xs={12} sm={6}>
            <h3>{t('playlist:type.custom')}</h3>
            <ListGroup className='list-view-pf list-view-pf-view'>
              {filter(this.state.data.list, (item) => {return !item.system})
                .map(function (item) {
                  return <ListViewItem {...item} key={item.uuid} />
                }
              )}
            </ListGroup>
          </Col>
        </Row>
      </Grid>
    )
  }
}))

