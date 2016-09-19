const Stream = function(initialize) {
  if (!(this instanceof Stream)) {
    return new Stream(initialize)
  }
  this.subscribers = []
  this.catchers = []
  // For 'hot' observable
  this.queue = []
  if (initialize && typeof(initialize) === 'function') {
    this.remover = initialize.call(
      this,
      this._next.bind(this),
      this._error.bind(this)
    )
  }
}

Stream.prototype._next = function(val) {
  this.queue.push(val)
  this.subscribers.forEach(sub => sub(val))
}

Stream.prototype._error = function(val) {
  this.catchers.push(val)
}

Stream.prototype.push = function(val) {
  this._next(val)
}

Stream.prototype.map = function(mapper) {
  const { subscribers, queue } = this
  return Stream(function(next, error) {
    subscribers.push(val => next(mapper.call(this, val, queue.length - 1, this)))
    queue.forEach((val, index) => next(mapper.call(this, val, index, this)))
  })
}

Stream.prototype.then = function(thener) {
  return this.map(thener)
}

Stream.prototype.filter = function(predictor) {
  const { subscribers, queue } = this
  return Stream(function(next, error) {
    subscribers.push((val) => {
      if (predictor.call(this, val)) {
        next(val)
      }
    })
    queue
      .forEach((args, index) => {
        if (predictor.call(this, val)) {
          next(val)
        }
      })
  })
}
// TODO: align with Array concat
Stream.prototype.concat = function(stream) {
  const original = this
  return Stream(function(next, error) {
    original.subscribers.push(next)
    stream.map(next)
    return () => {
      original.remove()
      this.remove()
    }
  })
}
Stream.prototype.reduce = function(reducer, initValue) {
  const { subscribers, queue } = this
  return Stream(function(next, error) {
    next(queue.reduce(reducer, initValue))
    subscribers.push(function(val) {
      next(queue.reduce(reducer, initValue))
    })
  })
}
Stream.prototype.catch = function(catcher) {
  this.subscribers.push(catcher)
}
Stream.prototype.remove = function(catcher) {
  if (this.remover && typeof(this.remover) === 'function')
  this.remover()
  return this
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
  if (typeof(HTMLElement) !== 'undefined' && value instanceof HTMLElement) {
    return Stream(function(next, error) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          next(mutation)
        })    
      })
      observer.observe(value, {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true,
      })
    })
    
  } else if (value instanceof Promise) {
    return Stream(function(next, error) {
      value.then(next)
    })
  } else if (Array.isArray(value)) {
    return Stream(function(next, error) {
      value.forEach(next)
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
    return stream
  }
  return Stream(function(next, error) {
    next(value)
  })
}

export default Stream