function errorPropogation(sources, target, handler) {
  if (Array.isArray(sources)) {
    sources.forEach(src => {
      if (src.caughtError) {
        target.caughtError = src.caughtError
        src.caughtError = null
        handler(target.caughtError)
      }
    })
  } else {
    if (sources.caughtError) {
      target.caughtError = sources.caughtError
      sources.caughtError = null
      handler(target.caughtError)
    }
  }
}

const Stream = function(initialize) {
  if (!(this instanceof Stream)) {
    return new Stream(initialize)
  }
  this.status = 'live'
  this.subscribers = []
  this.catchers = []
  // For 'hot' observable
  this.queue = []
  this.caughtError = null
  this.remover = null

  if (initialize && typeof(initialize) === 'function') {
    try {
      this.remover = initialize.call(
        this,
        this._next.bind(this),
        this._error.bind(this)
      )
    } catch (err) {
      this._error(err)
    }
  }
}

Stream.prototype._next = function(val) {
  if (this.status === 'error') return
  try {
    this.queue.push(val)
    this.subscribers.forEach(sub => sub(val))
  } catch (err) {
    this._error(err)
  }
}

Stream.prototype._error = function(err) {
  if (this.status === 'error') {
    console.log('n')
  }
  this.status = 'error'
  if (this.catchers.length > 0) {
    // only one catcher will catch the error
    this.catchers[0](cat => cat(err))
  } else {
    setTimeout(() => {
      if (this.caughtError) {
        console.error('Unhandle Typhooon error:', err)
      }
    }, 0)
    this.caughtError = err
  }
}

Stream.prototype.push = function(val) {
  this._next(val)
}

Stream.prototype.map = function(mapper) {
  const { subscribers, queue, caughtError } = this
  const _this = this
  return Stream(function(next, error) {
    subscribers.push(val => next(mapper.call(this, val, queue.length - 1, this)))
    queue.forEach((val, index) => next(mapper.call(this, val, index, this)))
    // error propogation
    this.caughtError = caughtError
    errorPropogation(_this, this, error)
  })
}

Stream.prototype.then = function(thener) {
  return this.map(thener)
}

Stream.prototype.catch = function(catcher) {
  this.catchers.push(catcher)
  catcher(this.caughtError)
  this.caughtError = null
  return this
}

Stream.prototype.filter = function(predictor) {
  const { subscribers, queue, caughtError } = this
  const _this = this
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
    errorPropogation(_this, this, error)
  })
}

// TODO: align with Array concat
Stream.prototype.concat = function(stream) {
  const _this = this
  return Stream(function(next, error) {
    _this.subscribers.push(next)
    stream.map(next)
    errorPropogation([_this, stream], this, error)
    return () => {
      _this.remove()
      this.remove()
    }
  })
}

Stream.prototype.reduce = function(reducer, initValue) {
  const { subscribers, queue } = this
  const _this = this
  return Stream(function(next, error) {
    next(queue.reduce(reducer, initValue))
    subscribers.push(function(val) {
      next(queue.reduce(reducer, initValue))
    })
    errorPropogation(_this, this, error)
  })
}

// TODO: needed?
Stream.prototype.remove = function(catcher) {
  if (this.remover && typeof(this.remover) === 'function')
  this.remover()
  return this
}

Stream.all = function(arr) {
  return Stream((next, error) => {
    arr.forEach(stream => {
      stream.map(next)
      this.errorQueue = this.errorQueue.concat(stream.errorQueue)
    })
    
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