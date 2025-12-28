// https://github.com/fa0311/twitter_api_browser_python/blob/main/twitter_api_browser_python/inject/setup.js
(async () => {
  const __origApply = Function.prototype.apply;
  const client = await new Promise((resolve) => {
    Function.prototype.apply = function (thisArg, argsArray) {
      if (thisArg && typeof thisArg === "object" && thisArg.dispatch === this) {
        resolve(thisArg);
      }
      return __origApply.bind(this)(thisArg, argsArray);
    };
  });
  Function.prototype.apply = __origApply;
  globalThis.elonmusk_114514_request = async(query) => {
    return client.dispatch.apply(client, [query]);
  };
})();