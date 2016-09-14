const Stream = function(initialize) {
  if (!(this instanceof Stream)) {
    return new Stream(initialize)
  }
  this.subscribers = []
  this.catchers = []
  this.remover = initialize.call(
    this,
    this._next.bind(this),
    this._error.bind(this)
  )
}

Stream.prototype._next = function(...args) {
  this.subscribers.forEach(sub => sub(...args))
}
Stream.prototype._error = function(...args) {
  this.catchers.push(catcher)
}
Stream.prototype.map = function(subscriber) {
  this.subscribers.push(subscriber)
}
Stream.prototype.concat = function(stream) {
  const original = this
  return new Stream(function(_next, _error) {
    original.subscribers.push(_next)
    stream.map(_next)
    return () => {
      original.remove()
      this.remove()
    }
  })
}
Stream.prototype.catch = function(catcher) {
  this.subscribers.push(subscriber)
}
Stream.prototype.remove = function(catcher) {
  if (this.remover && typeof(this.remover) === 'function')
  this.remover()
}
Stream.all = function(arr) {
  return Stream((next, error) => {
    arr.forEach(stream => stream.map(next))
    return arr.reduce((accu, stream) => {
      return () => {
        accu()
        stream()
      }
    }, function() {})
  })
}
Stream.race = function() {

}
Stream.from = function(value) {
  if (value instanceof Promise) {
    return Stream(function(next, error) {
      value.then(next)
    })
  } else if (typeof(value) === 'function') {
    const stream = Stream((next, error) => {
      // generator
      const val = value()
      if (val.next) {
        const generator = val
        console.log(generator)
        let cur = generator.next()
        while(!cur.done) {
          next(cur.value)
          cur = generator.next()
        }
        next(cur.value)
      } else {
        next(value)
      }
    })
    return stream;
  } else {
    return Stream(function(next, error) {
      next(value)
    })
  }
}

const eventStream = Stream((next, error) => {
  document.addEventListener('click', next)
  return () => document.removeEventListener('click', next)
})
const eventStream2 = Stream((next, error) => {
  document.addEventListener('click', next)
  return () => document.removeEventListener('click', next)
})

eventStream.concat(eventStream2).map(val => console.log(val))
// Stream.all([eventStream, eventStream2]).map(val => console.log(val))
const promise = fetch('./index.html').then(res => res.text())
// Stream.from(promise).map(val => console.log(val))

// Event
// value
// Future
// Generator

// Stream method: from loadsh (streamify)

// Stream.from(function* fibonacci () {
//   var fn1 = 1;
//   var fn2 = 1;
//   while (1){
//     var current = fn2;
//     fn2 = fn1;
//     fn1 = fn1 + current;
//     yield current;
//   }
// }).map(val => console.log(val))

Stream.from([1,2,3]).map(value => console.log(value))
