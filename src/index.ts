import fs from "node:fs/promises";
import { logger } from "./utils/logger.js";
import { createProfile } from "./utils/profile.js";
import { loadSettings } from "./utils/settings.js";

const main = async () => {
	const data = await fs.readFile("settings.json", "utf-8");
	const settings = await loadSettings(JSON.parse(data));

	logger.init({
		level: settings.logLevel,
		prettyPrint: settings.logPrettyPrint,
	});

	logger.info("Settings loaded successfully");

	for (const profile of settings.profiles) {
		logger.info(`Profile: ${profile.name}, Browser: ${profile.browserType}`);
		const twitter = await createProfile({
			browserType: profile.browserType,
			sleep: 5000,

			options: {
				headless: profile.browser.headless,
				executablePath: profile.browser.executablePath,
				env: profile.browser.env,
				proxy: profile.browser.proxy,
				args: ["--disable-blink-features=AutomationControlled", ...(profile.browser.args ?? [])],
				viewport: profile.browser.viewport,
			},
			homeUrl: profile.home.url,
			userDataDir: profile.browser.userDataDir,
		});

		const op = twitter.getOperation("HomeTimeline");
		try {
			const res = await twitter.graphql({
				method: op.getMethod(),
				path: op.getPath(),
				body: {
					variables: {
						count: 20,
						includePromotedContent: true,
						latestControlAvailable: true,
						withCommunity: true,
					},
					queryId: op.getQueryId(),
					features: op.getFeatures({}, "ignore"),
					fieldToggles: op.createFieldToggles({}, "keep"),
				},
			});
			await fs.writeFile(`output_${profile.name}_home_timeline.json`, JSON.stringify(res, null, 2), "utf-8");
			console.log(JSON.stringify(res, null, 2));
		} catch (e) {}
	}
};

// スクリプトを実行
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
