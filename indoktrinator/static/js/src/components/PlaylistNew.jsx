import * as React from 'react'
import * as Reflux from 'reflux'
import {PlaylistActions, FeedbackActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import {hashHistory as BrowserHistory} from 'react-router'
import {Feedback} from './Feedback'
import {Input, Form, Button} from 'react-bootstrap'
import {translate} from 'react-i18next'

export var PlaylistNew = translate(['playlist', 'common'])(React.createClass({

  getInitialState() {
    return {name: ''}
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  validate() {
    var r = []

    if (!this.state.name) {
      r.push(this.props.t('validation.required', {name: '$t(labels.name)'}))
    }

    return r
  },

  save(e) {
    e.preventDefault()
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', this.props.t('alerts.invalidform'), errors)
    } else {
      PlaylistActions.create.triggerAsync({name: this.state.name})
      .then((data) => {
        BrowserHistory.push('/playlist/' + data.uuid)
        FeedbackActions.set('success', this.props.t('common:alerts.create'))
      })
    }
  },

  cancel() {
    BrowserHistory.push('/playlist/')
  },

  render() {
		const {t} = this.props

    return (
      <div className='col-xs-12 col-sm-6 col-sm-push-3 container-fluid'>
        <h1></h1>
        <div className='row'>
          <div className='col-xs-12'>
            <Form horizontal onSubmit={this.save}>
            <div className='panel panel-default'>

              <div className='panel-heading'>
                {t('playlist:new.title')}
              </div>

              <div className='panel-body'>
                  <Input
                    type="text"
                    label={t('playlist:labels.name')}
                    ref="name"
                    name="name"
                    onChange={this.handleChange}
                    value={this.state.name}
                    labelClassName="col-xs-3"
                    wrapperClassName="col-xs-9"
                    autoFocus
                  />
              </div>

              <div className='panel-footer'>
                <div className="row">
                  <div className="col-xs-12 text-right">
                    <Button bsStyle='default'
                      onClick={this.cancel}>
                      {t('playlist:buttons.new.cancel')}
                    </Button>
                    <Button bsStyle='primary'
                      type='submit'>
                      {t('playlist:buttons.new.create')}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </Form>
          </div>
        </div>
      </div>)
  }

}))
