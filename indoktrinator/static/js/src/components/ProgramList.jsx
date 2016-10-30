import * as React from "react";
import * as Reflux from "reflux";
import {Feedback} from "./Feedback";
import {ProgramActions} from "../actions";
import Griddle from "griddle-react";
import {Pager} from "./Pager";
import {Link} from "react-router";
import {regexGridFilter} from "../util/griddle-components";
import {FormattedMessage} from "react-intl";
import {ProgramStore} from "../stores/Program";

let ProgramLink = React.createClass({
  render() {
    return <Link to={`/program/${this.props.rowData.uuid}`}>
      {this.props.rowData.name}
    </Link>
  }
})

export var ProgramList = React.createClass({
  mixins: [Reflux.connect(ProgramStore, 'program')],

  componentDidMount() {
    ProgramActions.list()
  },

  getInitialState() {
    return {program: {list: []}}
  },

  render() {

    let columnMeta = [
      {columnName: 'name', displayName: 'Name', customComponent: ProgramLink}
    ]

    return (
      <div className='container-fluid col-xs-12'>
        <div className="row">
          <div className="col-xs-12 col-sm-10">
            <h1>
              <FormattedMessage
                id="app.menu.programs.title"
                description="Title"
                defaultMessage="Programs"
              />
            </h1>
          </div>
          <div className="col-xs-12 col-sm-2 h1 text-right">
            <a className='btn btn-success' href='#/program/new'>
              <i className='fa fa-plus'></i>
              <FormattedMessage
                id="app.menu.program.new"
                description="Title"
                defaultMessage="New Program"
              />
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
          columns={['name']}
          resultsPerPage='50'
          customFilterer={regexGridFilter}
          useCustomFilterer='true'
          columnMetadata={columnMeta}
        />
      </div>
    )
  }
})

