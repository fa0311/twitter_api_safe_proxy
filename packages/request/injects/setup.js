// ref: https://github.com/tsukumijima/KonomiTV/blob/master/server/static/zendriver_setup.js

(async () => {
	const objectMocker = async (target, name) => {
		let value = target[name];

		return await new Promise((resolve) => {
			Object.defineProperty(target, name, {
				configurable: true,
				get: () => value,
				set(nextValue) {
					value = nextValue;
					Object.defineProperty(target, name, {
						configurable: true,
						writable: true,
						value: nextValue,
					});
					resolve(nextValue);
				},
			});
		});
	};

	globalThis.elonmusk_114514_request = async ({ property, query }) => {
		console.log(`Requesting ${property} with query:`, query);
		return client[property].apply(client, query);
	};

	const chunkArray = await objectMocker(window, "webpackChunk_twitter_responsive_web");

	const originalPush = chunkArray.push;
	const client = await new Promise((resolve) => {
		chunkArray.push = (chunk) => {
			const modules = chunk[1];
			if (modules && typeof modules === "object") {
				for (const moduleId of Object.keys(modules)) {
					const originalFactory = modules[moduleId];
					modules[moduleId] = function (module, _exports, require) {
						const originalDefineExports = require.d;
						require.d = (exp, definition) => {
							for (const key in definition) {
								Object.defineProperty(exp, key, {
									enumerable: true,
									configurable: true,
									get: definition[key],
								});
							}
						};
						const result = originalFactory.apply(this, arguments);
						require.d = originalDefineExports;

						const propertyDescriptors = Object.getOwnPropertyDescriptors(module.exports);
						for (const [exportKey, _descriptor] of Object.entries(propertyDescriptors)) {
							const originalClass = module.exports[exportKey];
							if (typeof originalClass !== "function") {
								continue;
							}
							if (originalClass.prototype === undefined) {
								continue;
							}
							if (typeof originalClass.prototype.dispatch !== "function") {
								continue;
							}
							if (typeof originalClass.prototype.get !== "function") {
								continue;
							}
							if (typeof originalClass.prototype.post !== "function") {
								continue;
							}
							if (typeof originalClass.prototype.delete !== "function") {
								continue;
							}

							const constructionProxy = new Proxy(originalClass, {
								construct(target, args, newTarget) {
									const instance = Reflect.construct(target, args, newTarget);
									if (Array.isArray(globalThis.elonmusk_114514_enable_debug)) {
										instance.dispatch = (...args) => {
											globalThis.elonmusk_114514_enable_debug.push(args);
											return target.prototype.dispatch.apply(instance, args);
										};
									}
									resolve(instance);
									return instance;
								},
							});

							Object.defineProperty(module.exports, exportKey, {
								enumerable: true,
								configurable: true,
								get: () => constructionProxy,
							});
						}

						return result;
					};
				}
			}
			return originalPush(chunk);
		};
	});
	chunkArray.push = originalPush;

	console.log("Twitter API client found");
})();
