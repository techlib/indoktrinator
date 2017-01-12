import * as React from 'react'

export var NameEdit = React.createClass({

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
    this.props.changeHandler(this.refs.name.value)
    this.cancel()
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
      return <div onKeyUp={this.keyboard}
                  className="col-xs-12 playlist-name-edit row h1">
              <div className="col-sm-6">
                <div className="input-group">
                  <input type="text"
                    autoFocus
                    defaultValue={this.props.name}
                    className="form-control"
                    ref="name" />
                  <span className="input-group-btn">
                    <button onClick={this.save}
                            className="btn btn-primary" type="button">
                      <span className="fa fa-check"> </span>
                    </button>
                    <button onClick={this.cancel}
                            className="btn btn-danger" type="button">
                      <span className="pf pficon-close"> </span>
                    </button>
                  </span>
              </div>
          </div>
      </div>

    } else {
      return <h1 onClick={this.edit} className="editable col-xs-12">
                    {this.props.name} <span className="pf pficon-edit small"> </span>
      </h1>
    }
  }

})
