import React, { Component } from 'react';
import reactMixin from 'react-mixin';
import { ListenerMixin } from 'reflux';
import Mozaik from 'mozaik/browser';
var d3 = require('d3');
var ease = require('d3-ease');
import _ from 'lodash';


function pulse(opts) {
  for (var i = 1; i < opts.count; ++i) {
    d3.select(opts.element)
      .append('circle')
      .attr('cx', opts.position.x)
      .attr('cy', opts.position.y)
      .attr('r', 30)
      .attr('stroke-width', opts.strokeWidth / (i))
      .attr('fill', 'transparent')
      .attr('stroke', `rgba(${opts.color.r}, ${opts.color.g}, ${opts.color.b}, 255)`)
      .transition()
        .delay(Math.pow(i, 2.5) * opts.delay)
        .duration(opts.duration)
        .ease(ease.easeQuadIn)
      .attr('stroke-width', 2)
      .attr('stroke', `rgba(${opts.color.r}, ${opts.color.g}, ${opts.color.b}, 0)`)
      .attr('r', opts.radius)
      .remove();
  }
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

class Pulse extends Component {
  constructor(props) {
    super(props);
    this.mounted = false;
    this.state = {
      colorIndex: 0,
      height: 400,
      width: 400
    };
    this.config = _.defaultsDeep(this.props.config || {}, {
      delay: 10,
      count: 8,
      duration: 4000,
      strokeWidth: 20,
      // Defaults to Slack colours
      colors: [
        { r: 112, g: 204, b: 220 }, // blue
        { r: 223, g: 168, b: 35 }, // orange
        { r: 225, g: 22, b: 101 }, // red
        { r: 61, g: 186, b: 145 } // green
      ]
    });
  }

  getApiRequest() {
    const requestId = this.props.channel ? `slack.message.${this.props.channel}` : 'slack.message';
    return {
      id: requestId,
      params: {
        channel: this.props.channel
      }
    };
  }

  onApiData(data) {
    const nextColorIndex = this.state.colorIndex < (this.config.colors.length - 1) ? this.state.colorIndex + 1 : 0;
    const nextPositionIndex = this.state.positionIndex < (this.config.colors.length - 1) ? this.state.positionIndex + 1 : 0;

    this.setState({
      colorIndex: nextColorIndex,
      positionIndex: nextPositionIndex,
    });

    if (!this.mounted) {
      return;
    }

    // Get area size
    const bodyElement = this._body.getDOMNode();
    this.setState({
      height: bodyElement.clientHeight,
      width: bodyElement.clientWidth
    });

    // NOTE: Modifying DOM with D3 is not ideal, consider
    // using https://github.com/Olical/react-faux-dom later on
    pulse(_.extend({
      height: this.state.height,
      width: this.state.width,
      radius: _.max([this.state.height, this.state.width]) + 100,
      element: this._svg.getDOMNode(),
      color: this.config.colors[this.state.colorIndex || 0],
      position: {
        x: getRandom(0, this.state.width),
        y: getRandom(0, this.state.height)
      }
    }, this.config));
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  render() {
    const title = this.props.title;

    return (
      <div className="slack__pulse">
        <div className="widget__header slack__pulse--header">
          <span className="widget__header__subject">{title}</span>
          <i className="fa fa-comment-o" />
        </div>
        <div className="slack__pulse--body widget__body" ref={(c) => this._body = c}>
          <svg ref={(c) => this._svg = c} height={this.state.height} width={this.state.width}></svg>
        </div>
      </div>
    );
  }
}

Pulse.propTypes = {
  title: React.PropTypes.string,
  channel: React.PropTypes.string,
  config: React.PropTypes.object
};

Pulse.defaultProps = {
  title: 'Slack',
  channel: null
};

// apply the mixins on the component
reactMixin(Pulse.prototype, ListenerMixin);
reactMixin(Pulse.prototype, Mozaik.Mixin.ApiConsumer);

export default Pulse;
