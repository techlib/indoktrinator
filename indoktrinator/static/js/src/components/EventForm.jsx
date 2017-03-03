import * as React from 'react'
import {BootstrapSelect} from './Select'
import TimePicker from 'rc-time-picker'
import DatePicker from 'react-datepicker'
import {translate} from 'react-i18next'
import moment from 'moment'
import {Alert, Form, Col, FormGroup, ControlLabel} from 'react-bootstrap'
import {momentToS, sToMoment} from '../util/time'
import {range} from 'lodash'
import {Icon} from './Icon'

require('react-datepicker/dist/react-datepicker.css')

export var EventForm = translate(['event', 'common'], {withRef: true})(React.createClass({

	getInitialState() {
		return {
			range: [sToMoment(this.props.range[0]), sToMoment(this.props.range[1])],
			date: moment(this.props.date),
      playlist: this.props.playlistUuid,
			collision: null
		}
	},

  componentWillReceiveProps(p) {
    this.setState({
      playlist: p.playlistUuid,
      range: [sToMoment(p.range[0]), sToMoment(p.range[1])],
      date: moment(p.date)
    }, () => {
      this.checkCollision()
    })
  },


  checkCollision() {
    this.setState({
      collision: this.props.verifyData(this.getData())
    })
	},

	handleDate(val) {
		this.setState({
			date: val
		}, () => {
			this.checkCollision()
		})
	},

	handleRange(index, val) {
		var range = this.state.range
		range[index] = val

		if (index == 0 && val > this.state.range[1]) {
			range[1] = val.clone().add(1, 'minutes')
		}

		this.setState({
			range: range
		}, () => {
			this.checkCollision()
		})
	},

	handlePlaylist(val) {
		this.setState({
			playlist: val.target.value
		}, () => {
			this.checkCollision()
		})
	},

	disabledEndHours() {
		var minHour = this.state.range[0].hour()
		return range(0, minHour)
	},

	disabledEndMinutes() {
		var [start, end] = this.state.range
		if (start.hour() == end.hour()) {
			return range(0, start.minute() + 1)
		}
		return []
	},

	getData() {
		return {
			date: this.state.date.format('YYYY-MM-DD'),
			range: [momentToS(this.state.range[0]),
							momentToS(this.state.range[1])],
			playlist: this.state.playlist,
      uuid: this.props.uuid,
      program: this.props.program
		}
	},

  save() {
		this.props.handleSave(this.getData())
	},

  getError() {
    var data = {
      playlist: this.state.collision._playlist.name,
      date: moment(this.state.collision.date).format('DD. MM.'),
      time: moment(this.state.collision.range[0]).format('HH:mm')
    }
    return (
      <Alert bsStyle="danger">
        <Icon pf="error-circle-o" />
        {this.props.t('event:errors.events.collision', data)}
      </Alert>)
  },

  render() {
		return (
			<Form horizontal className='event-form'>
				{this.state.collision && this.getError()}

				<FormGroup controlId="formHorizontalEmail">
					<Col componentClass={ControlLabel} sm={2}>
						{this.props.t('event:labels.date')}
					</Col>
					<Col sm={10}>
						<DatePicker
							selected={this.state.date}
							onChange={this.handleDate}
							dateFormat="YYYY-MM-DD"
							peekNextMonth
							showMonthDropdown
							showYearDropdown
							dropdownMode="select"
							className='form-control' />
					</Col>
				</FormGroup>
				
				<FormGroup controlId="formHorizontalPassword">
					<Col componentClass={ControlLabel} sm={2}>
						{this.props.t('event:labels.range')}
					</Col>
					<Col sm={10}>
						<TimePicker value={this.state.range[0]}
												onChange={this.handleRange.bind(null, 0)}
												showSecond={false} /> -
						<TimePicker value={this.state.range[1]}
												onChange={this.handleRange.bind(null, 1)}
												showSecond={false}
												disabledHours={this.disabledEndHours}
												disabledMinutes={this.disabledEndMinutes} />
					</Col>
				</FormGroup>

				<FormGroup controlId="xformHorizontalPassword">
					<Col componentClass={ControlLabel} sm={2}>
						{this.props.t('event:labels.playlist')}
					</Col>
					<Col sm={10}>
						<BootstrapSelect data-live-search={true}
                             bsClass='none'
                             value={this.state.playlist}
                             onChange={this.handlePlaylist}>
							{this.props.playlists.map((item) => {
								return <option value={item.uuid}>{item.name}</option>
							})}
						</BootstrapSelect>
					</Col>
				</FormGroup>

        {this.props.showButton &&
          <FormGroup>
            <Col smOffset={2} sm={10}>
              <button onClick={this.save} className='btn btn-primary'>
                {this.props.t('event:buttons.save')}
              </button>
            </Col>
          </FormGroup>
        }
			</Form>)
}

}))

