import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {PlaylistStore} from '../stores/Playlist'
import {PlaylistActions as pa} from '../actions'
import {ModalConfirmMixin} from './ModalConfirmMixin'
import {Link} from 'react-router'
import Griddle from 'griddle-react'
import {Pager} from './Pager'
import {regexGridFilter} from '../util/griddle-components'

let PlaylistLink = React.createClass({
	render() {
    return <Link to={`/playlist/${this.props.rowData.uuid}`}>
      {this.props.rowData.name}
    </Link>
	}
})

let PlaylistActions = React.createClass({
	render() {
    return <span>X</span>
	}
})

export var PlaylistList = React.createClass({
  mixins: [Reflux.connect(PlaylistStore, 'data')],

  componentDidMount() {
    pa.list()
  },

  getInitialState() {
    return {data: {list: []}}
  },

  render() {

		let columnMeta = [
			{columnName: 'name',  displayName: 'Name', customComponent: PlaylistLink},
			{columnName: 'c',  displayName: '', customComponent: PlaylistActions},

		]

    return (
      <div className='container-fluid col-xs-12'>
        <div className="row">
          <div className="col-xs-12 col-sm-10">
            <h1>Playlists</h1>
          </div>
          <div className="col-xs-12 col-sm-2 h1 text-right">
            <a className='btn btn-success' href='#/device/new'>
              <i className='fa fa-plus'></i> New playlist
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
					columns={['name', 'c']}
					resultsPerPage='50'
					customFilterer={regexGridFilter}
					useCustomFilterer='true'
					columnMetadata={columnMeta}
				/>
    </div>
    )
  }
})

