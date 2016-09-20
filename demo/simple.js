import Typhooon from '../src'

document.querySelector('.button').addEventListener('click', () => {
  const stream = Typhooon(next => {
    for (let i = 0; i < 1000000; i ++) {
      next(i)
    }
  })

  stream.map(val => val)
})
