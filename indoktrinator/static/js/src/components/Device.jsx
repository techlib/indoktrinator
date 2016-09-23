import * as React from 'react'
import * as Reflux from 'reflux'
import {DeviceForm} from './DeviceForm'
import {ModalConfirmMixin} from './ModalConfirmMixin'
import {DeviceActions, FeedbackActions} from '../actions'
import {Feedback} from './Feedback'
import * as _ from 'lodash'
import {notEmpty} from '../util/simple-validators'
import {Input} from 'react-bootstrap'

export var Device = React.createClass({

  mixins: [ModalConfirmMixin],

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

	getInitialState() {
       return {}
    },

	componentWillReceiveProps(p) {
		this.setState(p.device)
	},

  validate() {
    var r = []

    if (!this.state.uuid) {
      r.push(`Uuid is required`)
    }
    if (!this.state.name) {
      r.push(`Name is required`)
    }

		return r
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  getValues() {
    return this.state
  },

  save() {
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      this.props.saveHandler(this.getValues())
    }
  },

	delete() {
		var uuid = this.props.device.id
		this.modalConfirm('Confirm delete', `Delete ${this.props.device.name}?`,
                            {'confirmLabel': 'DELETE', 'confirmClass': 'danger'})
			.then(() => {
            DeviceActions.delete(uuid)
			})
    },

	getDeleteLink() {
		if (this.props.device.uiid !== true) {
			return (
				<button type="button" className="btn btn-link" onClick={this.delete}>
					<span className="text-danger">
						<span className="pficon pficon-delete"></span> Delete this device
					</span>
				</button>
			)
		}
	},

  handleTypeChange(value) {
    this.setState({device: {'type': value}})
  },

  render() {
    return (
        <div className='col-xs-12 container-fluid'>
            <h1>{this.props.title}</h1>
                <Feedback />
            <div className='row'>
            <div className='col-xs-12 col-md-6'>
                <div className='panel panel-default'>
                    <div className='panel-heading'>
                        <h3 className='panel-title'>Device</h3>
                    </div>
                    <div className='panel-body'>
                      <div className="form-horizontal">
                        <Input
                          type="text"
                          label="Uuid"
                          ref="uuid"
                          name="uuid"
                          onChange={this.handleChange}
                          value={this.state.uuid}
                          {...this.commonProps} />
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
                                        onClick={this.save}>Save</button>
                            </div>
                            <div className="col-xs-6 text-right">
								{this.getDeleteLink()}
							</div>
                        </div>
                    </div>
                </div>
            </div>

        <div className='col-xs-12 col-md-6'>
            <div className='panel panel-default'>
                <div className='panel-heading'>
                    <h3 className='panel-title'>Image</h3>
                </div>
                <div className='panel-body'>
                    image mooo
                </div>

                <div className='panel-footer'>
                    <a onClick={this.addInterface}>
                        <span className="pficon pficon-add-circle-o"></span> Add new interface</a>
                </div>
            </div>

        </div>
    </div>
</div>
    )
    }
})
