import React from 'react'

export default function(passiveStream, activedStream) {

  return function(Component) {
    for (let key in activedStream) {
      const stream = activedStream[key]
      activedStream[key] = stream.push.bind(stream)
    }
    return class WrapedComponent extends React.Component {
      componentDidMount() {
        for (let key in passiveStream) {
          const stream = passiveStream[key]
          stream.map(val => {
            this.setState({
              [key]: val,
            })
          })
        }
      }
      render() {
        const props = Object.assign({}, this.props, activedStream, this.state)
        return <Component {...props} />
      }
    }
  }
}