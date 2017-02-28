import * as React from 'react'
import {Col, InputGroup, FormControl, Button} from 'react-bootstrap'
import {Icon} from './Icon'

export var InlineNameEdit = React.createClass({

  getInitialState() {
    return {
      name: '',
      editing: false
    }
  },

  edit() {
    this.setState({editing: true})
  },

  save() {
    this.props.saveAction(this.input.value)
    .then(() => {
      this.cancel()
    })
  },

  cancel() {
    this.setState({editing: false})
  },

  keyboard(e) {
    if (e.keyCode == 13) {
      this.save()
    } else if (e.keyCode == 27) {
      this.cancel()
    }
  },

  render() {
    if (this.state.editing) {
      return (
        <Col xs={12} className='inline-name-edit h1 row' onKeyUp={this.keyboard}>
          <Col sm={6}>
            <InputGroup>
              <FormControl
                  type='text'
                  defaultValue={this.props.name}
                  autoFocus
                  inputRef={ref => { this.input = ref }} />
                <InputGroup.Button>
                  <Button bsStyle='primary' onClick={this.save}>
                    <Icon fa='check' />
                  </Button>
                  <Button bsStyle='danger' onClick={this.cancel}>
                    <Icon pf='close' />
                  </Button>
                </InputGroup.Button>
              </InputGroup>
          </Col>
        </Col>
      )

    } else {
      return (
        <h1 onClick={this.edit} className="editable">
          {this.props.name} <Icon pf='edit' className='small' />
        </h1>
      )
    }
  }

})
