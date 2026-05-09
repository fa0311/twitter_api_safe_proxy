import type { GraphQLReplayRequest } from "../shared/graphqlReplay";

export type DebugEntry = {
	graphQL?: GraphQLReplayRequest;
	id: number;
	raw: unknown;
	receivedAt: number;
};

export type MethodFilter = "all" | "GET" | "POST";
export type SortMode = "newest" | "oldest" | "operation" | "method";
export type DetailTab = "request" | "raw" | "response";

export type ReplayResult = {
	finishedAt: number;
	payload: unknown;
	status: number;
};

export type ReplayState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "done"; result: ReplayResult }
	| { status: "error"; message: string };
