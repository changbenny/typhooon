import React from 'react'
import ReactDOM from 'react-dom'
import Typhooon from '../src'
import connect from '../src/react-typhooon'

const Counter = ({ increment, decrement, data }) => (
  <div>
    <button onClick={increment}>Increment</button>
    <button onClick={decrement}>Decrement</button>
    <span>{data}</span>
  </div>
)

const increment = Typhooon()
const decrement = Typhooon()
const data = (increment.map((val, index, self) => {
  return 1
}))
  .concat(decrement.map(val => -1))
  .reduce((accu, val) => accu + parseInt(val), 0)

const WrappedCounter = connect({
  data,
}, {
  increment,
  decrement,
})(Counter)

const stream = Typhooon((next, error) => {
  // throw 'error'
  next(1)
  error('ERR')
})
stream
  .map(val => console.log(val))
  .catch(err => console.info(err))
  .map(val => console.log(val))

ReactDOM.render(
  <WrappedCounter />,
  document.getElementById('container')
)