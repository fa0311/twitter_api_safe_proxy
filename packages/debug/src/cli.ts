import path from "node:path";
import { serve } from "@hono/node-server";
import { chromium } from "playwright";
import { createTwitterClient } from "twitter-api-safe-request";
import { createDebugApp } from "./app.js";

type CliOptions = {
	userDataDir: string;
};

const parseArgs = (args: string[]): CliOptions => {
	const options: CliOptions = {
		userDataDir: "./user_data/debug",
	};

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		const next = args[index + 1];

		if ((arg === "--user-data-dir" || arg === "-u") && next) {
			options.userDataDir = next;
			index += 1;
		}
	}

	return options;
};

const main = async () => {
	const options = parseArgs(process.argv.slice(2));
	const { app, emit } = createDebugApp();
	const server = serve({ fetch: app.fetch, port: 3001 });

	console.log("Debug UI: http://localhost:3002");
	console.log("Debug API: http://localhost:3001/debug/events");
	console.log(`User data dir: ${path.resolve(options.userDataDir)}`);

	const context = await chromium.launchPersistentContext(options.userDataDir, {
		headless: false,
		args: ["--disable-blink-features=AutomationControlled"],
	});

	const page = await context.newPage();

	const client = await createTwitterClient(page);

	void client.debugStream.pipeTo(new WritableStream({ write: emit }));
	await page.goto("https://x.com");
	await page.waitForURL("https://x.com/home");
	await client.waitStartup();
	await client.enableDebug();
};

await main();
