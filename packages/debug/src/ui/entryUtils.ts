import { z } from "zod";
import type { DebugEntry, EntryFilters, EntryMethod, EntryStats, SortMode } from "./types";

const v11Pattern = new URLPattern({ pathname: "/1.1/*" });
const v2Pattern = new URLPattern({ pathname: "/2/*" });
const graphqlPattern = new URLPattern({ pathname: "/graphql/:queryId/:operationName" });

const eventSchema = z.object({
	request: z.unknown(),
	response: z.unknown(),
	requestAt: z.number(),
	receivedAt: z.number(),
});

const probeSchema = z.looseObject({
	path: z.string().min(1),
	method: z.enum(["GET", "POST"]),
});

const recordSchema = z.record(z.string(), z.unknown()).default({});

const graphqlGetSchema = z.looseObject({
	method: z.literal("GET"),
	params: z.looseObject({
		variables: z.string().optional(),
		features: z.string().optional(),
		fieldToggles: z.string().optional(),
	}),
});

const graphqlPostSchema = z.looseObject({
	method: z.literal("POST"),
	data: z.looseObject({
		variables: z.unknown().optional(),
		features: recordSchema.optional(),
		fieldToggles: recordSchema.optional(),
	}),
});

const legacyGetSchema = z.looseObject({
	method: z.literal("GET"),
	path: z.string(),
	params: recordSchema,
	headers: recordSchema,
});

const legacyPostSchema = z.looseObject({
	method: z.literal("POST"),
	path: z.string(),
	params: recordSchema,
	headers: recordSchema,
	data: z.unknown(),
});

const stringifyJson = (value: unknown) => JSON.stringify(value, null, 2);

const buildSearchText = (parts: unknown[]): string =>
	parts
		.map((p) => (typeof p === "string" || typeof p === "number" ? String(p) : stringifyJson(p)))
		.filter(Boolean)
		.join("\n")
		.toLowerCase();

const labelFromPath = (path: string): string => {
	const last = new URL(path, "https://x.com").pathname.split("/").filter(Boolean).at(-1) ?? path;
	return last.replace(/\.json$/, "");
};

const parseGraphqlPath = (path: string) => {
	const segs = new URL(path, "https://x.com").pathname.split("/").filter(Boolean);
	return { queryId: segs[1] ?? "", operationName: segs[2] ?? "" };
};

const parseJsonRecord = (value: string): Record<string, unknown> =>
	z.record(z.string(), z.unknown()).parse(JSON.parse(value));

const extractGraphqlBody = (request: unknown, method: EntryMethod) => {
	if (method === "GET") {
		const cfg = graphqlGetSchema.parse(request);
		return {
			variables: cfg.params.variables !== undefined ? JSON.parse(cfg.params.variables) : {},
			features: cfg.params.features !== undefined ? parseJsonRecord(cfg.params.features) : {},
			fieldToggles: cfg.params.fieldToggles !== undefined ? parseJsonRecord(cfg.params.fieldToggles) : {},
		};
	}
	const cfg = graphqlPostSchema.parse(request);
	return {
		variables: cfg.data.variables ?? {},
		features: cfg.data.features ?? {},
		fieldToggles: cfg.data.fieldToggles ?? {},
	};
};

export const buildEntry = (raw: unknown, id: number): DebugEntry => {
	const event = eventSchema.parse(raw);
	const probe = probeSchema.parse(event.request);
	const pathname = new URL(probe.path, "https://x.com").pathname;

	const core = {
		id,
		request: event.request,
		response: event.response,
		requestAt: event.requestAt,
		receivedAt: event.receivedAt,
		path: probe.path,
		method: probe.method,
	};

	if (graphqlPattern.test({ pathname })) {
		const { queryId, operationName } = parseGraphqlPath(probe.path);
		const body = extractGraphqlBody(event.request, probe.method);
		return {
			...core,
			version: "graphql",
			queryId,
			operationName,
			...body,
			label: operationName,
			searchText: buildSearchText([id, probe.method, "graphql", queryId, operationName, event.request, event.response]),
		};
	}

	const version = (() => {
		if (v11Pattern.test({ pathname })) return "v1.1";
		if (v2Pattern.test({ pathname })) return "v2";
		throw new Error(`Path does not match v1.1, v2, or graphql: ${probe.path}`);
	})();

	return {
		...core,
		version,
		label: labelFromPath(probe.path),
		searchText: buildSearchText([id, probe.method, version, event.request, event.response]),
	};
};

export const statsOf = (entries: DebugEntry[]): EntryStats =>
	entries.reduce<EntryStats>(
		(acc, entry) => {
			acc.total += 1;
			if (entry.version === "v1.1") acc.v11 += 1;
			if (entry.version === "v2") acc.v2 += 1;
			if (entry.version === "graphql") acc.graphql += 1;
			return acc;
		},
		{ total: 0, v11: 0, v2: 0, graphql: 0 },
	);

const compareBy: Record<SortMode, (a: DebugEntry, b: DebugEntry) => number> = {
	newest: (a, b) => b.receivedAt - a.receivedAt,
	oldest: (a, b) => a.receivedAt - b.receivedAt,
	label: (a, b) => a.label.localeCompare(b.label),
	method: (a, b) => a.method.localeCompare(b.method),
};

export const filterAndSort = (entries: DebugEntry[], filters: EntryFilters): DebugEntry[] => {
	const query = filters.query.toLowerCase();
	const filtered = entries.filter((entry) => {
		if (filters.method !== "all" && entry.method !== filters.method) return false;
		if (filters.version !== "all" && entry.version !== filters.version) return false;
		if (query && !entry.searchText.includes(query)) return false;
		return true;
	});
	return filtered.toSorted(compareBy[filters.sort]);
};

const graphqlReplayPath = (queryId: string, operationName: string) =>
	`/i/api/graphql/${encodeURIComponent(queryId)}/${encodeURIComponent(operationName)}`;

export const defaultScriptOf = (entry: DebugEntry): string => {
	if (entry.version === "graphql") {
		const endpoint = graphqlReplayPath(entry.queryId, entry.operationName);
		const variables = stringifyJson(entry.variables ?? {});
		const features = stringifyJson(entry.features);
		const fieldToggles = stringifyJson(entry.fieldToggles);
		if (entry.method === "GET") {
			return [
				`const params = new URLSearchParams();`,
				`params.set("variables", JSON.stringify(${variables}));`,
				`params.set("features", JSON.stringify(${features}));`,
				`params.set("fieldToggles", JSON.stringify(${fieldToggles}));`,
				"",
				`return await fetch(\`${endpoint}?\${params}\`, {`,
				"});",
			].join("\n");
		}
		return [
			`const body = {`,
			`\tvariables: ${variables},`,
			`\tfeatures: ${features},`,
			`\tfieldToggles: ${fieldToggles},`,
			`};`,
			"",
			`return await fetch(${JSON.stringify(endpoint)}, {`,
			'\tmethod: "POST",',
			'\theaders: { "content-type": "application/json" },',
			"\tbody: JSON.stringify(body),",
			"});",
		].join("\n");
	}

	if (entry.method === "GET") {
		const cfg = legacyGetSchema.parse(entry.request);
		return [
			`const params = new URLSearchParams(${stringifyJson(cfg.params)});`,
			"",
			`return await fetch(\`${cfg.path}?\${params}\`, {`,
			`\theaders: ${stringifyJson(cfg.headers)},`,
			"});",
		].join("\n");
	}
	const cfg = legacyPostSchema.parse(entry.request);
	return [
		`const data = ${stringifyJson(cfg.data)};`,
		"",
		`return await fetch(${JSON.stringify(cfg.path)}, {`,
		'\tmethod: "POST",',
		`\theaders: ${stringifyJson(cfg.headers)},`,
		"\tbody: JSON.stringify(data),",
		"});",
	].join("\n");
};

export const formatTime = (value: number): string =>
	new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(value);

export const stringify = stringifyJson;

export const methodBadgeClass = (method: EntryMethod): string =>
	method === "GET" ? "border-[#8fc7f2] bg-[#e8f4ff] text-[#075985]" : "border-[#c6b6ff] bg-[#f1edff] text-[#5b21b6]";
