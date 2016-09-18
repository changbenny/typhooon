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

const connect = function(streams) {

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

const increment = Typhooon()
const decrement = Typhooon()
const data = increment.map(val => 1)
  .concat(decrement.map(val => -1))
  .reduce((accu, val) => accu + parseInt(val), 0)

const WrappedCounter = connect({
  increment(val) {
    increment.push(val)
  },
  decrement(val) {
    decrement.push(val)
  },
  data,
})(Counter)

ReactDOM.render(
  <WrappedCounter />,
  document.getElementById('container')
)