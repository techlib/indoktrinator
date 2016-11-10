import * as React from "react";
import moment from "moment";
import "moment-duration-format";
import {RemoveButton} from "../form/button/RemoveButton";

export var Item = React.createClass({

  delete() {
    this.props.deleteItemHandler(this.props.uuid);
  },

  getDeleteButton() {
    if (this.props.editable) {
      return (<RemoveButton
        id={this.props.uuid}
        handler={this.delete}
      />);
    }
  },

  render() {
    const opacity = this.props.isDragging || this.props.hide ? 0 : 1;

    return this.props.connectDragSource(this.props.connectDropTarget(
      <div className="list-group-item" style={{opacity}}>
        <div className="list-view-pf-main-info">
          <div className="list-view-pf-body">
            <div className="list-view-pf-description">
              <div className="list-group-item-heading">
                {this.props.name}
              </div>
            </div>
            <div className="list-view-pf-additional-info">

              <div className="list-view-pf-additional-info-item">
                <img src={this.props.file ? this.props.file.preview : '/static/img/kitten.jpg'} style={{height: 32}}
                  alt="placeholder image"/>
              </div>

              <div className="list-view-pf-additional-info-item">
                {this.props.file ? this.props.file.name : ''}
              </div>

              <div className="list-view-pf-additional-info-item">
                <span className="fa fa-clock-o"></span>
                {moment.duration(this.props.duration, 'seconds').format('m:ss', {trim: false})}
              </div>
            </div>
          </div>
        </div>
      </div>
    ))
  }
})
