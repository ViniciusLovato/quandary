# quandary

Circuit Breaker

## How to use it

```javascript
const CircuitBreaker = require("quandary.js");

const itFailsSometimesRequest = () => {
  return new Promise((resolve, reject) => {
    if (Math.random() > 0.8) resolve("Yay!");
    else reject("Boooo");
  });
};

const circuitBreaker = new CircuitBreaker(itFailsSometimesRequest);

circuitBreaker.fire().then(console.log).catch(console.log);
```

## Custom configuration

Pass an object as param to customize

```javascript
const circuitBreakerOptions = {
  failureThreshold: 40,
  openInterval: 6000,
  successThreshold: 5,
  openInterval: 6000,
  sampleSize: 10,
  minSampleSize: 5,
};

const circuitBreaker = new CircuitBreaker(
  itFailsSometimesRequest,
  circuitBreakerOptions
);
```

`request`: Method to be wrapped inside the circuit breaker

`failureThreshold`: Percentage of failed method executions to
open the circuit

`successThreshold`: Number of consecutive successul method executions to transition from HALF to CLOSED circuit

`openInterval`: Interval in milliseconds the circuit will remain OPEN until next try

`sampleSize`: Sample window size

`minSampleSize`: Minimum sample size to start calculating failureThreshold

## Fallback

It is possible to pass a fallback as a second argument of the function fire. The fallback will be called only when the circuit is in OPEN state

```javascript
const itFailsSometimesRequest = (params) => {
  return new Promise((resolve, reject) => {
    if (Math.random() > 0.8) resolve("Yay!" + params);
    else reject("Boooo");
  });
};

const fallback = () => {
  return "Fallback for the rescue!";
};

breaker
  .fire({ data: "Just a param" }, fallback)
  .then(console.log)
  .catch(console.log);
```

## Events

```javascript
const breaker = new CircuitBreaker(itFailsSometimesRequest);

breaker.on("half", () => {
  console.log("Circuit breaker is halfOpen");
});
breaker.on("open", () => {
  console.log("Circuit breaker is open");
});
breaker.on("close", () => {
  console.log("Circuit breaker is closed");
});
```
