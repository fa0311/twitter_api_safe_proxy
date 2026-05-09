import { Hono } from "hono";
import type { TwitterApiProfileClient } from "twitter-api-safe-request";

const createApp = async (getClient: () => TwitterApiProfileClient) => {
	const app = new Hono();

	app.get("/i/api/graphql/:queryId/:operationName", async (c) => {
		const client = getClient();
		const variables = JSON.parse(c.req.query("variables")!);
		const features = JSON.parse(c.req.query("features")!);
		const fieldToggles = JSON.parse(c.req.query("fieldToggles")!);

		const result = await client.graphQLFullResponse(
			{
				queryId: c.req.param("queryId"),
				operationName: c.req.param("operationName"),
				operationType: "query",
				metadata: {
					featureSwitches: Object.keys(features),
					fieldToggles: Object.keys(fieldToggles),
				},
			},
			variables,
		);
		return c.json(result);
	});

	app.post("/i/api/graphql/:queryId/:operationName", async (c) => {
		const client = getClient();
		const { variables, features } = await c.req.json();

		const result = await client.graphQLFullResponse(
			{
				queryId: c.req.param("queryId"),
				operationName: c.req.param("operationName"),
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

	return app;
};
export default createApp;
