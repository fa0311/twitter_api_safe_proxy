import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type BrowserContext, chromium } from "playwright";

type Cleanup = () => Promise<void> | void;

export type Integration = {
	temp: () => Promise<string>;
	browser: () => Promise<BrowserContext>;
	cleanup: (fn: Cleanup) => void;
	afterEachCall: () => Promise<void>;
};

export const createIntegration = (): Integration => {
	const cleanupFns: Cleanup[] = [];

	const cleanup = (fn: Cleanup) => {
		cleanupFns.push(fn);
	};

	const temp = async () => {
		const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "twitter-api-safe-test-"));
		cleanup(() => fs.promises.rm(tempDir, { recursive: true, force: true }));
		return tempDir;
	};

	const browser = async () => {
		const context = await chromium.launchPersistentContext(await temp(), {
			headless: true,
		});
		cleanup(() => context.close());
		return context;
	};

	const afterEachCall = async () => {
		for (const fn of cleanupFns.splice(0).reverse()) {
			await fn();
		}
	};

	return { temp, browser, cleanup, afterEachCall };
};
