import * as React from 'react'
import * as Reflux from 'reflux'
import {ProgramActions, FeedbackActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import {hashHistory as BrowserHistory} from 'react-router'
import {translate} from 'react-i18next'
import {Feedback} from './Feedback'
import {Input} from 'react-bootstrap'

export var ProgramNew = translate(['program'])(React.createClass({

  getInitialState() {
    return {name: ''}
  },
	
	handleChange(e) {
		this.setState({name: e.target.value})
	},

  save() {
    ProgramActions.create.triggerAsync({name: this.state.name})
    .then((data) => {
      BrowserHistory.push('/program/' + data.uuid)
      FeedbackActions.set('success', this.props.t('alerts.create'))
    })
  },

  render() {
		const {t} = this.props

    return (
      <div className='col-xs-12 container-fluid'>
        <h1>
          {t('program:titlenew')}
        </h1>
        <div className='row'>
          <div className='col-xs-12 col-md-6'>
            <Feedback />
            <div className='panel panel-default'>
              <div className='panel-heading'>
                {t('program:title')}
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
                     />
                </div>
              </div>
              <div className='panel-footer'>
                <div className="row">
                  <div className="col-xs-6">
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
