import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {ProgramActions as pa, FeedbackActions} from '../actions'
import Griddle from 'griddle-react'
import {Pager} from './Pager'
import {Button} from 'react-bootstrap'
import {Link, hashHistory as BrowserHistory} from 'react-router'
import {regexGridFilter} from '../util/griddle-components'
import {ProgramStore} from '../stores/Program'
import {confirmModal} from './ModalConfirmMixin'
import {translate} from 'react-i18next'

let ProgramLink = React.createClass({
  render() {
    return (<Link to={`/program/${this.props.rowData.uuid}`}>
      {this.props.rowData.name}
    </Link>)
  }
})

let ProgramActions = translate(['program', 'common'])(React.createClass({

  handleDeleteProgram() {
    confirmModal(
      this.props.t('common:confirm.areyousure'),
      this.props.t('program:confirm.delete', {name: this.props.rowData.name})
    ).then(() => {
      pa.delete(this.props.rowData.uuid)
        .then(() => {
          pa.list()
          BrowserHistory.push('/program/')
          FeedbackActions.set('success', this.props.t('program:alerts.delete'))
      })
    })
  },

  render() {
    return (
      <span>
    <Button
      label=''
      bsStyle=''
      onClick={this.handleDeleteProgram}>
      <i className="fa fa-trash"></i> {this.props.t('program:buttons.delete')}
      </Button>
      </span>
    )
  }
}))

export var ProgramList = translate(['program', 'common'])(React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program')
  ],

  componentDidMount() {
    pa.list()
  },

  getInitialState() {
    return {program: {list: []}}
  },

  render() {

    let columnMeta = [
      {columnName: 'name', displayName: this.props.t('program:labels.name'),
        customComponent: ProgramLink},
      {columnName: 'c', displayName: this.props.t('common:labels.actions'),
        customComponent: ProgramActions, cssClassName: 'griddle-actions'}
    ]

    return (
      <div className='container-fluid col-xs-12'>
        <div className="row">
          <div className="col-xs-12 col-sm-10">
            <h1>
              {this.props.t('program:list.title')}
            </h1>
          </div>
          <div className="col-xs-12 col-sm-2 h1 text-right">
            <a className='btn btn-success' href='#/program/new'>
              <i className='fa fa-plus'></i> {this.props.t('program:buttons.create')}
            </a>
          </div>
        </div>
        <Feedback />
        <Griddle results={this.state.program.list}
          tableClassName='table table-bordered table-striped table-hover'
          useGriddleStyles={false}
          showFilter={true}
          useCustomPagerComponent='true'
          customPagerComponent={Pager}
          sortAscendingComponent={<span className='fa fa-sort-alpha-asc'></span>}
          sortDescendingComponent={<span className='fa fa-sort-alpha-desc'></span>}
          columns={['name', 'c']}
          resultsPerPage='50'
          customFilterer={regexGridFilter}
          useCustomFilterer='true'
          columnMetadata={columnMeta}
        />
      </div>
    )
  }
}))

