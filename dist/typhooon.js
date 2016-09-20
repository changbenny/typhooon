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
	
	var button = document.querySelector('.button');
	
	var stream = (0, _src2.default)(function (next, error) {
	  function timedEvent(event) {
	    event.ts = Date.now();
	    next(event);
	  }
	  button.addEventListener('click', timedEvent);
	});
	
	function debounce(timeout) {
	  var record = null;
	  return function (event) {
	    if (record) {
	      if (event.ts - record < timeout) {
	        return false;
	      }
	    }
	    record = event.ts;
	    return true;
	  };
	}
	
	var debounce1000 = debounce(1000);
	var counter = 0;
	stream.filter(debounce1000).map(function (event) {
	  return button.textContent = 'be clicked ' + ++counter + ' times';
	});

/***/ },
/* 1 */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMmU4NzU2NTU2YjBlM2FkYjZhODEiLCJ3ZWJwYWNrOi8vLy4vZGVtby90aHJvdHRsZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiXSwibmFtZXMiOlsiYnV0dG9uIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwic3RyZWFtIiwibmV4dCIsImVycm9yIiwidGltZWRFdmVudCIsImV2ZW50IiwidHMiLCJEYXRlIiwibm93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImRlYm91bmNlIiwidGltZW91dCIsInJlY29yZCIsImRlYm91bmNlMTAwMCIsImNvdW50ZXIiLCJmaWx0ZXIiLCJtYXAiLCJ0ZXh0Q29udGVudCIsImVycm9yUHJvcG9nYXRpb24iLCJzb3VyY2VzIiwidGFyZ2V0IiwiaGFuZGxlciIsIkFycmF5IiwiaXNBcnJheSIsImZvckVhY2giLCJzcmMiLCJjYXVnaHRFcnJvciIsIlN0cmVhbSIsImluaXRpYWxpemUiLCJzdGF0dXMiLCJzdWJzY3JpYmVycyIsImNhdGNoZXJzIiwicXVldWUiLCJyZW1vdmVyIiwiY2FsbCIsIl9uZXh0IiwiYmluZCIsIl9lcnJvciIsImVyciIsInByb3RvdHlwZSIsInZhbCIsInB1c2giLCJzdWIiLCJsZW5ndGgiLCJjYXQiLCJzZXRUaW1lb3V0IiwiY29uc29sZSIsIm1hcHBlciIsIl90aGlzIiwiaW5kZXgiLCJ0aGVuIiwidGhlbmVyIiwiY2F0Y2giLCJjYXRjaGVyIiwicHJlZGljdG9yIiwiYXJncyIsImNvbmNhdCIsInJlbW92ZSIsInJlZHVjZSIsInJlZHVjZXIiLCJpbml0VmFsdWUiLCJhbGwiLCJhcnIiLCJlcnJvclF1ZXVlIiwiYWNjdSIsInJhY2UiLCJmcm9tIiwidmFsdWUiLCJIVE1MRWxlbWVudCIsIm9ic2VydmVyIiwiTXV0YXRpb25PYnNlcnZlciIsIm11dGF0aW9ucyIsIm11dGF0aW9uIiwib2JzZXJ2ZSIsImNoaWxkTGlzdCIsImF0dHJpYnV0ZXMiLCJjaGFyYWN0ZXJEYXRhIiwic3VidHJlZSIsIlByb21pc2UiLCJnZW5lcmF0b3IiLCJsb2ciLCJjdXIiLCJkb25lIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7O0FDdENBOzs7Ozs7QUFFQSxLQUFNQSxTQUFTQyxTQUFTQyxhQUFULENBQXVCLFNBQXZCLENBQWY7O0FBRUEsS0FBTUMsU0FBUyxtQkFBUyxVQUFDQyxJQUFELEVBQU9DLEtBQVAsRUFBaUI7QUFDdkMsWUFBU0MsVUFBVCxDQUFvQkMsS0FBcEIsRUFBMkI7QUFDekJBLFdBQU1DLEVBQU4sR0FBV0MsS0FBS0MsR0FBTCxFQUFYO0FBQ0FOLFVBQUtHLEtBQUw7QUFDRDtBQUNEUCxVQUFPVyxnQkFBUCxDQUF3QixPQUF4QixFQUFpQ0wsVUFBakM7QUFDRCxFQU5jLENBQWY7O0FBUUEsVUFBU00sUUFBVCxDQUFrQkMsT0FBbEIsRUFBMkI7QUFDekIsT0FBSUMsU0FBUyxJQUFiO0FBQ0EsVUFBTyxVQUFTUCxLQUFULEVBQWdCO0FBQ3JCLFNBQUlPLE1BQUosRUFBWTtBQUNWLFdBQUlQLE1BQU1DLEVBQU4sR0FBV00sTUFBWCxHQUFvQkQsT0FBeEIsRUFBaUM7QUFDL0IsZ0JBQU8sS0FBUDtBQUNEO0FBQ0Y7QUFDREMsY0FBU1AsTUFBTUMsRUFBZjtBQUNBLFlBQU8sSUFBUDtBQUNELElBUkQ7QUFTRDs7QUFFRCxLQUFNTyxlQUFlSCxTQUFTLElBQVQsQ0FBckI7QUFDQSxLQUFJSSxVQUFVLENBQWQ7QUFDQWIsUUFDR2MsTUFESCxDQUNVRixZQURWLEVBRUdHLEdBRkgsQ0FFTztBQUFBLFVBQVNsQixPQUFPbUIsV0FBUCxtQkFBbUMsRUFBR0gsT0FBdEMsV0FB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QUF0QixFQUFrQztBQUN2QyxTQUFNbEUsU0FBUzBCLE9BQU8sVUFBQ3pCLElBQUQsRUFBT0MsS0FBUCxFQUFpQjtBQUNyQztBQUNBLFdBQU1xQyxNQUFNMkIsT0FBWjtBQUNBLFdBQUkzQixJQUFJdEMsSUFBUixFQUFjO0FBQ1osYUFBTTZFLFlBQVl2QyxHQUFsQjtBQUNBTSxpQkFBUWtDLEdBQVIsQ0FBWUQsU0FBWjtBQUNBLGFBQUlFLE1BQU1GLFVBQVU3RSxJQUFWLEVBQVY7QUFDQSxnQkFBTSxDQUFDK0UsSUFBSUMsSUFBWCxFQUFpQjtBQUNmaEYsZ0JBQUsrRSxJQUFJZCxLQUFUO0FBQ0FjLGlCQUFNRixVQUFVN0UsSUFBVixFQUFOO0FBQ0Q7QUFDREEsY0FBSytFLElBQUlkLEtBQVQ7QUFDRCxRQVRELE1BU087QUFDTGpFLGNBQUtpRSxLQUFMO0FBQ0Q7QUFDRixNQWZjLENBQWY7QUFnQkEsWUFBT2xFLE1BQVA7QUFDRDtBQUNELFVBQU8wQixPQUFPLFVBQVN6QixJQUFULEVBQWVDLEtBQWYsRUFBc0I7QUFDbENELFVBQUtpRSxLQUFMO0FBQ0QsSUFGTSxDQUFQO0FBR0QsRUE5Q0Q7O21CQWdEZXhDLE0iLCJmaWxlIjoidHlwaG9vb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDJlODc1NjU1NmIwZTNhZGI2YTgxXG4gKiovIiwiaW1wb3J0IFR5cGhvb29uIGZyb20gJy4uL3NyYydcblxuY29uc3QgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ1dHRvbicpXG5cbmNvbnN0IHN0cmVhbSA9IFR5cGhvb29uKChuZXh0LCBlcnJvcikgPT4ge1xuICBmdW5jdGlvbiB0aW1lZEV2ZW50KGV2ZW50KSB7XG4gICAgZXZlbnQudHMgPSBEYXRlLm5vdygpXG4gICAgbmV4dChldmVudClcbiAgfVxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aW1lZEV2ZW50KVxufSlcblxuZnVuY3Rpb24gZGVib3VuY2UodGltZW91dCkge1xuICBsZXQgcmVjb3JkID0gbnVsbFxuICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAocmVjb3JkKSB7XG4gICAgICBpZiAoZXZlbnQudHMgLSByZWNvcmQgPCB0aW1lb3V0KSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICByZWNvcmQgPSBldmVudC50c1xuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cblxuY29uc3QgZGVib3VuY2UxMDAwID0gZGVib3VuY2UoMTAwMClcbmxldCBjb3VudGVyID0gMFxuc3RyZWFtXG4gIC5maWx0ZXIoZGVib3VuY2UxMDAwKVxuICAubWFwKGV2ZW50ID0+IGJ1dHRvbi50ZXh0Q29udGVudCA9IGBiZSBjbGlja2VkICR7KysgY291bnRlcn0gdGltZXNgKVxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vZGVtby90aHJvdHRsZS5qc1xuICoqLyIsImZ1bmN0aW9uIGVycm9yUHJvcG9nYXRpb24oc291cmNlcywgdGFyZ2V0LCBoYW5kbGVyKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZXMpKSB7XG4gICAgc291cmNlcy5mb3JFYWNoKHNyYyA9PiBlcnJvclByb3BvZ2F0aW9uKHNyYywgdGFyZ2V0LCBoYW5kbGVyKSlcbiAgfSBlbHNlIHtcbiAgICBpZiAoc291cmNlcy5jYXVnaHRFcnJvcikge1xuICAgICAgdGFyZ2V0LmNhdWdodEVycm9yID0gc291cmNlcy5jYXVnaHRFcnJvclxuICAgICAgc291cmNlcy5jYXVnaHRFcnJvciA9IG51bGxcbiAgICAgIGhhbmRsZXIodGFyZ2V0LmNhdWdodEVycm9yKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBTdHJlYW0gPSBmdW5jdGlvbihpbml0aWFsaXplKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTdHJlYW0pKSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0oaW5pdGlhbGl6ZSlcbiAgfVxuICB0aGlzLnN0YXR1cyA9ICdsaXZlJ1xuICB0aGlzLnN1YnNjcmliZXJzID0gW11cbiAgdGhpcy5jYXRjaGVycyA9IFtdXG4gIC8vIEZvciAnaG90JyBvYnNlcnZhYmxlXG4gIHRoaXMucXVldWUgPSBbXVxuICB0aGlzLmNhdWdodEVycm9yID0gbnVsbFxuICB0aGlzLnJlbW92ZXIgPSBudWxsXG5cbiAgaWYgKGluaXRpYWxpemUgJiYgdHlwZW9mKGluaXRpYWxpemUpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucmVtb3ZlciA9IGluaXRpYWxpemUuY2FsbChcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5fbmV4dC5iaW5kKHRoaXMpLFxuICAgICAgICB0aGlzLl9lcnJvci5iaW5kKHRoaXMpXG4gICAgICApXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLl9lcnJvcihlcnIpXG4gICAgfVxuICB9XG59XG5cblN0cmVhbS5wcm90b3R5cGUuX25leHQgPSBmdW5jdGlvbih2YWwpIHtcbiAgaWYgKHRoaXMuc3RhdHVzID09PSAnZXJyb3InKSByZXR1cm5cbiAgdHJ5IHtcbiAgICB0aGlzLnF1ZXVlLnB1c2godmFsKVxuICAgIHRoaXMuc3Vic2NyaWJlcnMuZm9yRWFjaChzdWIgPT4gc3ViKHZhbCkpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRoaXMuX2Vycm9yKGVycilcbiAgfVxufVxuXG5TdHJlYW0ucHJvdG90eXBlLl9lcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICBpZiAodGhpcy5zdGF0dXMgPT09ICdlcnJvcicpIHtcbiAgICByZXR1cm5cbiAgfVxuICB0aGlzLnN0YXR1cyA9ICdlcnJvcidcbiAgaWYgKHRoaXMuY2F0Y2hlcnMubGVuZ3RoID4gMCkge1xuICAgIC8vIG9ubHkgb25lIGNhdGNoZXIgd2lsbCBjYXRjaCB0aGUgZXJyb3JcbiAgICB0aGlzLmNhdGNoZXJzWzBdKGNhdCA9PiBjYXQoZXJyKSlcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNhdWdodEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VuaGFuZGxlIFR5cGhvb29uIGVycm9yOicsIGVycilcbiAgICAgIH1cbiAgICB9LCAwKVxuICAgIHRoaXMuY2F1Z2h0RXJyb3IgPSBlcnJcbiAgfVxufVxuXG5TdHJlYW0ucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih2YWwpIHtcbiAgdGhpcy5fbmV4dCh2YWwpXG59XG5cblN0cmVhbS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24obWFwcGVyKSB7XG4gIGNvbnN0IHsgc3Vic2NyaWJlcnMsIHF1ZXVlLCBjYXVnaHRFcnJvciB9ID0gdGhpc1xuICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIHN1YnNjcmliZXJzLnB1c2godmFsID0+IG5leHQobWFwcGVyLmNhbGwodGhpcywgdmFsLCBxdWV1ZS5sZW5ndGggLSAxLCB0aGlzKSkpXG4gICAgcXVldWUuZm9yRWFjaCgodmFsLCBpbmRleCkgPT4gbmV4dChtYXBwZXIuY2FsbCh0aGlzLCB2YWwsIGluZGV4LCB0aGlzKSkpXG4gICAgLy8gZXJyb3IgcHJvcG9nYXRpb25cbiAgICB0aGlzLmNhdWdodEVycm9yID0gY2F1Z2h0RXJyb3JcbiAgICBlcnJvclByb3BvZ2F0aW9uKF90aGlzLCB0aGlzLCBlcnJvcilcbiAgfSlcbn1cblxuU3RyZWFtLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24odGhlbmVyKSB7XG4gIHJldHVybiB0aGlzLm1hcCh0aGVuZXIpXG59XG5cblN0cmVhbS5wcm90b3R5cGUuY2F0Y2ggPSBmdW5jdGlvbihjYXRjaGVyKSB7XG4gIHRoaXMuY2F0Y2hlcnMucHVzaChjYXRjaGVyKVxuICBjYXRjaGVyKHRoaXMuY2F1Z2h0RXJyb3IpXG4gIHRoaXMuY2F1Z2h0RXJyb3IgPSBudWxsXG4gIHJldHVybiB0aGlzXG59XG5cblN0cmVhbS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24ocHJlZGljdG9yKSB7XG4gIGNvbnN0IHsgc3Vic2NyaWJlcnMsIHF1ZXVlLCBjYXVnaHRFcnJvciB9ID0gdGhpc1xuICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIHN1YnNjcmliZXJzLnB1c2goKHZhbCkgPT4ge1xuICAgICAgaWYgKHByZWRpY3Rvci5jYWxsKHRoaXMsIHZhbCkpIHtcbiAgICAgICAgbmV4dCh2YWwpXG4gICAgICB9XG4gICAgfSlcbiAgICBxdWV1ZVxuICAgICAgLmZvckVhY2goKGFyZ3MsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmIChwcmVkaWN0b3IuY2FsbCh0aGlzLCB2YWwpKSB7XG4gICAgICAgICAgbmV4dCh2YWwpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgZXJyb3JQcm9wb2dhdGlvbihfdGhpcywgdGhpcywgZXJyb3IpXG4gIH0pXG59XG5cbi8vIFRPRE86IGFsaWduIHdpdGggQXJyYXkgY29uY2F0XG5TdHJlYW0ucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIF90aGlzLnN1YnNjcmliZXJzLnB1c2gobmV4dClcbiAgICBzdHJlYW0ubWFwKG5leHQpXG4gICAgZXJyb3JQcm9wb2dhdGlvbihbX3RoaXMsIHN0cmVhbV0sIHRoaXMsIGVycm9yKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBfdGhpcy5yZW1vdmUoKVxuICAgICAgdGhpcy5yZW1vdmUoKVxuICAgIH1cbiAgfSlcbn1cblxuU3RyZWFtLnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbihyZWR1Y2VyLCBpbml0VmFsdWUpIHtcbiAgY29uc3QgeyBzdWJzY3JpYmVycywgcXVldWUgfSA9IHRoaXNcbiAgY29uc3QgX3RoaXMgPSB0aGlzXG4gIHJldHVybiBTdHJlYW0oZnVuY3Rpb24obmV4dCwgZXJyb3IpIHtcbiAgICBuZXh0KHF1ZXVlLnJlZHVjZShyZWR1Y2VyLCBpbml0VmFsdWUpKVxuICAgIHN1YnNjcmliZXJzLnB1c2goZnVuY3Rpb24odmFsKSB7XG4gICAgICBuZXh0KHF1ZXVlLnJlZHVjZShyZWR1Y2VyLCBpbml0VmFsdWUpKVxuICAgIH0pXG4gICAgZXJyb3JQcm9wb2dhdGlvbihfdGhpcywgdGhpcywgZXJyb3IpXG4gIH0pXG59XG5cbi8vIFRPRE86IG5lZWRlZD9cblN0cmVhbS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oY2F0Y2hlcikge1xuICBpZiAodGhpcy5yZW1vdmVyICYmIHR5cGVvZih0aGlzLnJlbW92ZXIpID09PSAnZnVuY3Rpb24nKVxuICB0aGlzLnJlbW92ZXIoKVxuICByZXR1cm4gdGhpc1xufVxuXG5TdHJlYW0uYWxsID0gZnVuY3Rpb24oYXJyKSB7XG4gIHJldHVybiBTdHJlYW0oKG5leHQsIGVycm9yKSA9PiB7XG4gICAgYXJyLmZvckVhY2goc3RyZWFtID0+IHtcbiAgICAgIHN0cmVhbS5tYXAobmV4dClcbiAgICAgIHRoaXMuZXJyb3JRdWV1ZSA9IHRoaXMuZXJyb3JRdWV1ZS5jb25jYXQoc3RyZWFtLmVycm9yUXVldWUpXG4gICAgfSlcbiAgICBcbiAgICByZXR1cm4gYXJyLnJlZHVjZSgoYWNjdSwgc3RyZWFtKSA9PiB7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBhY2N1KClcbiAgICAgICAgc3RyZWFtKClcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbigpIHt9KVxuICB9KVxufVxuXG5TdHJlYW0ucmFjZSA9IGZ1bmN0aW9uKCkge1xuXG59XG5cblN0cmVhbS5mcm9tID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHR5cGVvZihIVE1MRWxlbWVudCkgIT09ICd1bmRlZmluZWQnICYmIHZhbHVlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICByZXR1cm4gU3RyZWFtKGZ1bmN0aW9uKG5leHQsIGVycm9yKSB7XG4gICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9ucykge1xuICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihtdXRhdGlvbikge1xuICAgICAgICAgIG5leHQobXV0YXRpb24pXG4gICAgICAgIH0pICAgIFxuICAgICAgfSlcbiAgICAgIG9ic2VydmVyLm9ic2VydmUodmFsdWUsIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgfSlcbiAgICB9KVxuICAgIFxuICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgIHJldHVybiBTdHJlYW0oZnVuY3Rpb24obmV4dCwgZXJyb3IpIHtcbiAgICAgIHZhbHVlLnRoZW4obmV4dClcbiAgICB9KVxuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgICAgdmFsdWUuZm9yRWFjaChuZXh0KVxuICAgIH0pXG4gIH0gZWxzZSBpZiAodHlwZW9mKHZhbHVlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHN0cmVhbSA9IFN0cmVhbSgobmV4dCwgZXJyb3IpID0+IHtcbiAgICAgIC8vIGdlbmVyYXRvclxuICAgICAgY29uc3QgdmFsID0gdmFsdWUoKVxuICAgICAgaWYgKHZhbC5uZXh0KSB7XG4gICAgICAgIGNvbnN0IGdlbmVyYXRvciA9IHZhbFxuICAgICAgICBjb25zb2xlLmxvZyhnZW5lcmF0b3IpXG4gICAgICAgIGxldCBjdXIgPSBnZW5lcmF0b3IubmV4dCgpXG4gICAgICAgIHdoaWxlKCFjdXIuZG9uZSkge1xuICAgICAgICAgIG5leHQoY3VyLnZhbHVlKVxuICAgICAgICAgIGN1ciA9IGdlbmVyYXRvci5uZXh0KClcbiAgICAgICAgfVxuICAgICAgICBuZXh0KGN1ci52YWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQodmFsdWUpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gc3RyZWFtXG4gIH1cbiAgcmV0dXJuIFN0cmVhbShmdW5jdGlvbihuZXh0LCBlcnJvcikge1xuICAgIG5leHQodmFsdWUpXG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IFN0cmVhbVxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==