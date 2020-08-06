const EventEmitter = require("events");

const FAILURE = 1;
const SUCCESS = 0;

const CLOSED = "closed";
const OPEN = "open";
const HALF = "half";

class CircuitBreaker extends EventEmitter {
  constructor(request, circuitBreakerOptions) {
    super();

    const circuitBreakerDefault = {
      failureThreshold: 50,
      successThreshold: 5,
      openInterval: 6000,
      sampleSize: 10,
      minSampleSize: 1,
      intervalToHalfOpen: 4000,
    };

    Object.assign(this, circuitBreakerDefault, circuitBreakerOptions, {
      _request: request,
      _state: CLOSED,
      _nextAttempt: Date.now(),
      _currentWindow: [],
      _successCount: 0,
      _failurePercentile: 0,
      _timerToHalfOpen: null,
    });
  }

  async fire(params, fallback) {
    this._resetTimerToHalf();
    if (this._state === OPEN) {
      if (this._nextAttempt <= Date.now()) {
        this._changeState(HALF);
      } else {
        if (fallback) {
          try {
            return fallback();
          } catch (err) {
            return this.fail(err);
          }
        }
        throw new Error("Circuit is currently OPEN");
      }
    }
    try {
      const response = await this._request(params);
      return this.success(response);
    } catch (err) {
      return this.fail(err);
    }
  }

  success(response) {
    if (this._state === HALF) {
      this._successCount++;
      if (this._shouldCloseCircuit()) {
        this._resetAndCloseCircuit();
      }
    }

    this._pushCurrentWindow(SUCCESS);
    return response;
  }

  fail(err) {
    if (this._shouldOpenCircuit()) {
      this._openCircuit();
    }
    this._pushCurrentWindow(FAILURE);
    return err;
  }

  _pushCurrentWindow(status) {
    if (this._currentWindow.length === this.sampleSize) {
      this._currentWindow.shift();
    }
    this._currentWindow.push(status);
  }

  _shouldCloseCircuit() {
    return this._successCount > this.successThreshold;
  }

  _shouldOpenCircuit() {
    if (this._currentWindow.length < this.minSampleSize) return false;

    const total = this._currentWindow.reduce(
      (first, second) => first + second,
      0
    );
    this._failurePercentile = (total / this._currentWindow.length) * 100;
    return this._failurePercentile >= this.failureThreshold;
  }

  _resetAndCloseCircuit() {
    this.successCount = 0;
    this._changeState(CLOSED);
    this._currentWindow = [];
    this._failurePercentile = 0;
    this._resetTimerToHalf();
  }

  _openCircuit() {
    this._changeState(OPEN);
    this._nextAttempt = Date.now() + this.openInterval;
    this._timerToHalfOpen = setTimeout(() => {
      this._changeState(HALF);
    }, this.intervalToHalfOpen);
  }

  _resetTimerToHalf() {
    clearInterval(this._timerToHalfOpen);
  }

  _changeState(state) {
    this._state = state;
    this.emit(this._state, {
      currentWindow: this._currentWindow,
      failurePercentile: this._failurePercentile,
    });
  }
}

module.exports = CircuitBreaker;
