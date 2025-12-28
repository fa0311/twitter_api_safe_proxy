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
	method: "GET" | "POST";
	path: string;
	body: {
		variables: any;
		queryId: string;
		features: Record<string, boolean> | undefined;
		fieldToggles: Record<string, boolean> | undefined;
	};
};

type OperationExp = {
	operationName: string;
	operationType: "query" | "mutation";
	queryId: string;
	metadata: {
		featureSwitches: string[];
		fieldToggles: string[];
	};
};

type InitState = {
	featureSwitch: {
		defaultConfig: {
			[key: string]: {
				value: boolean;
			};
		};
		user: {
			[key: string]: {
				value: boolean;
			};
		};
		debug: {
			[key: string]: {
				value: boolean;
			};
		};
		customOverrides: {
			[key: string]: {
				value: boolean;
			};
		};
	};
};

export const createProfile = async (profile: Profile) => {
	const injectSetupScript = await fs.readFile("injects/setup.js", "utf-8");
	const injectOperationScript = await fs.readFile("injects/operation.js", "utf-8");
	const injectInitStateScript = await fs.readFile("injects/init_state.js", "utf-8");

	const browser = { chromium: chromium, firefox: firefox, webkit: webkit }[profile.browserType];
	const launch = await browser.launchPersistentContext(profile.userDataDir, profile.options);
	const page = await launch.newPage();
	await page.addInitScript(injectOperationScript);
	await page.addInitScript(injectInitStateScript);
	await page.goto(profile.homeUrl);
	await page.evaluate(injectSetupScript);
	await new Promise((resolve) => setTimeout(resolve, profile.sleep));

	const operationList: OperationExp[] = await page.evaluate("globalThis.elonmusk_114514_operation");
	const initState: InitState = await page.evaluate("globalThis.elonmusk_114514_init_state");
	const flag = {
		...initState.featureSwitch.defaultConfig,
		...initState.featureSwitch.user,
		...initState.featureSwitch.debug,
		...initState.featureSwitch.customOverrides,
	};

	// 	{
	//     "data": {
	//         "variables": {
	//             "count": 20,
	//             "includePromotedContent": true,
	//             "latestControlAvailable": true,
	//             "requestContext": "launch",
	//             "withCommunity": true,
	//             "seenTweetIds": [
	//                 "2000212994471661978",
	//                 "2000240247767249237",
	//                 "2000051731854688723",
	//                 "1999999351406682390",
	//                 "2000026141193892201",
	//                 "2000054741716632011"
	//             ]
	//         },
	//         "features": {
	//             "rweb_video_screen_enabled": false,
	//             "profile_label_improvements_pcf_label_in_post_enabled": true,
	//             "responsive_web_profile_redirect_enabled": false,
	//             "rweb_tipjar_consumption_enabled": true,
	//             "verified_phone_label_enabled": false,
	//             "creator_subscriptions_tweet_preview_api_enabled": true,
	//             "responsive_web_graphql_timeline_navigation_enabled": true,
	//             "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
	//             "premium_content_api_read_enabled": false,
	//             "communities_web_enable_tweet_community_results_fetch": true,
	//             "c9s_tweet_anatomy_moderator_badge_enabled": true,
	//             "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
	//             "responsive_web_grok_analyze_post_followups_enabled": true,
	//             "responsive_web_jetfuel_frame": true,
	//             "responsive_web_grok_share_attachment_enabled": true,
	//             "articles_preview_enabled": true,
	//             "responsive_web_edit_tweet_api_enabled": true,
	//             "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
	//             "view_counts_everywhere_api_enabled": true,
	//             "longform_notetweets_consumption_enabled": true,
	//             "responsive_web_twitter_article_tweet_consumption_enabled": true,
	//             "tweet_awards_web_tipping_enabled": false,
	//             "responsive_web_grok_show_grok_translated_post": false,
	//             "responsive_web_grok_analysis_button_from_backend": true,
	//             "creator_subscriptions_quote_tweet_preview_enabled": false,
	//             "freedom_of_speech_not_reach_fetch_enabled": true,
	//             "standardized_nudges_misinfo": true,
	//             "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
	//             "longform_notetweets_rich_text_read_enabled": true,
	//             "longform_notetweets_inline_media_enabled": true,
	//             "responsive_web_grok_image_annotation_enabled": true,
	//             "responsive_web_grok_imagine_annotation_enabled": true,
	//             "responsive_web_grok_community_note_auto_translation_is_enabled": false,
	//             "responsive_web_enhance_cards_enabled": false
	//         },
	//         "queryId": "qIWNRQfRx-Rq2ybMont8rQ"
	//     },
	//     "headers": {
	//         "content-type": "application/json"
	//     },
	//     "method": "POST",
	//     "path": "/graphql/qIWNRQfRx-Rq2ybMont8rQ/HomeTimeline"
	// }

	const graphql = async (param: GraphQLRequest) => {
		const args = {
			headers: { "content-type": "application/json" },
			method: param.method,
			path: param.path,
		};
		const body = (() => {
			if (param.method === "GET") {
				const params = {
					queryId: param.body.queryId,
					variables: JSON.stringify(param.body.variables),
					features: param.body.features ? JSON.stringify(param.body.features) : undefined,
					// fieldToggles: param.body.fieldToggles ? JSON.stringify(param.body.fieldToggles) : undefined,
				};
				return { params };
			} else if (param.method === "POST") {
				return { data: param.body };
			}
		})();
		const aa = { ...args, ...body };
		return await page.evaluate((e) => globalThis.elonmusk_114514_request(e), aa);
	};

	const getOperation = (operation: string) => {
		const exp = operationList.find((v: any) => v.operationName === operation);

		if (!exp) {
			throw new Error(`Operation ${operation} not found`);
		}

		const featureSwitchesMap = Object.fromEntries(
			exp.metadata.featureSwitches.map((key: string) => [key, flag[key]?.value || false]),
		);

		const emptyToUndefined = <T>(obj: Record<string, T>) => {
			return Object.keys(obj).length === 0 ? undefined : obj;
		};

		const getMethod = () => {
			const methodMap = {
				query: "GET",
				mutation: "POST",
			} as const;
			return methodMap[exp.operationType];
		};

		const getQueryId = () => {
			return exp.queryId;
		};

		const getPath = () => {
			return `/graphql/${exp.queryId}/${operation}`;
		};

		const getFeatures = (features: Record<string, boolean>, mode: "ignore" | "override" | "strict") => {
			const featureSwitches = exp.metadata.featureSwitches;

			if (mode === "ignore") {
				return emptyToUndefined(featureSwitchesMap);
			} else if (mode === "override") {
				const filtered = Object.fromEntries(
					Object.entries(features).filter(([key, _]) => featureSwitches.includes(key)),
				);
				return emptyToUndefined({ ...featureSwitchesMap, ...filtered });
			} else if (mode === "strict") {
				const valid = Object.keys(features).find((key) => !(key in featureSwitches));
				if (valid) {
					throw new Error(`Feature switch ${valid} is not valid for operation ${operation}`);
				}
				const missing = Object.keys(featureSwitches).find((key) => !(key in features));
				if (missing) {
					throw new Error(`Feature switch ${missing} is missing for operation ${operation}`);
				}
				return emptyToUndefined(features);
			}
		};

		const createFieldToggles = (fieldToggles: Record<string, boolean>, mode: "keep" | "remove" | "strict") => {
			const fieldTogglesList = exp.metadata.fieldToggles;
			if (mode === "keep") {
				return emptyToUndefined(fieldToggles);
			} else if (mode === "remove") {
				const filtered = Object.fromEntries(
					Object.entries(fieldToggles).filter(([key, _]) => fieldTogglesList.includes(key)),
				);
				return emptyToUndefined(filtered);
			} else if (mode === "strict") {
				const valid = Object.keys(fieldToggles).find((key) => !fieldTogglesList.includes(key));
				if (valid) {
					throw new Error(`Field toggle ${valid} is not valid for operation ${operation}`);
				}
				const missing = fieldTogglesList.find((key) => !(key in fieldToggles));
				if (missing) {
					throw new Error(`Field toggle ${missing} is missing for operation ${operation}`);
				}
				return emptyToUndefined(fieldToggles);
			}
		};

		return { getMethod, getPath, getQueryId, createFieldToggles, getFeatures };
	};

	return { graphql, getOperation };
};
