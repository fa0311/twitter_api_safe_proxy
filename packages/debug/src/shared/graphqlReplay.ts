import { z } from "zod";

const UnknownRecordSchema = z.record(z.string(), z.unknown());

const CapturedGraphQLDataSchema = z.looseObject({
	variables: z.unknown().optional(),
	features: UnknownRecordSchema.optional(),
	fieldToggles: UnknownRecordSchema.optional(),
	queryId: z.string().min(1).optional(),
});

const CapturedGraphQLCandidateSchema = z.looseObject({
	data: CapturedGraphQLDataSchema.optional(),
	headers: UnknownRecordSchema.optional(),
	method: z.string().min(1).optional(),
	path: z.string().min(1),
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

	const data = candidate.data;
	const request = GraphQLReplayRequestSchema.safeParse({
		variables: data?.variables ?? parseJsonSearchParam(pathInfo.searchParams.get("variables")) ?? {},
		features:
			data?.features ??
			parseJsonSearchParam(pathInfo.searchParams.get("features")) ??
			{},
		fieldToggles:
			data?.fieldToggles ??
			parseJsonSearchParam(pathInfo.searchParams.get("fieldToggles")) ??
			{},
		queryId: data?.queryId ?? pathInfo.queryId,
		headers: candidate.headers ?? {},
		method,
		path: candidate.path,
		operationName: pathInfo.operationName,
	});

	return request.success ? request.data : undefined;
};

export const toCreateAppReplayRequest = (request: GraphQLReplayRequest): CreateAppReplayRequest => {
	const endpoint = `/i/api/graphql/${encodeURIComponent(request.queryId)}/${encodeURIComponent(
		request.operationName,
	)}`;

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
