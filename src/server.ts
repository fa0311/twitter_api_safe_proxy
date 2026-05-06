import fs from "node:fs/promises";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "./utils/logger.js";
import { createProfile } from "./utils/profile.js";
import { loadSettings } from "./utils/settings.js";

const data = await fs.readFile("settings.json", "utf-8");
const settings = await loadSettings(JSON.parse(data));

logger.init({
	level: settings.logLevel,
	prettyPrint: settings.logPrettyPrint,
});

logger.info("Settings loaded successfully");

const clients = await Promise.all(
	settings.profiles.map(async (profile) => {
		logger.info(`Profile: ${profile.name}, Browser: ${profile.browserType}`);
		return await createProfile({
			browserType: profile.browserType,
			sleep: 5000,
			options: {
				headless: profile.browser.headless,
				executablePath: profile.browser.executablePath,
				env: profile.browser.env,
				proxy: profile.browser.proxy,
				args: ["--disable-blink-features=AutomationControlled", ...profile.browser.args],
				viewport: profile.browser.viewport,
			},
			homeUrl: profile.home.url,
			userDataDir: profile.browser.userDataDir,
		});
	}),
);

const getClient = () => clients[0]!;

logger.info(`🚀 Server starting on http://localhost:${settings.port}`);

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
	port: 3000,
});
