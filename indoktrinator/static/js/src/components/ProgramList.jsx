import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {ProgramActions as pa, FeedbackActions} from '../actions'
import Griddle from 'griddle-react'
import {Pager} from './Pager'
import {Button, Grid, Row, Col} from 'react-bootstrap'
import {Link, hashHistory as BrowserHistory} from 'react-router'
import {regexGridFilter} from '../util/griddle-components'
import {ProgramStore} from '../stores/Program'
import {confirmModal} from './ModalConfirmMixin'
import {translate} from 'react-i18next'
import {Icon} from './Icon'

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
    <Button
      label=''
      bsStyle=''
      onClick={this.handleDeleteProgram}>
      <Icon fa='trash' /> {this.props.t('program:buttons.delete')}
      </Button>
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
      <Grid fluid>
        <Row>
          <Col xs={12} sm={10} componentClass='h1'>
              {this.props.t('program:list.title')}
          </Col>
          <Col xs={12} sm={2} className='h1 text-right'>
            <a className='btn btn-success' href='#/program/new'>
              <Icon fa='plus' /> {this.props.t('program:buttons.create')}
            </a>
          </Col>
        </Row>
        <Feedback />
        <Griddle results={this.state.program.list}
          tableClassName='table table-bordered table-striped table-hover'
          useGriddleStyles={false}
          showFilter={true}
          useCustomPagerComponent='true'
          customPagerComponent={Pager}
          sortAscendingComponent={<Icon fa='sort-alpha-asc' />}
          sortDescendingComponent={<Icon fa='sort-alpha-desc' />}
          columns={['name', 'c']}
          resultsPerPage='50'
          customFilterer={regexGridFilter}
          useCustomFilterer='true'
          columnMetadata={columnMeta}
        />
      </Grid>
    )
  }
}))

