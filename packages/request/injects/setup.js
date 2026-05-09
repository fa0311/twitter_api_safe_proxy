// ref: https://github.com/tsukumijima/KonomiTV/blob/master/server/static/zendriver_setup.js

(async () => {
	globalThis.elonmusk_114514_wait_startup = (() => {
		let resolveStartup;
		return {
			resolve: () => {
				if (resolveStartup) {
					resolveStartup();
					resolveStartup = null;
				}
			},
			promise: new Promise((resolve) => {
				resolveStartup = resolve;
			}),
		};
	})();

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

	const debugValueOf = (value) => {
		if (value instanceof Error) {
			return {
				name: value.name,
				message: value.message,
				stack: value.stack,
			};
		}
		if (value instanceof Headers || value instanceof URLSearchParams) {
			return Object.fromEntries(value.entries());
		}
		if (value instanceof URL) {
			return value.toString();
		}

		try {
			return structuredClone(value);
		} catch {
			try {
				const seen = new WeakSet();
				const json = JSON.stringify(value, (_key, item) => {
					if (item instanceof Error) {
						return {
							name: item.name,
							message: item.message,
							stack: item.stack,
						};
					}
					if (item instanceof Headers || item instanceof URLSearchParams) {
						return Object.fromEntries(item.entries());
					}
					if (item instanceof URL) {
						return item.toString();
					}
					if (typeof item === "bigint") {
						return item.toString();
					}
					if (typeof item === "function") {
						return `[Function ${item.name || "anonymous"}]`;
					}
					if (item && typeof item === "object") {
						if (seen.has(item)) {
							return "[Circular]";
						}
						seen.add(item);
					}
					return item;
				});
				return json === undefined ? String(value) : JSON.parse(json);
			} catch {
				return String(value);
			}
		}
	};

	const emitDebug = (entry) => {
		const emit = globalThis.elonmusk_114514_emit_debug;
		if (!emit) {
			return;
		}

		try {
			const result = emit(entry);
			if (result && typeof result.catch === "function") {
				result.catch(() => {});
			}
		} catch {
			// Debug capture should never affect the page request itself.
		}
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
									instance.dispatch = (...args) => {
										const request = debugValueOf(args);
										try {
											const result = target.prototype.dispatch.apply(instance, args);
											Promise.resolve(result).then(
												(response) => emitDebug({ request, response: debugValueOf(response) }),
												(error) => emitDebug({ request, error: debugValueOf(error) }),
											);
											return result;
										} catch (error) {
											emitDebug({ request, error: debugValueOf(error) });
											throw error;
										}
									};
									resolve(instance);
									globalThis.elonmusk_114514_wait_startup.resolve();
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
