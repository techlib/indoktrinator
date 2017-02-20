import * as React from 'react'
import * as Reflux from 'reflux'
import {ProgramActions, FeedbackActions} from '../actions'
import {hashHistory as BrowserHistory} from 'react-router'
import {translate} from 'react-i18next'
import {Feedback} from './Feedback'
import {Input, Form, Button} from 'react-bootstrap'

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
    e.preventDefault()
		var errors = this.validate()

		if (errors.length == 0) {
      ProgramActions.create.triggerAsync({name: this.state.name})
      .then((data) => {
        BrowserHistory.push('/program/' + data.uuid)
        FeedbackActions.set('success', this.props.t('common:alerts.create'))
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
            <Form horizontal onSubmit={this.save}>
            <div className='panel panel-default'>

              <div className='panel-heading'>
                {t('program:new.title')}
              </div>

              <div className='panel-body'>
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

              <div className='panel-footer'>
                <div className="row">
                  <div className="col-xs-12 text-right">
                    <Button bsStyle='default'
                      onClick={this.cancel}>
                      {t('program:buttons.new.cancel')}
                    </Button>
                    <Button bsStyle='primary'
                      type='submit'>
                      {t('program:buttons.new.create')}
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
