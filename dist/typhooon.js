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
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _src = __webpack_require__(1);
	
	var _src2 = _interopRequireDefault(_src);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	document.querySelector('.button').addEventListener('click', function () {
	  var stream = (0, _src2.default)(function (next) {
	    for (var i = 0; i < 1000000; i++) {
	      next(i);
	    }
	  });
	
	  stream.map(function (val) {
	    return val;
	  });
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var Stream = function Stream(initialize) {
	  if (!(this instanceof Stream)) {
	    return new Stream(initialize);
	  }
	  this.status = 'live'; // 'live, error'
	  this.subscribers = [];
	  this.catchers = [];
	
	  // For 'hot' observable
	  this.queue = [];
	  this.caughtError = null;
	  this.remover = null;
	
	  if (initialize && typeof initialize === 'function') {
	    try {
	      this.remover = initialize.call(this, _next.bind(this), _error.bind(this));
	    } catch (err) {
	      _error.call(this, err);
	    }
	  }
	};
	
	/*
	 * Private method
	 * 
	 */
	
	function _next(val) {
	  if (this.status === 'error') {
	    return;
	  }
	  this.queue[this.queue.length] = val; // array.push
	  var length = this.subscribers.length;
	
	  try {
	    for (var i = 0; i < length; i++) {
	      this.subscribers[i](val);
	    }
	  } catch (err) {
	    _error.call(this, err);
	  }
	}
	
	function _error(err) {
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
	}
	
	/*
	 * Instance method (Array, Promise)
	 * 
	 */
	
	Stream.prototype.push = function (val) {
	  _next.call(this, val);
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
	    var length = queue.length;
	
	    for (var i = 0; i < length; i++) {
	      next(mapper.call(this, queue[i], i, this));
	    }
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
	    subscribers.push(function (val) {
	      if (predictor.call(this, val)) {
	        next(val);
	      }
	    });
	    var length = queue.length;
	
	    for (var i = 0; i < length; i++) {
	      if (predictor.call(this, queue[i])) {
	        next(queue[i]);
	      }
	    }
	    errorPropogation(_this, this, error);
	  });
	};
	
	// TODO: align with Array concat
	Stream.prototype.concat = function (stream) {
	  var _this = this;
	  return Stream(function (next, error) {
	    var _this4 = this;
	
	    _this.subscribers.push(next);
	    stream.map(next);
	    errorPropogation([_this, stream], this, error);
	    return function () {
	      _this.remove();
	      _this4.remove();
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
	
	/*
	 * Static method (Promise)
	 * 
	 */
	
	Stream.all = function (arr) {
	  var _this5 = this;
	
	  return Stream(function (next, error) {
	    var length = arr.length;
	
	    for (var i = 0; i < length; i++) {
	      arr[i].map(next);
	    }
	    errorPropogation(arr.map(function (stream) {
	      return stream.caughtError;
	    }), _this5, error);
	
	    return function () {
	      for (var _i = 0; _i < length; _i++) {
	        arr[_i]();
	      }
	    };
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
	    return Stream(value);
	  }
	  return Stream(function (next, error) {
	    next(value);
	  });
	};
	
	function errorPropogation(sources, target, handler) {
	  if (Array.isArray(sources)) {
	    var length = sources.length;
	
	    for (var i = 0; i < length; i++) {
	      errorPropogation(sources[i], target, handler);
	    }
	  } else {
	    if (sources.caughtError) {
	      target.caughtError = sources.caughtError;
	      sources.caughtError = null;
	      handler(target.caughtError);
	    }
	  }
	}
	
	exports.default = Stream;

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgOTM5MzdhZjRhZDYwNzYyYWQ5NTQiLCJ3ZWJwYWNrOi8vLy4vZGVtby9zaW1wbGUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsImFkZEV2ZW50TGlzdGVuZXIiLCJzdHJlYW0iLCJpIiwibmV4dCIsIm1hcCIsInZhbCIsIlN0cmVhbSIsImluaXRpYWxpemUiLCJzdGF0dXMiLCJzdWJzY3JpYmVycyIsImNhdGNoZXJzIiwicXVldWUiLCJjYXVnaHRFcnJvciIsInJlbW92ZXIiLCJjYWxsIiwiX25leHQiLCJiaW5kIiwiX2Vycm9yIiwiZXJyIiwibGVuZ3RoIiwiY2F0Iiwic2V0VGltZW91dCIsImNvbnNvbGUiLCJlcnJvciIsInByb3RvdHlwZSIsInB1c2giLCJtYXBwZXIiLCJfdGhpcyIsImVycm9yUHJvcG9nYXRpb24iLCJ0aGVuIiwidGhlbmVyIiwiY2F0Y2giLCJjYXRjaGVyIiwiZmlsdGVyIiwicHJlZGljdG9yIiwiY29uY2F0IiwicmVtb3ZlIiwicmVkdWNlIiwicmVkdWNlciIsImluaXRWYWx1ZSIsImFsbCIsImFyciIsInJhY2UiLCJmcm9tIiwidmFsdWUiLCJIVE1MRWxlbWVudCIsIm9ic2VydmVyIiwiTXV0YXRpb25PYnNlcnZlciIsIm11dGF0aW9ucyIsImZvckVhY2giLCJtdXRhdGlvbiIsIm9ic2VydmUiLCJjaGlsZExpc3QiLCJhdHRyaWJ1dGVzIiwiY2hhcmFjdGVyRGF0YSIsInN1YnRyZWUiLCJQcm9taXNlIiwiQXJyYXkiLCJpc0FycmF5Iiwic291cmNlcyIsInRhcmdldCIsImhhbmRsZXIiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFD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QUFRRCxPQUFPaEQsV0FBZjtBQUNEO0FBQ0Y7QUFDRjs7bUJBRWNOLE0iLCJmaWxlIjoidHlwaG9vb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDkzOTM3YWY0YWQ2MDc2MmFkOTU0XG4gKiovIiwiaW1wb3J0IFR5cGhvb29uIGZyb20gJy4uL3NyYydcblxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBjb25zdCBzdHJlYW0gPSBUeXBob29vbihuZXh0ID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDAwMDA7IGkgKyspIHtcbiAgICAgIG5leHQoaSlcbiAgICB9XG4gIH0pXG5cbiAgc3RyZWFtLm1hcCh2YWwgPT4gdmFsKVxufSlcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vZGVtby9zaW1wbGUuanNcbiAqKi8iLCJcbmNvbnN0IFN0cmVhbSA9IGZ1bmN0aW9uKGluaXRpYWxpemUpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFN0cmVhbSkpIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbShpbml0aWFsaXplKVxuICB9XG4gIHRoaXMuc3RhdHVzID0gJ2xpdmUnIC8vICdsaXZlLCBlcnJvcidcbiAgdGhpcy5zdWJzY3JpYmVycyA9IFtdXG4gIHRoaXMuY2F0Y2hlcnMgPSBbXVxuICBcbiAgLy8gRm9yICdob3QnIG9ic2VydmFibGVcbiAgdGhpcy5xdWV1ZSA9IFtdXG4gIHRoaXMuY2F1Z2h0RXJyb3IgPSBudWxsXG4gIHRoaXMucmVtb3ZlciA9IG51bGxcblxuICBpZiAoaW5pdGlhbGl6ZSAmJiB0eXBlb2YoaW5pdGlhbGl6ZSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5yZW1vdmVyID0gaW5pdGlhbGl6ZS5jYWxsKFxuICAgICAgICB0aGlzLFxuICAgICAgICBfbmV4dC5iaW5kKHRoaXMpLFxuICAgICAgICBfZXJyb3IuYmluZCh0aGlzKVxuICAgICAgKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgX2Vycm9yLmNhbGwodGhpcywgZXJyKVxuICAgIH1cbiAgfVxufVxuXG4vKlxuICogUHJpdmF0ZSBtZXRob2RcbiAqIFxuICovXG5cbmZ1bmN0aW9uIF9uZXh0KHZhbCkge1xuICBpZiAodGhpcy5zdGF0dXMgPT09ICdlcnJvcicpIHtcbiAgICByZXR1cm5cbiAgfVxuICB0aGlzLnF1ZXVlW3RoaXMucXVldWUubGVuZ3RoXSA9IHZhbCAvLyBhcnJheS5wdXNoXG4gIGNvbnN0IHsgbGVuZ3RoIH0gPSB0aGlzLnN1YnNjcmliZXJzXG4gIHRyeSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKyspIHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlcnNbaV0odmFsKVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgX2Vycm9yLmNhbGwodGhpcywgZXJyKVxuICB9XG59XG5cbmZ1bmN0aW9uIF9lcnJvcihlcnIpIHtcbiAgaWYgKHRoaXMuc3RhdHVzID09PSAnZXJyb3InKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdGhpcy5zdGF0dXMgPSAnZXJyb3InXG4gIGlmICh0aGlzLmNhdGNoZXJzLmxlbmd0aCA+IDApIHtcbiAgICAvLyBvbmx5IG9uZSBjYXRjaGVyIHdpbGwgY2F0Y2ggdGhlIGVycm9yXG4gICAgdGhpcy5jYXRjaGVyc1swXShjYXQgPT4gY2F0KGVycikpXG4gIH0gZWxzZSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5jYXVnaHRFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdVbmhhbmRsZSBUeXBob29vbiBlcnJvcjonLCBlcnIpXG4gICAgICB9XG4gICAgfSwgMClcbiAgICB0aGlzLmNhdWdodEVycm9yID0gZXJyXG4gIH1cbn1cblxuLypcbiAqIEluc3RhbmNlIG1ldGhvZCAoQXJyYXksIFByb21pc2UpXG4gKiBcbiAqL1xuXG5TdHJlYW0ucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih2YWwpIHtcbiAgX25leHQuY2FsbCh0aGlzLCB2YWwpXG59XG5cblN0cmVhbS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24obWFwcGVyKSB7XG4gIGNvbnN0IHsgc3Vic2NyaWJlcnMsIHF1ZXVlLCBjYXVnaHRFcnJvciB9ID0gdGhpc1xuICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIHN1YnNjcmliZXJzLnB1c2godmFsID0+IG5leHQobWFwcGVyLmNhbGwodGhpcywgdmFsLCBxdWV1ZS5sZW5ndGggLSAxLCB0aGlzKSkpXG4gICAgY29uc3QgeyBsZW5ndGggfSA9IHF1ZXVlXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKyspIHtcbiAgICAgIG5leHQobWFwcGVyLmNhbGwodGhpcywgcXVldWVbaV0sIGksIHRoaXMpKVxuICAgIH1cbiAgICAvLyBlcnJvciBwcm9wb2dhdGlvblxuICAgIHRoaXMuY2F1Z2h0RXJyb3IgPSBjYXVnaHRFcnJvclxuICAgIGVycm9yUHJvcG9nYXRpb24oX3RoaXMsIHRoaXMsIGVycm9yKVxuICB9KVxufVxuXG5TdHJlYW0ucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbih0aGVuZXIpIHtcbiAgcmV0dXJuIHRoaXMubWFwKHRoZW5lcilcbn1cblxuU3RyZWFtLnByb3RvdHlwZS5jYXRjaCA9IGZ1bmN0aW9uKGNhdGNoZXIpIHtcbiAgdGhpcy5jYXRjaGVycy5wdXNoKGNhdGNoZXIpXG4gIGNhdGNoZXIodGhpcy5jYXVnaHRFcnJvcilcbiAgdGhpcy5jYXVnaHRFcnJvciA9IG51bGxcbiAgcmV0dXJuIHRoaXNcbn1cblxuU3RyZWFtLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbihwcmVkaWN0b3IpIHtcbiAgY29uc3QgeyBzdWJzY3JpYmVycywgcXVldWUsIGNhdWdodEVycm9yIH0gPSB0aGlzXG4gIGNvbnN0IF90aGlzID0gdGhpc1xuICByZXR1cm4gU3RyZWFtKGZ1bmN0aW9uKG5leHQsIGVycm9yKSB7XG4gICAgc3Vic2NyaWJlcnMucHVzaChmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmIChwcmVkaWN0b3IuY2FsbCh0aGlzLCB2YWwpKSB7XG4gICAgICAgIG5leHQodmFsKVxuICAgICAgfVxuICAgIH0pXG4gICAgY29uc3QgeyBsZW5ndGggfSA9IHF1ZXVlXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKyspIHtcbiAgICAgIGlmIChwcmVkaWN0b3IuY2FsbCh0aGlzLCBxdWV1ZVtpXSkpIHtcbiAgICAgICAgbmV4dChxdWV1ZVtpXSlcbiAgICAgIH1cbiAgICB9XG4gICAgZXJyb3JQcm9wb2dhdGlvbihfdGhpcywgdGhpcywgZXJyb3IpXG4gIH0pXG59XG5cbi8vIFRPRE86IGFsaWduIHdpdGggQXJyYXkgY29uY2F0XG5TdHJlYW0ucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIF90aGlzLnN1YnNjcmliZXJzLnB1c2gobmV4dClcbiAgICBzdHJlYW0ubWFwKG5leHQpXG4gICAgZXJyb3JQcm9wb2dhdGlvbihbX3RoaXMsIHN0cmVhbV0sIHRoaXMsIGVycm9yKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBfdGhpcy5yZW1vdmUoKVxuICAgICAgdGhpcy5yZW1vdmUoKVxuICAgIH1cbiAgfSlcbn1cblxuU3RyZWFtLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbihyZWR1Y2VyLCBpbml0VmFsdWUpIHtcbiAgY29uc3QgeyBzdWJzY3JpYmVycywgcXVldWUgfSA9IHRoaXNcbiAgY29uc3QgX3RoaXMgPSB0aGlzXG4gIHJldHVybiBTdHJlYW0oZnVuY3Rpb24obmV4dCwgZXJyb3IpIHtcbiAgICBuZXh0KHF1ZXVlLnJlZHVjZShyZWR1Y2VyLCBpbml0VmFsdWUpKVxuICAgIHN1YnNjcmliZXJzLnB1c2goZnVuY3Rpb24odmFsKSB7XG4gICAgICBuZXh0KHF1ZXVlLnJlZHVjZShyZWR1Y2VyLCBpbml0VmFsdWUpKVxuICAgIH0pXG4gICAgZXJyb3JQcm9wb2dhdGlvbihfdGhpcywgdGhpcywgZXJyb3IpXG4gIH0pXG59XG5cbi8vIFRPRE86IG5lZWRlZD9cblN0cmVhbS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oY2F0Y2hlcikge1xuICBpZiAodGhpcy5yZW1vdmVyICYmIHR5cGVvZih0aGlzLnJlbW92ZXIpID09PSAnZnVuY3Rpb24nKVxuICB0aGlzLnJlbW92ZXIoKVxuICByZXR1cm4gdGhpc1xufVxuXG4vKlxuICogU3RhdGljIG1ldGhvZCAoUHJvbWlzZSlcbiAqIFxuICovXG5cblN0cmVhbS5hbGwgPSBmdW5jdGlvbihhcnIpIHtcbiAgcmV0dXJuIFN0cmVhbSgobmV4dCwgZXJyb3IpID0+IHtcbiAgICBjb25zdCB7IGxlbmd0aCB9ID0gYXJyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKyspIHtcbiAgICAgIGFycltpXS5tYXAobmV4dClcbiAgICB9XG4gICAgZXJyb3JQcm9wb2dhdGlvbihhcnIubWFwKHN0cmVhbSA9PiBzdHJlYW0uY2F1Z2h0RXJyb3IpLCB0aGlzLCBlcnJvcilcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpICsrKSB7XG4gICAgICAgIGFycltpXSgpXG4gICAgICB9XG4gICAgfVxuICB9KVxufVxuXG5TdHJlYW0ucmFjZSA9IGZ1bmN0aW9uKCkge1xuXG59XG5cblN0cmVhbS5mcm9tID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHR5cGVvZihIVE1MRWxlbWVudCkgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICByZXR1cm4gU3RyZWFtKGZ1bmN0aW9uKG5leHQsIGVycm9yKSB7XG4gICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9ucykge1xuICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihtdXRhdGlvbikge1xuICAgICAgICAgIG5leHQobXV0YXRpb24pXG4gICAgICAgIH0pICAgIFxuICAgICAgfSlcbiAgICAgIG9ic2VydmVyLm9ic2VydmUodmFsdWUsIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgfSlcbiAgICB9KVxuICAgIFxuICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgIHJldHVybiBTdHJlYW0oZnVuY3Rpb24obmV4dCwgZXJyb3IpIHtcbiAgICAgIHZhbHVlLnRoZW4obmV4dClcbiAgICB9KVxuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgICAgdmFsdWUuZm9yRWFjaChuZXh0KVxuICAgIH0pXG4gIH0gZWxzZSBpZiAodHlwZW9mKHZhbHVlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBTdHJlYW0odmFsdWUpXG4gIH1cbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIG5leHQodmFsdWUpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGVycm9yUHJvcG9nYXRpb24oc291cmNlcywgdGFyZ2V0LCBoYW5kbGVyKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZXMpKSB7XG4gICAgY29uc3QgeyBsZW5ndGggfSA9IHNvdXJjZXNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSArKykge1xuICAgICAgZXJyb3JQcm9wb2dhdGlvbihzb3VyY2VzW2ldLCB0YXJnZXQsIGhhbmRsZXIpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChzb3VyY2VzLmNhdWdodEVycm9yKSB7XG4gICAgICB0YXJnZXQuY2F1Z2h0RXJyb3IgPSBzb3VyY2VzLmNhdWdodEVycm9yXG4gICAgICBzb3VyY2VzLmNhdWdodEVycm9yID0gbnVsbFxuICAgICAgaGFuZGxlcih0YXJnZXQuY2F1Z2h0RXJyb3IpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFN0cmVhbVxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==