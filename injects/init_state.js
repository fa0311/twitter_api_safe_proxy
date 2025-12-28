// https://github.com/fa0311/twitter_api_browser_python/blob/main/twitter_api_browser_python/inject/init_state.js
(async () => {
  const init_state_promise = new Promise((resolve) => {
    Object.defineProperty(window, "__INITIAL_STATE__", {
      configurable: true,
      enumerable: true,
      get() {
        return undefined;
      },
      set(v) {
        resolve(v);
        Object.defineProperty(window, "__INITIAL_STATE__", {
          value: v,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      },
    });
  });

  globalThis.elonmusk_114514_init_state = init_state_promise;
})();

