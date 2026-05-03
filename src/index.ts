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

		console.log("Testing GraphQL request...");
		const op = await twitter.graphql(
			{
				queryId: "jYMvLJJjGjO3aKWY3bP5HA",
				operationName: "HomeTimeline",
				operationType: "query",
				metadata: {
					featureSwitches: [
						"rweb_video_screen_enabled",
						"rweb_cashtags_enabled",
						"profile_label_improvements_pcf_label_in_post_enabled",
						"responsive_web_profile_redirect_enabled",
						"rweb_tipjar_consumption_enabled",
						"verified_phone_label_enabled",
						"creator_subscriptions_tweet_preview_api_enabled",
						"responsive_web_graphql_timeline_navigation_enabled",
						"responsive_web_graphql_skip_user_profile_image_extensions_enabled",
						"premium_content_api_read_enabled",
						"communities_web_enable_tweet_community_results_fetch",
						"c9s_tweet_anatomy_moderator_badge_enabled",
						"responsive_web_grok_analyze_button_fetch_trends_enabled",
						"responsive_web_grok_analyze_post_followups_enabled",
						"responsive_web_jetfuel_frame",
						"responsive_web_grok_share_attachment_enabled",
						"responsive_web_grok_annotations_enabled",
						"articles_preview_enabled",
						"responsive_web_edit_tweet_api_enabled",
						"graphql_is_translatable_rweb_tweet_is_translatable_enabled",
						"view_counts_everywhere_api_enabled",
						"longform_notetweets_consumption_enabled",
						"responsive_web_twitter_article_tweet_consumption_enabled",
						"content_disclosure_indicator_enabled",
						"content_disclosure_ai_generated_indicator_enabled",
						"responsive_web_grok_show_grok_translated_post",
						"responsive_web_grok_analysis_button_from_backend",
						"post_ctas_fetch_enabled",
						"freedom_of_speech_not_reach_fetch_enabled",
						"standardized_nudges_misinfo",
						"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled",
						"longform_notetweets_rich_text_read_enabled",
						"longform_notetweets_inline_media_enabled",
						"responsive_web_grok_image_annotation_enabled",
						"responsive_web_grok_imagine_annotation_enabled",
						"responsive_web_grok_community_note_auto_translation_is_enabled",
						"responsive_web_enhance_cards_enabled",
					],
					fieldToggles: [
						"withPayments",
						"withAuxiliaryUserLabels",
						"withArticleRichContentState",
						"withArticlePlainText",
						"withArticleSummaryText",
						"withArticleVoiceOver",
						"withGrokAnalyze",
						"withDisallowedReplyControls",
					],
				},
			},
			{
				count: 20,
				enableRanking: false,
				includePromotedContent: true,
				requestContext: "launch",
				seenTweetIds: [],
			},
		);
		logger.info("GraphQL response:");
		logger.info(op);
	}
};

// スクリプトを実行
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
