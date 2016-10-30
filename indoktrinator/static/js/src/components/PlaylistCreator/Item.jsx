import * as React from "react";
import moment from 'moment'
import 'moment-duration-format'

export var Item = React.createClass({

  iconClasses: {
    'video': 'fa-film',
    'image': 'fa-picture-o',
    'stream': 'fa-wifi fa-rotate-90',
    'website': 'fa-globe'
  },

  getTypeIcon(type) {
    console.log(type);
    return this.iconClasses[type];
  },

  getDeleteButton() {
    if (this.props.editable) {
      return <div className="list-view-pf-actions">Zap!</div>
    }
  },

  render() {
    let cls = 'fa ' + this.getTypeIcon(this.props.type)
    const opacity = this.props.isDragging || this.props.hide ? 0 : 1;

    return this.props.connectDragSource(this.props.connectDropTarget(
      <div className="list-group-item" style={{opacity}}>
        {this.getDeleteButton()}
        <div className="list-view-pf-main-info">
          <div className="list-view-pf-left">
            <span className={cls}></span>
          </div>
          <div className="list-view-pf-body">
            <div className="list-view-pf-description">
              <div className="list-group-item-heading">
                {this.props.path}
              </div>
            </div>
            <div className="list-view-pf-additional-info">

              <div className="list-view-pf-additional-info-item">
                <img src="/static/img/kitten.jpg" alt="placeholder image"/>
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
