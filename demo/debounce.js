import Typhooon from '../src'

const button = document.querySelector('.button')

const stream = Typhooon((next, error) => {
  function timedEvent(event) {
    event.ts = Date.now()
    next(event)
  }
  button.addEventListener('click', timedEvent)
})

function debounce(timeout) {
  let record = null
  return function(event) {
    if (record) {
      if (event.ts - record < timeout) {
        return false
      }
    }
    record = event.ts
    return true
  }
}

const debounce1000 = debounce(1000)
let counter = 0
stream
  .filter(debounce1000)
  .map(event => button.textContent = `be clicked ${++ counter} times`)