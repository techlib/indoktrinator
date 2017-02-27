/* global React, $ */
'use strict'
import * as React from 'react'
import {FormControl} from 'react-bootstrap'
import ReactDOM from 'react-dom'

export var BootstrapSelect = React.createClass({
  displayName: 'BootstrapSelect',
  getInitialState: function () {
    return {
      open: false
    }
  },
  componentDidUpdate: function () {
    var picker = $(ReactDOM.findDOMNode(this))
    picker.selectpicker('refresh')

    var select = picker.parents('div.bootstrap-select')
    select.toggleClass('open', this.state.open)
  },
  componentWillUnmount: function () {
    var select = $(ReactDOM.findDOMNode(this))
    var picker = $(select.parents('.bootstrap-select'))

    var button = $(picker).find('button')
    var items = $(picker).find('ul.dropdown-menu li a')

    $('html').off('click')
    button.off('click')
    items.off('click')
  },
  componentDidMount: function () {
    var self = this
    var select = $(ReactDOM.findDOMNode(this))
    select.selectpicker()

    var picker = $(select.parents('.bootstrap-select'))

    var button = picker.find('button')
    var dropdown = picker.find('.dropdown-menu.open')
    var items = picker.find('ul.dropdown-menu li a')

    $('html').click(function () {
      self.setState({open: false})
    })

    button.click(function (e) {
      e.stopPropagation()
      self.setState({open: !self.state.open})
    })

    dropdown.click(function () {
      if (self.props.multiple) {
        return
      }
      self.setState({open: !self.state.open})
    })

    items.click(function () {
      if (self.props.multiple) {
        return
      }
      self.setState({open: !self.state.open})
    })
  },
  render: function () {
    return (
      <FormControl ref='select' {...this.props} componentClass='select'>
        {this.props.children}
      </FormControl>
    )
  }
})

