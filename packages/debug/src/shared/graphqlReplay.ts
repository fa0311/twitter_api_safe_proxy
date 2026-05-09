import { z } from "zod";

const UnknownRecordSchema = z.record(z.string(), z.unknown());

const CapturedGraphQLDataSchema = z.looseObject({
	variables: z.unknown().optional(),
	features: UnknownRecordSchema.optional(),
	fieldToggles: UnknownRecordSchema.optional(),
	queryId: z.string().min(1).optional(),
});

const CapturedGraphQLCandidateSchema = z.looseObject({
	data: z.unknown().optional(),
	headers: z.unknown().optional(),
	method: z.string().min(1).optional(),
	params: z.unknown().optional(),
	path: z.string().min(1),
	query: z.unknown().optional(),
	searchParams: z.unknown().optional(),
});

export const GraphQLReplayRequestSchema = z.object({
	variables: z.unknown().optional(),
	features: UnknownRecordSchema.default({}),
	fieldToggles: UnknownRecordSchema.default({}),
	queryId: z.string().min(1),
	headers: UnknownRecordSchema.default({}),
	method: z.enum(["GET", "POST"]),
	path: z.string().min(1),
	operationName: z.string().min(1),
});

export type GraphQLReplayRequest = z.infer<typeof GraphQLReplayRequestSchema>;

export type CreateAppReplayRequest = {
	method: "GET" | "POST";
	path: string;
	body?: {
		variables?: unknown;
		features?: Record<string, unknown>;
		fieldToggles?: Record<string, unknown>;
	};
};

const toGraphQLEndpoint = (request: Pick<GraphQLReplayRequest, "operationName" | "queryId">) =>
	`/i/api/graphql/${encodeURIComponent(request.queryId)}/${encodeURIComponent(request.operationName)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object" && !Array.isArray(value);

const parseJsonValue = (value: unknown) => {
	if (typeof value !== "string") {
		return value;
	}

	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
};

const parseJsonSearchParam = (value: string | null): unknown | undefined => {
	if (!value) {
		return undefined;
	}

	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
};

const valueByKey = (value: unknown, key: string, depth = 0, seen = new WeakSet<object>()): unknown => {
	if (depth > 8 || value === null || value === undefined || typeof value !== "object") {
		return undefined;
	}
	if (seen.has(value)) {
		return undefined;
	}
	seen.add(value);

	if (value instanceof URLSearchParams) {
		return parseJsonSearchParam(value.get(key));
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			if (Array.isArray(item) && item[0] === key) {
				return parseJsonValue(item[1]);
			}
			const found = valueByKey(item, key, depth + 1, seen);
			if (found !== undefined) {
				return found;
			}
		}
		return undefined;
	}

	if (Object.hasOwn(value, key)) {
		return parseJsonValue((value as Record<string, unknown>)[key]);
	}

	for (const item of Object.values(value)) {
		const found = valueByKey(item, key, depth + 1, seen);
		if (found !== undefined) {
			return found;
		}
	}

	return undefined;
};

const recordFromValue = (value: unknown): Record<string, unknown> | undefined => {
	const parsed = parseJsonValue(value);
	if (isRecord(parsed)) {
		return parsed;
	}
	if (Array.isArray(parsed)) {
		const entries = parsed.filter((item): item is string => typeof item === "string").map((key) => [key, true]);
		return entries.length > 0 ? Object.fromEntries(entries) : undefined;
	}
	return undefined;
};

const parseGraphQLPath = (path: string) => {
	const url = new URL(path, "https://x.com");
	const parts = url.pathname.split("/").filter(Boolean);
	const graphQLIndex = parts.indexOf("graphql");
	const queryId = parts[graphQLIndex + 1];
	const operationName = parts[graphQLIndex + 2];

	if (graphQLIndex < 0 || !queryId || !operationName) {
		return undefined;
	}

	return {
		queryId: decodeURIComponent(queryId),
		operationName: decodeURIComponent(operationName),
		searchParams: url.searchParams,
	};
};

const findCapturedGraphQLCandidate = (
	value: unknown,
	depth = 0,
	seen = new WeakSet<object>(),
): z.infer<typeof CapturedGraphQLCandidateSchema> | undefined => {
	if (depth > 8 || value === null || typeof value !== "object") {
		return undefined;
	}

	if (seen.has(value)) {
		return undefined;
	}
	seen.add(value);

	const candidate = CapturedGraphQLCandidateSchema.safeParse(value);
	if (candidate.success && parseGraphQLPath(candidate.data.path)) {
		return candidate.data;
	}

	const values = Array.isArray(value) ? value : Object.values(value);
	for (const item of values) {
		const found = findCapturedGraphQLCandidate(item, depth + 1, seen);
		if (found) {
			return found;
		}
	}

	return undefined;
};

export const parseCapturedGraphQLRequest = (value: unknown): GraphQLReplayRequest | undefined => {
	const candidate = findCapturedGraphQLCandidate(value);
	if (!candidate) {
		return undefined;
	}

	const pathInfo = parseGraphQLPath(candidate.path);
	if (!pathInfo) {
		return undefined;
	}

	const method = candidate.method?.toUpperCase();
	if (method !== "GET" && method !== "POST") {
		return undefined;
	}

	const data = CapturedGraphQLDataSchema.safeParse(candidate.data);
	const sources = [candidate.data, candidate.params, candidate.query, candidate.searchParams, value];
	const valueFromSources = (key: string) => {
		for (const source of sources) {
			const found = valueByKey(source, key);
			if (found !== undefined) {
				return found;
			}
		}
		return undefined;
	};
	const variables =
		data.success && data.data.variables !== undefined
			? data.data.variables
			: (parseJsonSearchParam(pathInfo.searchParams.get("variables")) ?? valueFromSources("variables") ?? {});
	const features =
		(data.success ? data.data.features : undefined) ??
		recordFromValue(parseJsonSearchParam(pathInfo.searchParams.get("features"))) ??
		recordFromValue(valueFromSources("features")) ??
		recordFromValue(valueFromSources("featureSwitches")) ??
		{};
	const fieldToggles =
		(data.success ? data.data.fieldToggles : undefined) ??
		recordFromValue(parseJsonSearchParam(pathInfo.searchParams.get("fieldToggles"))) ??
		recordFromValue(valueFromSources("fieldToggles")) ??
		{};
	const request = GraphQLReplayRequestSchema.safeParse({
		variables,
		features,
		fieldToggles,
		queryId: data.success ? (data.data.queryId ?? pathInfo.queryId) : pathInfo.queryId,
		headers: recordFromValue(candidate.headers) ?? {},
		method,
		path: candidate.path,
		operationName: pathInfo.operationName,
	});

	return request.success ? request.data : undefined;
};

export const toCreateAppReplayRequest = (request: GraphQLReplayRequest): CreateAppReplayRequest => {
	const endpoint = toGraphQLEndpoint(request);

	if (request.method === "GET") {
		const params = new URLSearchParams();
		params.set("variables", JSON.stringify(request.variables ?? {}));
		params.set("features", JSON.stringify(request.features));
		params.set("fieldToggles", JSON.stringify(request.fieldToggles));
		return {
			method: "GET",
			path: `${endpoint}?${params.toString()}`,
		};
	}

	return {
		method: "POST",
		path: endpoint,
		body: {
			variables: request.variables ?? {},
			features: request.features,
			fieldToggles: request.fieldToggles,
		},
	};
};

const jsLiteral = (value: unknown) => JSON.stringify(value, null, "\t") ?? "undefined";

export const toDefaultExecutionScript = (request: GraphQLReplayRequest) => {
	const replay = toCreateAppReplayRequest(request);
	const variables = request.variables ?? {};
	const features = request.features;
	const fieldToggles = request.fieldToggles;
	const endpoint = toGraphQLEndpoint(request);
	const variableDeclarations = [
		`const variables = ${jsLiteral(variables)};`,
		`const features = ${jsLiteral(features)};`,
		`const fieldToggles = ${jsLiteral(fieldToggles)};`,
	];

	if (!replay.body) {
		return [
			...variableDeclarations,
			"",
			`const url = new URL(${JSON.stringify(endpoint)}, window.location.origin);`,
			'url.searchParams.set("variables", JSON.stringify(variables));',
			'url.searchParams.set("features", JSON.stringify(features));',
			'url.searchParams.set("fieldToggles", JSON.stringify(fieldToggles));',
			"",
			"return await fetch(url.toString(), {",
			`\tmethod: ${JSON.stringify(replay.method)},`,
			"});",
		].join("\n");
	}

	return [
		...variableDeclarations,
		"",
		`return await fetch(${JSON.stringify(endpoint)}, {`,
		`\tmethod: ${JSON.stringify(replay.method)},`,
		'\theaders: { "content-type": "application/json" },',
		"\tbody: JSON.stringify({",
		"\t\tvariables,",
		"\t\tfeatures,",
		"\t\tfieldToggles,",
		"\t}),",
		"});",
	].join("\n");
};
