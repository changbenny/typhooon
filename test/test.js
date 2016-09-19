import register from 'babel-register'
register()

import test from 'ava'
import Typ from '../src'

// test stream constructor
test('[constructor] Stream without constructor', t => {
    const stream = Typ()
    t.is(stream.subscribers.length, 0)
    t.is(stream.catchers.length, 0)
    t.is(stream.queue.length, 0)
})

test('[constructor] Stream with "new" keyword', t => {
    const stream = new Typ()
    t.is(stream.subscribers.length, 0)
    t.is(stream.catchers.length, 0)
    t.is(stream.queue.length, 0)
})

test('[constructor] Stream constructor', t => {
  let counter = 1
    const stream = new Typ((next, error) => {
      next(1)
      next(2)
      next(3)
    })
    stream.map(val => t.is(val, counter ++))
})

test('[constructor] Stream constructor with manual error', t => {
  let counter = 1
    const stream = new Typ((next, error) => {
      next(1)
      next(2)
      error(3)
    })
    stream
      .map(val => t.is(val, counter ++))
      .catch(val => t.is(val, 3))
})

test('[constructor] Stream constructor with manual error', t => {
  let counter = 1
    const stream = new Typ((next, error) => {
      next(1)
      next(2)
      error(3)
    })
    stream
      .map(val => t.is(val, counter ++))
      .catch(val => t.is(val, 3))
})

// test each array operators

// 1. map
test('[map] before events pushing', t => {
  const stream = new Typ()
  stream
    .map(val => val + 1)
    .map(val => t.is(val, 2))
  stream.push(1)
})

test('[map] after events pushing', t => {
  const stream = new Typ()
  stream.push(1)
  stream
    .map(val => val + 1)
    .map(val => t.is(val, 2))
})

test('[map] with multiple events', t => {
  const stream = new Typ()
  let counter = 1
  stream.push(1)
  stream.push(2)
  stream.push(3)
  stream
    .map(val => val + 1)
    .map(val => t.is(val, ++ counter))
})

// 2. reduce
test('[reduce] before events pushing', t => {
  const stream = new Typ()
  let counter = 0
  stream
    // TODO: BUG, EXPECT NO parseInt
    .reduce((accu, val) => accu + parseInt(val), 0)
    .map(val => t.is(val, counter ++))
  stream.push(1)
})

test('[reduce] after events pushing', t => {
  const stream = new Typ()
  stream.push(1)
  stream.push(1)
  stream.push(1)
  stream
    // TODO: BUG, EXPECT NO parseInt
    .reduce((accu, val) => accu + parseInt(val), 0)
    .map(val => t.is(val, 3))
})

// 3. forEach
// 4. filter
// 5. concat
// 6. push
// 7. sort
// 8. splice
// 9. indexOf
// 10. find
// 11. splice
// 12. join

// test each promise operators
  // 1. Promise.resolve()
  // 2. Promise.reject()
  // 3. Promise.all()
  // 4. Promise.race()
  // 5. promise.then()
  // 6. promise.catch()

// test each kinds of source
// Event (push stream)
// value (push/pull stream)
test('[value]', t => {
  let counter = 1
  Typ.from([1,2,3]).map(val => t.is(val, counter ++))
})

// Future (push stream)
test('[promise]', async t => {
  Typ.from(Promise.resolve(100)).map(val => t.is(val._v /* bug in AVA? */, 100))
})

// Generator (pull stream)
// DOM (push stream)

// streamify