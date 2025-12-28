// https://github.com/fa0311/twitter_api_browser_python/blob/main/twitter_api_browser_python/inject/operation.js
(async () => {
  globalThis.elonmusk_114514_operation = [];
  const origCall = Function.prototype.call;
  Function.prototype.call = function (thisArg, ...args) {
    const module = args[0];
    const ret = origCall.bind(this)(thisArg, ...args);
    try {
      const exp = module.exports;
      if (exp.operationName) {
        globalThis.elonmusk_114514_operation.push(exp);
      }
    } catch (_) {}
    return ret;
  };
  await new Promise((resolve) => setTimeout(resolve, 5000));
  Function.prototype.call = origCall;
})();