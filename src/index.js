
const Stream = function(initialize) {
  if (!(this instanceof Stream)) {
    return new Stream(initialize)
  }
  this.status = 'live' // 'live, error'
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
        _next.bind(this),
        _error.bind(this)
      )
    } catch (err) {
      _error.call(this, err)
    }
  }
}

/*
 * Private method
 * 
 */

function _next(val) {
  if (this.status === 'error') {
    return
  }
  this.queue[this.queue.length] = val // array.push
  const { length } = this.subscribers
  try {
    for (let i = 0; i < length; i ++) {
      this.subscribers[i](val)
    }
  } catch (err) {
    _error.call(this, err)
  }
}

function _error(err) {
  if (this.status === 'error') {
    return
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

/*
 * Instance method (Array, Promise)
 * 
 */

Stream.prototype.push = function(val) {
  _next.call(this, val)
}

Stream.prototype.map = function(mapper) {
  const { subscribers, queue, caughtError } = this
  const _this = this
  return Stream(function(next, error) {
    subscribers.push(val => next(mapper.call(this, val, queue.length - 1, this)))
    const { length } = queue
    for (let i = 0; i < length; i ++) {
      next(mapper.call(this, queue[i], i, this))
    }
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
    subscribers.push(function(val) {
      if (predictor.call(this, val)) {
        next(val)
      }
    })
    const { length } = queue
    for (let i = 0; i < length; i ++) {
      if (predictor.call(this, queue[i])) {
        next(queue[i])
      }
    }
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

/*
 * Static method (Promise)
 * 
 */

Stream.all = function(arr) {
  return Stream((next, error) => {
    const { length } = arr
    for (let i = 0; i < length; i ++) {
      arr[i].map(next)
    }
    errorPropogation(arr.map(stream => stream.caughtError), this, error)

    return function() {
      for (let i = 0; i < length; i ++) {
        arr[i]()
      }
    }
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
    return Stream(value)
  }
  return Stream(function(next, error) {
    next(value)
  })
}

function errorPropogation(sources, target, handler) {
  if (Array.isArray(sources)) {
    const { length } = sources
    for (let i = 0; i < length; i ++) {
      errorPropogation(sources[i], target, handler)
    }
  } else {
    if (sources.caughtError) {
      target.caughtError = sources.caughtError
      sources.caughtError = null
      handler(target.caughtError)
    }
  }
}

export default Stream