import * as React from 'react'
import {FeedbackActions} from '../actions'
import {Feedback} from './Feedback'
import {Input} from 'react-bootstrap'
import {FormattedMessage} from 'react-intl'
import {BootstrapSelect} from './Select'
import FileBase64 from '../util/react-file-base64.js'
import {SaveButton} from './form/button/SaveButton'
import {DeleteButton} from './form/button/DeleteButton'
import {StoreTypes} from './../stores/StoreTypes'

export var Device = React.createClass({

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  getInitialState() {
    return {}
  },

  componentWillReceiveProps(p) {
    this.setState(
      {
        'id': p.device.id,
        'photo': p.device.photo,
        'preview': p.device.photo,
        'name': p.device.name,
        'title': p.device.name,
        'state': p.device.state,
        'program': p.device.program ? p.device.program : p.program[0] ? p.program[0].uuid : null
      }
    )
  },

  validate() {
    var r = []

    if (!this.state.name) {
      r.push('Name is required')
    }

    if (!this.state.id) {
      r.push('Id is required')
    }

    return r
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  handleChangePhoto(files) {
    this.setState({
      'preview': files[0]['base64'],
      'photo': files[0]['base64raw']
    })
  },

  save() {
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      this.props.saveHandler(this.state)
    }
  },

  delete() {
    this.props.deleteHandler(this.state.id)
  },

  render() {
    return (
      <div className='col-xs-12 container-fluid'>
        <h1>{this.state.title}</h1>
        <Feedback />
        <div className='row'>
          <div className='col-xs-12 col-md-6'>
            <div className='panel panel-default'>
              <div className='panel-heading'>
                <FormattedMessage
                  id="app.menu.device.title"
                  description="Title"
                  defaultMessage="Device"
                />
              </div>
              <div className='panel-body'>
                <div className="form-horizontal">
                  { this.state.state != StoreTypes.LOADED ? <Input
                    type="text"
                    label="id"
                    ref="id"
                    name="id"
                    onChange={this.handleChange}
                    value={this.state.id}
                    {...this.commonProps} />
                    : null }
                  <Input
                    type="text"
                    label="Name"
                    ref="name"
                    name="name"
                    onChange={this.handleChange}
                    value={this.state.name}
                    {...this.commonProps} />
                  <BootstrapSelect
                    label='Program'
                    ref='program'
                    name='program'
                    onChange={this.handleChange}
                    data-live-search={true}
                    value={this.state.program}
                    {...this.commonProps}>
                    {this.props.program.map((item) => {
                      return <option value={item.uuid} key={item.uuid}>
                        {item.name}</option>
                    })}
                  </BootstrapSelect>
                  <div className="form-group">
                    <label className="control-label col-xs-2">
                      <FormattedMessage
                        id="app.device.photo"
                        description="Title"
                        defaultMessage="Photo"
                      />
                    </label>
                    <FileBase64
                      multiple={ false }
                      onDone={ this.handleChangePhoto.bind(this) }
                    />
                  </div>
                  <div className="form-group">
                    <label className="control-label col-xs-2">
                      <FormattedMessage
                        id="app.device.preview"
                        description="Title"
                        defaultMessage="Photo preview"
                      />
                    </label>
                    <div className="col-xs-10">
                      <img className="img-responsive" src={this.state.preview}></img>
                    </div>
                  </div>
                </div>
              </div>
              <div className='panel-footer'>
                <div className="row">
                  <div className="col-xs-6">
                    <SaveButton
                      handler={this.save}
                    />
                  </div>
                  <div className="col-xs-6">
                    { this.state.state == StoreTypes.LOADED ? <DeleteButton
                      id={this.state.id}
                      handler={this.delete}
                    /> : null }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
})
