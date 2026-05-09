export type EntryMethod = "GET" | "POST";

type EntryCore = {
	id: number;
	request: unknown;
	response: unknown;
	requestAt: number;
	receivedAt: number;
	path: string;
	method: EntryMethod;
	label: string;
	searchText: string;
};

export type DebugEntry = EntryCore &
	(
		| { version: "v1.1" | "v2" }
		| {
				version: "graphql";
				queryId: string;
				operationName: string;
				variables: unknown;
				features: Record<string, unknown>;
				fieldToggles: Record<string, unknown>;
		  }
	);

export type MethodFilter = "all" | "GET" | "POST";
export type VersionFilter = "all" | "v1.1" | "v2" | "graphql";
export type SortMode = "newest" | "oldest" | "label" | "method";
export type DetailTab = "request" | "response" | "javascript";

export type EntryFilters = {
	method: MethodFilter;
	version: VersionFilter;
	query: string;
	sort: SortMode;
};

export type EntryStats = {
	total: number;
	v11: number;
	v2: number;
	graphql: number;
};

export type ExecutionState = { status: "idle" } | { status: "loading" } | { status: "done"; value: unknown };
