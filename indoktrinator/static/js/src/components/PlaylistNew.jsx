import * as React from 'react'
import * as Reflux from 'reflux'
import {PlaylistActions, FeedbackActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import {hashHistory as BrowserHistory} from 'react-router'
import {guid} from '../util/database'
import {FormattedMessage} from 'react-intl'
import {Feedback} from './Feedback'
import {Input} from 'react-bootstrap'

export var PlaylistNew = React.createClass({

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  mixins: [
    Reflux.connect(PlaylistStore, 'playlist')
  ],

  getInitialState() {
    return {uuid: guid(), state: 'New'}
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  validate() {
    var r = []

    if (!this.state.name) {
      r.push('Name is required')
    }

    if (!this.state.uuid) {
      r.push('Uuid is required')
    }

    return r
  },

  save() {
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      var playlist = {}
      playlist.name = this.state.name
      playlist.uuid = this.state.uuid

      PlaylistActions.create(playlist, () => {
        BrowserHistory.push('/playlist/' + playlist.uuid)
      })
    }
  },

  render() {
    return (
      <div className='col-xs-12 container-fluid'>
        <h1>
          <FormattedMessage
            id="app.playlist.title"
            description="Title"
            defaultMessage="Create playlist"
          />
        </h1>
        <div className='row'>
          <div className='col-xs-12 col-md-6'>
            <Feedback />
            <div className='panel panel-default'>
              <div className='panel-heading'>
                <FormattedMessage
                  id="app.menu.playlist.title"
                  description="Title"
                  defaultMessage="Playlist"
                />
              </div>
              <div className='panel-body'>
                <div className="form-horizontal">
                  <Input
                    type="text"
                    label="Name"
                    ref="name"
                    name="name"
                    onChange={this.handleChange}
                    value={this.state.name}
                    {...this.commonProps} />
                </div>
              </div>
              <div className='panel-footer'>
                <div className="row">
                  <div className="col-xs-6">
                    <button className='btn btn-primary'
                      onClick={this.save}>
                      <FormattedMessage
                        id="app.buttons.save"
                        description="Save button"
                        defaultMessage="Save"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>)
  }

})
