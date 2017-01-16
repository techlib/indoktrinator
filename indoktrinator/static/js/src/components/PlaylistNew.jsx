import * as React from 'react'
import * as Reflux from 'reflux'
import {PlaylistActions, FeedbackActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import {hashHistory as BrowserHistory} from 'react-router'
import {guid} from '../util/database'
import {Feedback} from './Feedback'
import {Input} from 'react-bootstrap'
import {translate} from 'react-i18next'

export var PlaylistNew = translate(['playlist', 'common'])(React.createClass({

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
      r.push(this.props.t('validation.required', {name: '$t(labels.name)'}))
    }

    if (!this.state.uuid) {
      r.push(this.props.t('validation.required', {name: 'uuid'}))
    }

    return r
  },

  save() {
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', this.props.t('alerts.invalidform'), errors)
    } else {
      var playlist = {}
      playlist.name = this.state.name
      playlist.uuid = this.state.uuid

      PlaylistActions.create.triggerAsync(playlist)
      .then(() => {
        BrowserHistory.push('/playlist/' + playlist.uuid)
      })
    }
  },

  render() {
    const {t} = this.props

    return (
      <div className='col-xs-12 container-fluid'>
        <h1>
          {t('playlist:titlenew')}
        </h1>
        <div className='row'>
          <div className='col-xs-12 col-md-6'>
            <Feedback />
            <div className='panel panel-default'>
              <div className='panel-heading'>
                {t('playlist:title')}
              </div>
              <div className='panel-body'>
                <div className="form-horizontal">
                  <Input
                    type="text"
                    label={t('playlist:labels.name')}
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
                      {t('playlist:buttons.create')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>)
  }

}))
