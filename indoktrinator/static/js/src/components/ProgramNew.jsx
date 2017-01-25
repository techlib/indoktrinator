import * as React from 'react'
import * as Reflux from 'reflux'
import {ProgramActions, FeedbackActions} from '../actions'
import {hashHistory as BrowserHistory} from 'react-router'
import {translate} from 'react-i18next'
import {Feedback} from './Feedback'
import {Input} from 'react-bootstrap'

export var ProgramNew = translate(['program'])(React.createClass({

  getInitialState() {
    return {name: ''}
  },

	handleChange(e) {
    this.setState({ name: e.target.value });
  },

  validate() {
    var r = []
    if (this.state.name.length == 0) {
			r.push(this.props.t('common:validation.required',
				{name: '$t(program:labels.name)'}))
		}

    return r
  },

  save(e) {
		var errors = this.validate()

		if (errors.length == 0) {
      ProgramActions.create.triggerAsync({name: this.state.name})
      .then((data) => {
        BrowserHistory.push('/program/' + data.uuid)
        FeedbackActions.set('success', this.props.t('alerts.create'))
      })
    } else {
        FeedbackActions.set('error', this.props.t('common:alerts.invalidform'), errors)
    }

  },

  cancel() {
    BrowserHistory.push('/program/')
  },

  render() {
		const {t} = this.props

    return (
      <div className='col-xs-12 col-sm-6 col-sm-push-3 container-fluid'>
        <h1>
          {t('program:titlenew')}
        </h1>
        <div className='row'>
          <div className='col-xs-12'>
            <div className='panel panel-default'>

              <div className='panel-heading'>
                {t('program:new.title')}
              </div>

              <div className='panel-body'>
                <div className="form-horizontal">
                  <Input
                    type="text"
                    label={t('program:labels.name')}
                    ref="name"
                    name="name"
                    onChange={this.handleChange}
                    value={this.state.name}
                    labelClassName="col-xs-3"
                    wrapperClassName="col-xs-9"
                    autoFocus
                  />
                </div>
              </div>

              <div className='panel-footer'>
                <div className="row">
                  <div className="col-xs-12 text-right">
                    <button className='btn btn-default'
                      onClick={this.cancel}>
                      {t('program:buttons.new.cancel')}
                    </button>
                    <button className='btn btn-primary'
                      onClick={this.save}>
                      {t('program:buttons.new.create')}
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
