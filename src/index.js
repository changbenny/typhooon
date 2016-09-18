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

Stream.prototype._next = function(...args) {
  this.queue.push(args)
  this.subscribers.forEach(sub => sub(...args))
}

Stream.prototype._error = function(...args) {
  this.catchers.push(catcher)
}

Stream.prototype.push = function(...args) {
  this._next(...args)
}

Stream.prototype.map = function(mapper) {
  const { subscribers, queue } = this
  return Stream(function(next, error) {
    subscribers.push((...args) => {
      next(
        mapper.call(this, ...args),
        queue.length - 1,
        this
      )
    })
    queue.forEach((args, index) => (
      next(
        mapper.call(this, ...args),
        index,
        this
      )
    ))
  })
  return this
}
Stream.prototype.filter = function(predictor) {
  const { subscribers, queue } = this
  return Stream(function(next, error) {
    subscribers.push((...args) => {
      if (predictor.call(this, ...args)) {
        next(...args, queue.length - 1, this)
      }
    })
    queue
      .forEach((args, index) => {
        if (predictor.call(this, ...args)) {
          next(...args, index, this)
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
    subscribers.push(function(...args) {
      next(queue.reduce(reducer, initValue))
    })
  })
}
Stream.prototype.catch = function(catcher) {
  this.subscribers.push(subscriber)
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
  if (value instanceof HTMLElement) {
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
    return stream;
  }
  return Stream(function(next, error) {
    next(value)
  })
}

export default Stream