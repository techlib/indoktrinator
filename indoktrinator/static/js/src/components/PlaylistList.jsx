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
import {Spinner} from './Spinner'

let Duration = React.createClass({
  render() {
    let d = moment.duration(this.props.duration, 'seconds')
                  .format('hh:mm:ss', {trim: false})

    return <span>{d}</span>
  }
})

var ListViewItem = translate(['playlist', 'common'])(React.createClass({

  delete() {
    this.props.handleDelete(this.props.uuid, this.props.name)
  },

  render() {
    const {t} = this.props
    return (
      <div className="list-group-item">
        <div className="list-view-pf-actions">
          {!this.props.system &&
                <button className="btn btn-default" onClick={this.delete}>{t('playlist:buttons.delete')}</button>
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
    pa.list.triggerAsync()
      .done(() => {this.setState({dataLoaded: true})})
  },

  getInitialState() {
    return {data: {list: []}, dataLoaded: false}
  },

  handleDelete(uuid, name) {
    confirmModal(
      this.props.t('confirm.areyousure'),
      this.props.t('playlist:confirm.delete', {name: name}),
      {confirmLabel: this.props.t('playlist:confirm.deletebutton')}
    ).then(() => {
      pa.delete(uuid)
      .then(() => {
        this.setState({dataLoaded: false})
        pa.list.triggerAsync()
          .done(() => {this.setState({dataLoaded: true})})
        FeedbackActions.set('success', this.props.t('playlist:alerts.delete'))
      })
    })
  },

  render() {

    const {t} = this.props

    var system = filter(this.state.data.list, (item) => {return item.system})
    var custom = filter(this.state.data.list, (item) => {return !item.system})

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
              {this.state.dataLoaded && system.map(function (item) {
                  return <ListViewItem {...item} key={item.uuid} />
                }
              )}
            </ListGroup>
           {(system.length == 0 && this.state.dataLoaded) && [
            <p className='lead text-center'>{t('playlist:empty.system')}</p>,
            <p className='text-center'>{t('playlist:empty.system2')}</p>]
           }
           {!this.state.dataLoaded && <Spinner lg />}
          </Col>

          <Col xs={12} sm={6}>
            <h3>{t('playlist:type.custom')}</h3>
            <ListGroup className='list-view-pf list-view-pf-view'>
              {this.state.dataLoaded && custom.map((item) => {
                return <ListViewItem {...item} key={item.uuid}
                  handleDelete={this.handleDelete} />
                }
              )}
            </ListGroup>
            {(custom.length == 0 && this.state.dataLoaded) &&
              <p className='lead text-center'>{t('playlist:empty.custom')}</p>
            }
            {(custom.length == 0 && system.length > 0 && this.state.dataLoaded) &&
              <p className='text-center'>{t('playlist:empty.custom2')}</p>
            }
            {!this.state.dataLoaded && <Spinner lg />}
          </Col>
        </Row>
      </Grid>
    )
  }
}))

