# twitter-api-safe-request

Safe request helpers for Twitter/X web API access through a Playwright persistent profile.

```ts
import { createProfile } from "twitter-api-safe-request";
import { chromium } from "playwright";

const context = await chromium.launchPersistentContext("./user_data/account1", {
	headless: false,
});
const page = await context.newPage();
const client = await createProfile(page);
await page.goto("https://x.com/home");

const result = await client.graphQLFullResponse(
	{
		queryId: "query-id",
		operationName: "OperationName",
		operationType: "query",
		metadata: {
			featureSwitches: [],
			fieldToggles: [],
		},
	},
	{},
);
```
