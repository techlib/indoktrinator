import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {PlaylistStore} from '../stores/Playlist'
import {PlaylistActions as pa, FeedbackActions} from '../actions'
import {Button} from 'react-bootstrap'
import {Link, hashHistory as BrowserHistory} from 'react-router'
import Griddle from 'griddle-react'
import {Pager} from './Pager'
import {regexGridFilter} from '../util/griddle-components'
import {confirmModal} from './ModalConfirmMixin'
import moment from 'moment'
import {translate} from 'react-i18next'

let Duration = React.createClass({
  render() {
    let d = moment.duration(this.props.rowData.duration, 'seconds')
                  .format('hh:mm:ss', {trim: false})

    return <span>{d}</span>
  }
})

let PlaylistLink = React.createClass({
  render() {
    return (<Link to={`/playlist/${this.props.rowData.uuid}`}>
      {this.props.rowData.name}
    </Link>)
  }
})

let PlaylistActions = translate(['playlist', 'common'])(React.createClass({

  mixins: [
    Reflux.connect(PlaylistStore, 'playlist')
  ],

  getInitialState() {
    return {
      playlist: {copy: {}}
    }
  },

  handleCopyPlayList() {
    pa.copy(this.props.rowData.uuid, () => {
      pa.list()
    })
  },

  handleDeletePlayList() {
    confirmModal(
      this.props.t('confirm.areyousure'),
      this.props.t('playlist:confirm.delete', {name: this.props.rowData.name})
    ).then(() => {
      pa.delete(this.props.rowData.uuid)
      .then(() => {
        pa.list()
        FeedbackActions.set('success', this.props.t('playlist:alerts.delete'))
      })
    })
  },

  render() {
    const {t} = this.props

    return (
      <span>
        <Button
          label=''
          bsStyle=''
          onClick={this.handleCopyPlayList}>
      <i className="fa fa-files-o"></i> {t('playlist:buttons.copy')}
    </Button>
        {!this.props.rowData.system ? <Button
          label=''
          bsStyle=''
          onClick={this.handleDeletePlayList}>
          <i className="fa fa-trash"></i> {t('playlist:buttons.delete')} 
        </Button> : null}
      </span>
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

    let columnMeta = [
      {columnName: 'name', displayName: t('playlist:labels.name'), 
          customComponent: PlaylistLink},
      {columnName: 'duration', displayName: t('playlist:labels.duration'), 
            customComponent: Duration},
      {columnName: 'c', displayName: t('labels.actions'), 
            customComponent: PlaylistActions, cssClassName: 'griddle-actions'}
    ]

    return (
      <div className='container-fluid col-xs-12'>
        <div className="row">
          <div className="col-xs-12 col-sm-10">
            <h1>
              {t('playlist:list.title')}
            </h1>
          </div>
          <div className="col-xs-12 col-sm-2 h1 text-right">
            <a className='btn btn-success' href='#/playlist/new'>
              <i className='fa fa-plus'></i> {t('playlist:buttons.new.new')}
            </a>
          </div>
        </div>
        <Feedback />
        <Griddle results={this.state.data.list}
          tableClassName='table table-bordered table-striped table-hover'
          useGriddleStyles={false}
          showFilter={true}
          useCustomPagerComponent='true'
          customPagerComponent={Pager}
          sortAscendingComponent={<span className='fa fa-sort-alpha-asc'></span>}
          sortDescendingComponent={<span className='fa fa-sort-alpha-desc'></span>}
          columns={['name', 'duration', 'c']}
          resultsPerPage='50'
          customFilterer={regexGridFilter}
          useCustomFilterer='true'
          columnMetadata={columnMeta}
        />
      </div>
    )
  }
}))

