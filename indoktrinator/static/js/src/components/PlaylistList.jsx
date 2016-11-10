import * as React from "react";
import * as Reflux from "reflux";
import {Feedback} from "./Feedback";
import {PlaylistStore} from "../stores/Playlist";
import {PlaylistActions as pa} from "../actions";
import {Button} from "react-bootstrap";
import {Link, hashHistory as BrowserHistory} from "react-router";
import Griddle from "griddle-react";
import {Pager} from "./Pager";
import {regexGridFilter} from "../util/griddle-components";
import {FormattedMessage} from "react-intl";
import {confirmModal} from "./ModalConfirmMixin";

let PlaylistLink = React.createClass({
  render() {
    var link = (<span>{this.props.rowData.name}</span>);

    if (!this.props.rowData.system) {
      link = (<Link to={`/playlist/${this.props.rowData.uuid}`}>
        {this.props.rowData.name}
      </Link>);
    }

    return link;
  }
});

let PlaylistActions = React.createClass({

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
      pa.list();
    });
  },

  handleDeletePlayList() {
    confirmModal(
      'Are you sure?',
      'Would you like to remove playlist?'
    ).then(() => {
      pa.delete(this.props.rowData.uuid, () => {
        pa.list();
        BrowserHistory.push('/playlist/');
      })
    })
  },

  render() {
    return (
      <span>
        <Button
          label=''
          bsStyle=''
          onClick={this.handleCopyPlayList}>
      <i className="fa fa-files-o"></i>
           <FormattedMessage
             id="app.button.copy"
             description="Title"
             defaultMessage="Copy"
           />
    </Button>
    <Button
      label=''
      bsStyle=''
      onClick={this.handleDeletePlayList}>
      <i className="fa fa-trash"></i>
      <FormattedMessage
        id="app.button.delete"
        description="Title"
        defaultMessage="Delete"
      />
      </Button>
      </span>
    )
  }
});

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
      {columnName: 'name', displayName: 'Name', customComponent: PlaylistLink},
      {columnName: 'c', displayName: 'Actions', customComponent: PlaylistActions}
    ];

    return (
      <div className='container-fluid col-xs-12'>
        <div className="row">
          <div className="col-xs-12 col-sm-10">
            <h1>
              <FormattedMessage
                id="app.menu.playlists.title"
                description="Title"
                defaultMessage="Playlists"
              />
            </h1>
          </div>
          <div className="col-xs-12 col-sm-2 h1 text-right">
            <a className='btn btn-success' href='#/playlist/new'>
              <i className='fa fa-plus'></i>
              <FormattedMessage
                id="app.menu.playlist.new"
                description="Title"
                defaultMessage="New playlist"
              />
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
});

