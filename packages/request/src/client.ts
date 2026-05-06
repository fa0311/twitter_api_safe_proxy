import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright";

export type GraphQLRequest = {
	queryId: string;
	operationName: string;
	operationType: "query" | "mutation";
	metadata: {
		featureSwitches: string[];
		fieldToggles: string[];
	};
};

export type TwitterApiProfileClient = {
	graphQL: (param: GraphQLRequest, body: unknown) => Promise<unknown>;
	graphQLFullResponse: (param: GraphQLRequest, body: unknown) => Promise<unknown>;
	log: () => Promise<unknown[]>;
	waitStartup: () => Promise<void>;
	page: Page;
};

declare global {
	var elonmusk_114514_request: (payload: unknown) => Promise<unknown>;
	var elonmusk_114514_enable_debug: unknown[];
	var elonmusk_114514_wait_startup: {
		promise: Promise<void>;
	};
}

const defaultInjectSetupScriptPath = fileURLToPath(new URL("../injects/setup.js", import.meta.url));

export const createTwitterClient = async (page: Page): Promise<TwitterApiProfileClient> => {
	const injectSetupScript = await fs.readFile(defaultInjectSetupScriptPath, "utf-8");
	await page.addInitScript("globalThis.elonmusk_114514_enable_debug = []");
	await page.addInitScript(injectSetupScript);

	const graphQL = async (param: GraphQLRequest, body: unknown) => {
		return await page.evaluate((request) => globalThis.elonmusk_114514_request(request), {
			property: "graphQL",
			query: [param, body],
		});
	};

	const graphQLFullResponse = async (param: GraphQLRequest, body: unknown) => {
		return await page.evaluate((request) => globalThis.elonmusk_114514_request(request), {
			property: "graphQLFullResponse",
			query: [param, body],
		});
	};

	const log = async () => {
		return await page.evaluate(() => globalThis.elonmusk_114514_enable_debug);
	};

	const waitStartup = async () => await page.evaluate(() => globalThis.elonmusk_114514_wait_startup.promise);

	return { graphQL, graphQLFullResponse, log, page, waitStartup };
};
