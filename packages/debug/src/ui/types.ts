import type { GraphQLReplayRequest } from "../shared/graphqlReplay";

export type DebugEntry = {
	error?: unknown;
	graphQL?: GraphQLReplayRequest;
	id: number;
	raw: unknown;
	request: unknown;
	response?: unknown;
	receivedAt: number;
};

export type MethodFilter = "all" | "replayable" | "GET" | "POST";
export type SortMode = "newest" | "oldest" | "operation" | "method";
export type DetailTab = "request" | "response" | "javascript";

export type ExecutionResult = {
	finishedAt: number;
	value: unknown;
};

export type ExecutionState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "done"; result: ExecutionResult }
	| { status: "error"; message: string };
