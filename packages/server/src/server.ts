#!/usr/bin/env node
import fs from "node:fs/promises";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import pino from "pino";
import { chromium, firefox, webkit } from "playwright";
import { createTwitterClient } from "twitter-api-safe-request";
import { loadSettings } from "./utils/settings.js";

const fileExists = async (path: string) => {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
};

const getSettingsPath = async () => {
	const settingsWithValue = process.argv.find((arg) => arg.startsWith("--settings="));
	if (settingsWithValue) {
		return settingsWithValue.slice("--settings=".length);
	}

	const settingsIndex = process.argv.indexOf("--settings");
	if (settingsIndex !== -1) {
		const value = process.argv[settingsIndex + 1];
		if (!value) {
			throw new Error("--settings requires a file path");
		}
		return value;
	}

	if (process.env.TWITTER_API_SAFE_PROXY_SETTINGS) {
		return process.env.TWITTER_API_SAFE_PROXY_SETTINGS;
	}

	if (await fileExists("settings.json")) {
		return "settings.json";
	}

	if (await fileExists("../../settings.json")) {
		return "../../settings.json";
	}

	return "settings.json";
};

const data = await fs.readFile(await getSettingsPath(), "utf-8");
const settings = await loadSettings(JSON.parse(data));

const logger = pino({
	transport: settings.logPrettyPrint ? { target: "pino-pretty" } : undefined,
	level: settings.logLevel,
	timestamp: pino.stdTimeFunctions.isoTime,
});

logger.info("Settings loaded successfully");

const clients = await Promise.all(
	settings.profiles.map(async (profile) => {
		logger.info(`Profile: ${profile.name}, Browser: ${profile.browserType}`);
		const browser = { chromium, firefox, webkit }[profile.browserType];
		const context = await browser.launchPersistentContext(profile.browser.userDataDir, {
			headless: profile.browser.headless,
			executablePath: profile.browser.executablePath,
			env: profile.browser.env,
			proxy: profile.browser.proxy,
			args: ["--disable-blink-features=AutomationControlled", ...profile.browser.args],
			viewport: profile.browser.viewport,
		});
		const page = await context.newPage();
		const client = await createTwitterClient(page);
		await page.goto(profile.home.url);
		return client;
	}),
);

const getClient = () => clients[0]!;

logger.info(`Server starting on http://localhost:${settings.port}`);

const app = new Hono();

const parseJsonParam = <T>(value: string | undefined): T | undefined => {
	if (!value) return undefined;
	return JSON.parse(value) as T;
};

app.get("/i/api/graphql/:queryId/:operationName", async (c) => {
	const queryId = c.req.param("queryId");
	const operationName = c.req.param("operationName");

	const variables = parseJsonParam(c.req.query("variables"));
	const features = parseJsonParam(c.req.query("features"));
	const fieldToggles = parseJsonParam(c.req.query("fieldToggles"));

	const client = getClient();
	const result = await client.graphQLFullResponse(
		{
			queryId,
			operationName,
			operationType: "query",
			metadata: {
				featureSwitches: Object.keys(features ?? {}),
				fieldToggles: Object.keys(fieldToggles ?? {}),
			},
		},
		variables,
	);
	return c.json(result);
});

app.post("/i/api/graphql/:queryId/:operationName", async (c) => {
	const queryId = c.req.param("queryId");
	const operationName = c.req.param("operationName");
	const requestBody = await c.req.json();

	const variables = requestBody?.variables ?? {};
	const features = requestBody?.features ?? {};

	const client = getClient();

	const result = await client.graphQLFullResponse(
		{
			queryId,
			operationName,
			operationType: "mutation",
			metadata: {
				featureSwitches: Object.keys(features),
				fieldToggles: [],
			},
		},
		variables,
	);
	return c.json(result);
});

serve({
	fetch: app.fetch,
	port: settings.port,
});
