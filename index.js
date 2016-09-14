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
Stream.resolve = function() {

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


// Event
// value
// Future
// Generator

// Stream method: from loadsh (streamify)