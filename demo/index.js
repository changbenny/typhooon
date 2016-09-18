import React from 'react'
import ReactDOM from 'react-dom'
import Typhooon from '../src'

const Counter = ({ increment, decrement, data }) => (
  <div>
    <button onClick={increment}>Increment</button>
    <button onClick={decrement}>Decrement</button>
    <span>{data}</span>
  </div>
)

const Wrapper = function(streams) {

  return function(Component) {
    const pushStreams = {}
    return class WrapedComponent extends React.Component {
      componentDidMount() {
        for (let key in streams) {
          const stream = streams[key]
          if (typeof(stream) === 'function') {
            pushStreams[key] = stream
          } else {
            stream.map(val => {
              this.setState({
                [key]: val,
              })
            })
          }
        }
      }
      render() {
        const props = Object.assign({}, this.props, pushStreams, this.state)
        return <Component {...props} />
      }
    }
  }
}

const increment = Typhooon((next, error) => {})
const decrement = Typhooon((next, error) => {})
const data = increment.map(val => 1)
  .concat(decrement.map(val => -1))
  .reduce((accu, val) => accu + parseInt(val), 0)

const WrappedCounter = Wrapper({
  increment(val) {
    increment._next(val)
  },
  decrement(val) {
    decrement._next(val)
  },
  data,
})(Counter)

ReactDOM.render(
  <WrappedCounter />,
  document.getElementById('container')
)