/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	function errorPropogation(sources, target, handler) {
	  if (Array.isArray(sources)) {
	    sources.forEach(function (src) {
	      return errorPropogation(src, target, handler);
	    });
	  } else {
	    if (sources.caughtError) {
	      target.caughtError = sources.caughtError;
	      sources.caughtError = null;
	      handler(target.caughtError);
	    }
	  }
	}
	
	var Stream = function Stream(initialize) {
	  if (!(this instanceof Stream)) {
	    return new Stream(initialize);
	  }
	  this.status = 'live';
	  this.subscribers = [];
	  this.catchers = [];
	  // For 'hot' observable
	  this.queue = [];
	  this.caughtError = null;
	  this.remover = null;
	
	  if (initialize && typeof initialize === 'function') {
	    try {
	      this.remover = initialize.call(this, this._next.bind(this), this._error.bind(this));
	    } catch (err) {
	      this._error(err);
	    }
	  }
	};
	
	Stream.prototype._next = function (val) {
	  if (this.status === 'error') return;
	  try {
	    this.queue.push(val);
	    this.subscribers.forEach(function (sub) {
	      return sub(val);
	    });
	  } catch (err) {
	    this._error(err);
	  }
	};
	
	Stream.prototype._error = function (err) {
	  var _this2 = this;
	
	  if (this.status === 'error') {
	    return;
	  }
	  this.status = 'error';
	  if (this.catchers.length > 0) {
	    // only one catcher will catch the error
	    this.catchers[0](function (cat) {
	      return cat(err);
	    });
	  } else {
	    setTimeout(function () {
	      if (_this2.caughtError) {
	        console.error('Unhandle Typhooon error:', err);
	      }
	    }, 0);
	    this.caughtError = err;
	  }
	};
	
	Stream.prototype.push = function (val) {
	  this._next(val);
	};
	
	Stream.prototype.map = function (mapper) {
	  var subscribers = this.subscribers;
	  var queue = this.queue;
	  var caughtError = this.caughtError;
	
	  var _this = this;
	  return Stream(function (next, error) {
	    var _this3 = this;
	
	    subscribers.push(function (val) {
	      return next(mapper.call(_this3, val, queue.length - 1, _this3));
	    });
	    queue.forEach(function (val, index) {
	      return next(mapper.call(_this3, val, index, _this3));
	    });
	    // error propogation
	    this.caughtError = caughtError;
	    errorPropogation(_this, this, error);
	  });
	};
	
	Stream.prototype.then = function (thener) {
	  return this.map(thener);
	};
	
	Stream.prototype.catch = function (catcher) {
	  this.catchers.push(catcher);
	  catcher(this.caughtError);
	  this.caughtError = null;
	  return this;
	};
	
	Stream.prototype.filter = function (predictor) {
	  var subscribers = this.subscribers;
	  var queue = this.queue;
	  var caughtError = this.caughtError;
	
	  var _this = this;
	  return Stream(function (next, error) {
	    var _this4 = this;
	
	    subscribers.push(function (val) {
	      if (predictor.call(_this4, val)) {
	        next(val);
	      }
	    });
	    queue.forEach(function (args, index) {
	      if (predictor.call(_this4, val)) {
	        next(val);
	      }
	    });
	    errorPropogation(_this, this, error);
	  });
	};
	
	// TODO: align with Array concat
	Stream.prototype.concat = function (stream) {
	  var _this = this;
	  return Stream(function (next, error) {
	    var _this5 = this;
	
	    _this.subscribers.push(next);
	    stream.map(next);
	    errorPropogation([_this, stream], this, error);
	    return function () {
	      _this.remove();
	      _this5.remove();
	    };
	  });
	};
	
	Stream.prototype.reduce = function (reducer, initValue) {
	  var subscribers = this.subscribers;
	  var queue = this.queue;
	
	  var _this = this;
	  return Stream(function (next, error) {
	    next(queue.reduce(reducer, initValue));
	    subscribers.push(function (val) {
	      next(queue.reduce(reducer, initValue));
	    });
	    errorPropogation(_this, this, error);
	  });
	};
	
	// TODO: needed?
	Stream.prototype.remove = function (catcher) {
	  if (this.remover && typeof this.remover === 'function') this.remover();
	  return this;
	};
	
	Stream.all = function (arr) {
	  var _this6 = this;
	
	  return Stream(function (next, error) {
	    arr.forEach(function (stream) {
	      stream.map(next);
	      _this6.errorQueue = _this6.errorQueue.concat(stream.errorQueue);
	    });
	
	    return arr.reduce(function (accu, stream) {
	      return function () {
	        accu();
	        stream();
	      };
	    }, function () {});
	  });
	};
	
	Stream.race = function () {};
	
	Stream.from = function (value) {
	  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
	    return Stream(function (next, error) {
	      var observer = new MutationObserver(function (mutations) {
	        mutations.forEach(function (mutation) {
	          next(mutation);
	        });
	      });
	      observer.observe(value, {
	        childList: true,
	        attributes: true,
	        characterData: true,
	        subtree: true
	      });
	    });
	  } else if (value instanceof Promise) {
	    return Stream(function (next, error) {
	      value.then(next);
	    });
	  } else if (Array.isArray(value)) {
	    return Stream(function (next, error) {
	      value.forEach(next);
	    });
	  } else if (typeof value === 'function') {
	    var stream = Stream(function (next, error) {
	      // generator
	      var val = value();
	      if (val.next) {
	        var generator = val;
	        console.log(generator);
	        var cur = generator.next();
	        while (!cur.done) {
	          next(cur.value);
	          cur = generator.next();
	        }
	        next(cur.value);
	      } else {
	        next(value);
	      }
	    });
	    return stream;
	  }
	  return Stream(function (next, error) {
	    next(value);
	  });
	};
	
	exports.default = Stream;

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNmQ4ODNkOGIwOTk3NWVkN2QwYTgiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbImVycm9yUHJvcG9nYXRpb24iLCJzb3VyY2VzIiwidGFyZ2V0IiwiaGFuZGxlciIsIkFycmF5IiwiaXNBcnJheSIsImZvckVhY2giLCJzcmMiLCJjYXVnaHRFcnJvciIsIlN0cmVhbSIsImluaXRpYWxpemUiLCJzdGF0dXMiLCJzdWJzY3JpYmVycyIsImNhdGNoZXJzIiwicXVldWUiLCJyZW1vdmVyIiwiY2FsbCIsIl9uZXh0IiwiYmluZCIsIl9lcnJvciIsImVyciIsInByb3RvdHlwZSIsInZhbCIsInB1c2giLCJzdWIiLCJsZW5ndGgiLCJjYXQiLCJzZXRUaW1lb3V0IiwiY29uc29sZSIsImVycm9yIiwibWFwIiwibWFwcGVyIiwiX3RoaXMiLCJuZXh0IiwiaW5kZXgiLCJ0aGVuIiwidGhlbmVyIiwiY2F0Y2giLCJjYXRjaGVyIiwiZmlsdGVyIiwicHJlZGljdG9yIiwiYXJncyIsImNvbmNhdCIsInN0cmVhbSIsInJlbW92ZSIsInJlZHVjZSIsInJlZHVjZXIiLCJpbml0VmFsdWUiLCJhbGwiLCJhcnIiLCJlcnJvclF1ZXVlIiwiYWNjdSIsInJhY2UiLCJmcm9tIiwidmFsdWUiLCJIVE1MRWxlbWVudCIsIm9ic2VydmVyIiwiTXV0YXRpb25PYnNlcnZlciIsIm11dGF0aW9ucyIsIm11dGF0aW9uIiwib2JzZXJ2ZSIsImNoaWxkTGlzdCIsImF0dHJpYnV0ZXMiLCJjaGFyYWN0ZXJEYXRhIiwic3VidHJlZSIsIlByb21pc2UiLCJnZW5lcmF0b3IiLCJsb2ciLCJjdXIiLCJkb25lIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7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LEtBQWtCLFVBQXRCLEVBQWtDO0FBQ3ZDLFNBQU1YLFNBQVNsQyxPQUFPLFVBQUN3QixJQUFELEVBQU9KLEtBQVAsRUFBaUI7QUFDckM7QUFDQSxXQUFNUCxNQUFNZ0MsT0FBWjtBQUNBLFdBQUloQyxJQUFJVyxJQUFSLEVBQWM7QUFDWixhQUFNaUMsWUFBWTVDLEdBQWxCO0FBQ0FNLGlCQUFRdUMsR0FBUixDQUFZRCxTQUFaO0FBQ0EsYUFBSUUsTUFBTUYsVUFBVWpDLElBQVYsRUFBVjtBQUNBLGdCQUFNLENBQUNtQyxJQUFJQyxJQUFYLEVBQWlCO0FBQ2ZwQyxnQkFBS21DLElBQUlkLEtBQVQ7QUFDQWMsaUJBQU1GLFVBQVVqQyxJQUFWLEVBQU47QUFDRDtBQUNEQSxjQUFLbUMsSUFBSWQsS0FBVDtBQUNELFFBVEQsTUFTTztBQUNMckIsY0FBS3FCLEtBQUw7QUFDRDtBQUNGLE1BZmMsQ0FBZjtBQWdCQSxZQUFPWCxNQUFQO0FBQ0Q7QUFDRCxVQUFPbEMsT0FBTyxVQUFTd0IsSUFBVCxFQUFlSixLQUFmLEVBQXNCO0FBQ2xDSSxVQUFLcUIsS0FBTDtBQUNELElBRk0sQ0FBUDtBQUdELEVBOUNEOzttQkFnRGU3QyxNIiwiZmlsZSI6InR5cGhvb29uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCA2ZDg4M2Q4YjA5OTc1ZWQ3ZDBhOFxuICoqLyIsImZ1bmN0aW9uIGVycm9yUHJvcG9nYXRpb24oc291cmNlcywgdGFyZ2V0LCBoYW5kbGVyKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZXMpKSB7XG4gICAgc291cmNlcy5mb3JFYWNoKHNyYyA9PiBlcnJvclByb3BvZ2F0aW9uKHNyYywgdGFyZ2V0LCBoYW5kbGVyKSlcbiAgfSBlbHNlIHtcbiAgICBpZiAoc291cmNlcy5jYXVnaHRFcnJvcikge1xuICAgICAgdGFyZ2V0LmNhdWdodEVycm9yID0gc291cmNlcy5jYXVnaHRFcnJvclxuICAgICAgc291cmNlcy5jYXVnaHRFcnJvciA9IG51bGxcbiAgICAgIGhhbmRsZXIodGFyZ2V0LmNhdWdodEVycm9yKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBTdHJlYW0gPSBmdW5jdGlvbihpbml0aWFsaXplKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTdHJlYW0pKSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0oaW5pdGlhbGl6ZSlcbiAgfVxuICB0aGlzLnN0YXR1cyA9ICdsaXZlJ1xuICB0aGlzLnN1YnNjcmliZXJzID0gW11cbiAgdGhpcy5jYXRjaGVycyA9IFtdXG4gIC8vIEZvciAnaG90JyBvYnNlcnZhYmxlXG4gIHRoaXMucXVldWUgPSBbXVxuICB0aGlzLmNhdWdodEVycm9yID0gbnVsbFxuICB0aGlzLnJlbW92ZXIgPSBudWxsXG5cbiAgaWYgKGluaXRpYWxpemUgJiYgdHlwZW9mKGluaXRpYWxpemUpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucmVtb3ZlciA9IGluaXRpYWxpemUuY2FsbChcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5fbmV4dC5iaW5kKHRoaXMpLFxuICAgICAgICB0aGlzLl9lcnJvci5iaW5kKHRoaXMpXG4gICAgICApXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLl9lcnJvcihlcnIpXG4gICAgfVxuICB9XG59XG5cblN0cmVhbS5wcm90b3R5cGUuX25leHQgPSBmdW5jdGlvbih2YWwpIHtcbiAgaWYgKHRoaXMuc3RhdHVzID09PSAnZXJyb3InKSByZXR1cm5cbiAgdHJ5IHtcbiAgICB0aGlzLnF1ZXVlLnB1c2godmFsKVxuICAgIHRoaXMuc3Vic2NyaWJlcnMuZm9yRWFjaChzdWIgPT4gc3ViKHZhbCkpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRoaXMuX2Vycm9yKGVycilcbiAgfVxufVxuXG5TdHJlYW0ucHJvdG90eXBlLl9lcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICBpZiAodGhpcy5zdGF0dXMgPT09ICdlcnJvcicpIHtcbiAgICByZXR1cm5cbiAgfVxuICB0aGlzLnN0YXR1cyA9ICdlcnJvcidcbiAgaWYgKHRoaXMuY2F0Y2hlcnMubGVuZ3RoID4gMCkge1xuICAgIC8vIG9ubHkgb25lIGNhdGNoZXIgd2lsbCBjYXRjaCB0aGUgZXJyb3JcbiAgICB0aGlzLmNhdGNoZXJzWzBdKGNhdCA9PiBjYXQoZXJyKSlcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNhdWdodEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VuaGFuZGxlIFR5cGhvb29uIGVycm9yOicsIGVycilcbiAgICAgIH1cbiAgICB9LCAwKVxuICAgIHRoaXMuY2F1Z2h0RXJyb3IgPSBlcnJcbiAgfVxufVxuXG5TdHJlYW0ucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih2YWwpIHtcbiAgdGhpcy5fbmV4dCh2YWwpXG59XG5cblN0cmVhbS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24obWFwcGVyKSB7XG4gIGNvbnN0IHsgc3Vic2NyaWJlcnMsIHF1ZXVlLCBjYXVnaHRFcnJvciB9ID0gdGhpc1xuICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIHN1YnNjcmliZXJzLnB1c2godmFsID0+IG5leHQobWFwcGVyLmNhbGwodGhpcywgdmFsLCBxdWV1ZS5sZW5ndGggLSAxLCB0aGlzKSkpXG4gICAgcXVldWUuZm9yRWFjaCgodmFsLCBpbmRleCkgPT4gbmV4dChtYXBwZXIuY2FsbCh0aGlzLCB2YWwsIGluZGV4LCB0aGlzKSkpXG4gICAgLy8gZXJyb3IgcHJvcG9nYXRpb25cbiAgICB0aGlzLmNhdWdodEVycm9yID0gY2F1Z2h0RXJyb3JcbiAgICBlcnJvclByb3BvZ2F0aW9uKF90aGlzLCB0aGlzLCBlcnJvcilcbiAgfSlcbn1cblxuU3RyZWFtLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24odGhlbmVyKSB7XG4gIHJldHVybiB0aGlzLm1hcCh0aGVuZXIpXG59XG5cblN0cmVhbS5wcm90b3R5cGUuY2F0Y2ggPSBmdW5jdGlvbihjYXRjaGVyKSB7XG4gIHRoaXMuY2F0Y2hlcnMucHVzaChjYXRjaGVyKVxuICBjYXRjaGVyKHRoaXMuY2F1Z2h0RXJyb3IpXG4gIHRoaXMuY2F1Z2h0RXJyb3IgPSBudWxsXG4gIHJldHVybiB0aGlzXG59XG5cblN0cmVhbS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24ocHJlZGljdG9yKSB7XG4gIGNvbnN0IHsgc3Vic2NyaWJlcnMsIHF1ZXVlLCBjYXVnaHRFcnJvciB9ID0gdGhpc1xuICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIHN1YnNjcmliZXJzLnB1c2goKHZhbCkgPT4ge1xuICAgICAgaWYgKHByZWRpY3Rvci5jYWxsKHRoaXMsIHZhbCkpIHtcbiAgICAgICAgbmV4dCh2YWwpXG4gICAgICB9XG4gICAgfSlcbiAgICBxdWV1ZVxuICAgICAgLmZvckVhY2goKGFyZ3MsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmIChwcmVkaWN0b3IuY2FsbCh0aGlzLCB2YWwpKSB7XG4gICAgICAgICAgbmV4dCh2YWwpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgZXJyb3JQcm9wb2dhdGlvbihfdGhpcywgdGhpcywgZXJyb3IpXG4gIH0pXG59XG5cbi8vIFRPRE86IGFsaWduIHdpdGggQXJyYXkgY29uY2F0XG5TdHJlYW0ucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIF90aGlzLnN1YnNjcmliZXJzLnB1c2gobmV4dClcbiAgICBzdHJlYW0ubWFwKG5leHQpXG4gICAgZXJyb3JQcm9wb2dhdGlvbihbX3RoaXMsIHN0cmVhbV0sIHRoaXMsIGVycm9yKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBfdGhpcy5yZW1vdmUoKVxuICAgICAgdGhpcy5yZW1vdmUoKVxuICAgIH1cbiAgfSlcbn1cblxuU3RyZWFtLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbihyZWR1Y2VyLCBpbml0VmFsdWUpIHtcbiAgY29uc3QgeyBzdWJzY3JpYmVycywgcXVldWUgfSA9IHRoaXNcbiAgY29uc3QgX3RoaXMgPSB0aGlzXG4gIHJldHVybiBTdHJlYW0oZnVuY3Rpb24obmV4dCwgZXJyb3IpIHtcbiAgICBuZXh0KHF1ZXVlLnJlZHVjZShyZWR1Y2VyLCBpbml0VmFsdWUpKVxuICAgIHN1YnNjcmliZXJzLnB1c2goZnVuY3Rpb24odmFsKSB7XG4gICAgICBuZXh0KHF1ZXVlLnJlZHVjZShyZWR1Y2VyLCBpbml0VmFsdWUpKVxuICAgIH0pXG4gICAgZXJyb3JQcm9wb2dhdGlvbihfdGhpcywgdGhpcywgZXJyb3IpXG4gIH0pXG59XG5cbi8vIFRPRE86IG5lZWRlZD9cblN0cmVhbS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oY2F0Y2hlcikge1xuICBpZiAodGhpcy5yZW1vdmVyICYmIHR5cGVvZih0aGlzLnJlbW92ZXIpID09PSAnZnVuY3Rpb24nKVxuICB0aGlzLnJlbW92ZXIoKVxuICByZXR1cm4gdGhpc1xufVxuXG5TdHJlYW0uYWxsID0gZnVuY3Rpb24oYXJyKSB7XG4gIHJldHVybiBTdHJlYW0oKG5leHQsIGVycm9yKSA9PiB7XG4gICAgYXJyLmZvckVhY2goc3RyZWFtID0+IHtcbiAgICAgIHN0cmVhbS5tYXAobmV4dClcbiAgICAgIHRoaXMuZXJyb3JRdWV1ZSA9IHRoaXMuZXJyb3JRdWV1ZS5jb25jYXQoc3RyZWFtLmVycm9yUXVldWUpXG4gICAgfSlcbiAgICBcbiAgICByZXR1cm4gYXJyLnJlZHVjZSgoYWNjdSwgc3RyZWFtKSA9PiB7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBhY2N1KClcbiAgICAgICAgc3RyZWFtKClcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbigpIHt9KVxuICB9KVxufVxuXG5TdHJlYW0ucmFjZSA9IGZ1bmN0aW9uKCkge1xuXG59XG5cblN0cmVhbS5mcm9tID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHR5cGVvZihIVE1MRWxlbWVudCkgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICByZXR1cm4gU3RyZWFtKGZ1bmN0aW9uKG5leHQsIGVycm9yKSB7XG4gICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9ucykge1xuICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihtdXRhdGlvbikge1xuICAgICAgICAgIG5leHQobXV0YXRpb24pXG4gICAgICAgIH0pICAgIFxuICAgICAgfSlcbiAgICAgIG9ic2VydmVyLm9ic2VydmUodmFsdWUsIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgfSlcbiAgICB9KVxuICAgIFxuICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgIHJldHVybiBTdHJlYW0oZnVuY3Rpb24obmV4dCwgZXJyb3IpIHtcbiAgICAgIHZhbHVlLnRoZW4obmV4dClcbiAgICB9KVxuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgICAgdmFsdWUuZm9yRWFjaChuZXh0KVxuICAgIH0pXG4gIH0gZWxzZSBpZiAodHlwZW9mKHZhbHVlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHN0cmVhbSA9IFN0cmVhbSgobmV4dCwgZXJyb3IpID0+IHtcbiAgICAgIC8vIGdlbmVyYXRvclxuICAgICAgY29uc3QgdmFsID0gdmFsdWUoKVxuICAgICAgaWYgKHZhbC5uZXh0KSB7XG4gICAgICAgIGNvbnN0IGdlbmVyYXRvciA9IHZhbFxuICAgICAgICBjb25zb2xlLmxvZyhnZW5lcmF0b3IpXG4gICAgICAgIGxldCBjdXIgPSBnZW5lcmF0b3IubmV4dCgpXG4gICAgICAgIHdoaWxlKCFjdXIuZG9uZSkge1xuICAgICAgICAgIG5leHQoY3VyLnZhbHVlKVxuICAgICAgICAgIGN1ciA9IGdlbmVyYXRvci5uZXh0KClcbiAgICAgICAgfVxuICAgICAgICBuZXh0KGN1ci52YWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQodmFsdWUpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gc3RyZWFtXG4gIH1cbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIG5leHQodmFsdWUpXG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IFN0cmVhbVxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==