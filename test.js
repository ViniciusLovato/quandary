const CircuitBreaker = require("./CircuitBreaker.js");

const itFailsSometimesRequest = (params) => {
  return new Promise((resolve, reject) => {
    if (Math.random() > 0.5) resolve("Yay!" + params);
    else reject("Boooo");
  });
};

const fallback = () => {
  return "Fallback to the rescue!";
};

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

setInterval(() => {
  breaker
    .fire("parametro marotos", fallback)
    .then(console.log)
    .catch(console.log);
}, 1000);
