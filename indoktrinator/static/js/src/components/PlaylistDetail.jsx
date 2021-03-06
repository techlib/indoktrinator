import * as React from 'react'
import moment from 'moment'
import {Grid, Col, Row, ListGroup, ListGroupItem} from 'react-bootstrap'
import ReactImageFallback from "react-image-fallback"
import {Icon} from './Icon'
import {Spinner} from './Spinner'

export var PlaylistDetail = React.createClass({

  getDuration(item) {
    return moment.duration(item._file.duration, 'seconds')
                 .format('HH:mm:ss', {trim: false})
  },

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col xs={12}>
            <h1>{this.props.name}</h1>
            <ListGroup className='list-view-pf list-view-pf-view playlist'>

            {this.props.items.map((item) => {
              return (
                <ListGroupItem>
                  <div className="list-view-pf-main-info">
                    <div className="list-view-pf-left">
                      <ReactImageFallback src={item._file.preview} width="80" height="45"
                        alt="placeholder image" fallbackImage="/static/img/video.png"/>
                    </div>
                    <div className="list-view-pf-body">
                      <div className="list-view-pf-description">
                        <div className="list-group-item-heading">
                          {item._file.path}
                        </div>
                      </div>
                      <div className="list-view-pf-additional-info">
                        <div className="list-view-pf-additional-info-item">
                          <Icon fa='clock-o' /> {this.getDuration(item)}
                        </div>
                      </div>
                    </div>
                  </div>
                  </ListGroupItem>
              )
            })}
          </ListGroup>
          {!this.props.dataLoaded && <Spinner lg />}
        </Col>
      </Row>
    </Grid>
    )
  }
})
