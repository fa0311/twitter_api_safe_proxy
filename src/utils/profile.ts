import fs from "node:fs/promises";
import { type BrowserType, chromium, firefox, webkit } from "playwright";

type Profile = {
	browserType: "chromium" | "firefox" | "webkit";
	userDataDir: string;
	options: Parameters<BrowserType["launchPersistentContext"]>[1];
	homeUrl: string;
	sleep: number;
};

type GraphQLRequest = {
	queryId: string;
	operationName: string;
	operationType: "query" | "mutation";
	metadata: {
		featureSwitches: string[];
		fieldToggles: string[];
	};
};

export const createProfile = async (profile: Profile) => {
	const injectSetupScript = await fs.readFile("injects/setup.js", "utf-8");

	const browser = { chromium: chromium, firefox: firefox, webkit: webkit }[profile.browserType];
	const launch = await browser.launchPersistentContext(profile.userDataDir, profile.options);
	const page = await launch.newPage();
	await page.addInitScript("globalThis.elonmusk_114514_enable_debug = []");
	await page.addInitScript(injectSetupScript);
	await page.goto(profile.homeUrl);

	const graphQL = async (param: GraphQLRequest, body: any) => {
		// @ts-expect-error
		return await page.evaluate((e) => globalThis.elonmusk_114514_request(e), {
			property: "graphQL",
			query: [param, body],
		});
	};

	const graphQLFullResponse = async (param: GraphQLRequest, body: any) => {
		// @ts-expect-error
		return await page.evaluate((e) => globalThis.elonmusk_114514_request(e), {
			property: "graphQLFullResponse",
			query: [param, body],
		});
	};

	const log = async () => {
		// @ts-expect-error
		const result = await page.evaluate(() => globalThis.elonmusk_114514_enable_debug);
		return result;
	};

	return { graphQL, graphQLFullResponse, log };
};
