import type { DebugEntry } from "./types";

const findByKey = (value: unknown, key: string, depth = 0, seen = new WeakSet<object>()): unknown => {
	if (depth > 8 || value === null || value === undefined || typeof value !== "object") {
		return undefined;
	}
	if (seen.has(value)) {
		return undefined;
	}
	seen.add(value);

	if (Object.hasOwn(value, key)) {
		return (value as Record<string, unknown>)[key];
	}

	const values = Array.isArray(value) ? value : Object.values(value);
	for (const item of values) {
		const found = findByKey(item, key, depth + 1, seen);
		if (found !== undefined) {
			return found;
		}
	}
	return undefined;
};

export const labelOf = (entry: DebugEntry) =>
	entry.graphQL?.operationName ??
	findByKey(entry.raw, "operationName") ??
	findByKey(entry.raw, "url") ??
	findByKey(entry.raw, "property") ??
	"entry";

export const metaOf = (entry: DebugEntry) =>
	entry.graphQL
		? [entry.graphQL.queryId, entry.graphQL.path].filter(Boolean).join(" | ")
		: [
				findByKey(entry.raw, "property"),
				findByKey(entry.raw, "operationType"),
				findByKey(entry.raw, "method"),
				findByKey(entry.raw, "queryId"),
			]
				.filter(Boolean)
				.join(" | ");

export const countKeys = (value: unknown) =>
	value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).length : 0;

export const formatTime = (value: number) =>
	new Intl.DateTimeFormat(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(value);

export const stringify = (value: unknown) => JSON.stringify(value, null, 2);

export const searchTextOf = (entry: DebugEntry) =>
	[
		entry.id,
		labelOf(entry),
		metaOf(entry),
		entry.graphQL?.method,
		entry.graphQL?.operationName,
		entry.graphQL?.queryId,
		entry.graphQL?.path,
		stringify(entry.raw),
	]
		.filter(Boolean)
		.join("\n")
		.toLowerCase();

export const methodBadgeClass = (method: string) => {
	if (method === "GET") {
		return "border-[#8fc7f2] bg-[#e8f4ff] text-[#075985]";
	}
	if (method === "POST") {
		return "border-[#c6b6ff] bg-[#f1edff] text-[#5b21b6]";
	}
	return "border-[#d7dce4] bg-[#f3f5f8] text-[#536173]";
};
