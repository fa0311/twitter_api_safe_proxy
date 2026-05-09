import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { toDefaultExecutionScript } from "../shared/graphqlReplay";
import { DetailPane } from "./components/DetailPane";
import { EntrySidebar } from "./components/EntrySidebar";
import { labelOf, searchTextOf } from "./entryUtils";
import "./style.css";
import type { DebugEntry, DetailTab, ExecutionState, MethodFilter, SortMode } from "./types";
import { useDebugEntries } from "./useDebugEntries";

const stripTrailingSemicolons = (value: string) => value.trim().replace(/;+\s*$/, "");

const createScriptRunner = (source: string) => {
	const expression = stripTrailingSemicolons(source);

	try {
		return new Function(
			"entry",
			"graphQL",
			"capturedResponse",
			`"use strict";
return (async () => (${expression}))();`,
		) as (entry: DebugEntry, graphQL: DebugEntry["graphQL"], capturedResponse: unknown) => Promise<unknown>;
	} catch {
		return new Function(
			"entry",
			"graphQL",
			"capturedResponse",
			`"use strict";
return (async () => {
${source}
})();`,
		) as (entry: DebugEntry, graphQL: DebugEntry["graphQL"], capturedResponse: unknown) => Promise<unknown>;
	}
};

const executionValueOf = async (value: unknown) => {
	if (!(value instanceof Response)) {
		return value;
	}

	try {
		const response = value.clone();
		const contentType = response.headers.get("content-type") ?? "";
		return {
			payload: contentType.includes("application/json")
				? await response.json().catch(() => null)
				: await response.text(),
			status: response.status,
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Response body could not be read",
			status: value.status,
		};
	}
};

function App() {
	const { clearEntries, connected, entries, selectedId, setSelectedId } = useDebugEntries();
	const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
	const [query, setQuery] = useState("");
	const [sortMode, setSortMode] = useState<SortMode>("newest");
	const [tab, setTab] = useState<DetailTab>("request");
	const [executionById, setExecutionById] = useState<Record<number, ExecutionState>>({});
	const [scriptById, setScriptById] = useState<Record<number, string>>({});

	const stats = useMemo(
		() => ({
			get: entries.filter((entry) => entry.graphQL?.method === "GET").length,
			graphQL: entries.filter((entry) => entry.graphQL).length,
			post: entries.filter((entry) => entry.graphQL?.method === "POST").length,
			total: entries.length,
		}),
		[entries],
	);

	const visibleEntries = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		const filtered = entries.filter((entry) => {
			if (methodFilter === "replayable" && !entry.graphQL) {
				return false;
			}
			if ((methodFilter === "GET" || methodFilter === "POST") && entry.graphQL?.method !== methodFilter) {
				return false;
			}
			if (normalizedQuery && !searchTextOf(entry).includes(normalizedQuery)) {
				return false;
			}
			return true;
		});

		return filtered.toSorted((left, right) => {
			if (sortMode === "oldest") {
				return left.receivedAt - right.receivedAt;
			}
			if (sortMode === "operation") {
				return String(labelOf(left)).localeCompare(String(labelOf(right)));
			}
			if (sortMode === "method") {
				return String(left.graphQL?.method ?? "RAW").localeCompare(String(right.graphQL?.method ?? "RAW"));
			}
			return right.receivedAt - left.receivedAt;
		});
	}, [entries, methodFilter, query, sortMode]);

	const selected = entries.find((entry) => entry.id === selectedId);
	const selectedExecutionState = selected ? (executionById[selected.id] ?? { status: "idle" as const }) : undefined;
	const selectedScript = useMemo(() => {
		if (!selected?.graphQL) {
			return "";
		}
		return scriptById[selected.id] ?? toDefaultExecutionScript(selected.graphQL);
	}, [scriptById, selected]);

	const clearAll = () => {
		clearEntries();
		setExecutionById({});
		setScriptById({});
	};

	const setSelectedScript = (script: string) => {
		if (!selected) {
			return;
		}
		setScriptById((current) => ({ ...current, [selected.id]: script }));
	};

	const executeSelectedScript = async () => {
		if (!selected?.graphQL) {
			return;
		}

		setExecutionById((current) => ({ ...current, [selected.id]: { status: "loading" } }));
		setTab("response");

		try {
			const run = createScriptRunner(selectedScript);
			const value = await executionValueOf(await run(selected, selected.graphQL, selected.response));
			setExecutionById((current) => ({
				...current,
				[selected.id]: {
					result: {
						finishedAt: Date.now(),
						value,
					},
					status: "done",
				},
			}));
		} catch (error) {
			setExecutionById((current) => ({
				...current,
				[selected.id]: {
					message: error instanceof Error ? error.message : "Execution failed",
					status: "error",
				},
			}));
		}
	};

	return (
		<div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#f5f7fa] font-sans text-[#17202c]">
			<header className="border-[#d9e0ea] border-b bg-white px-5 py-3">
				<div className="flex flex-wrap items-center gap-3">
					<div className="mr-auto">
						<div className="font-bold text-[15px]">Twitter API Debug</div>
						<div className="text-[#667386] text-xs">Captured createApp traffic and GraphQL execution</div>
					</div>
					<div className="inline-flex items-center gap-2 rounded border border-[#d9e0ea] px-2.5 py-1 text-[#586577] text-xs">
						<span className={`h-2 w-2 rounded-full ${connected ? "bg-[#168a55]" : "bg-[#b3261e]"}`} />
						{connected ? "Connected" : "Disconnected"}
					</div>
				</div>
			</header>

			<main className="grid min-h-0 grid-cols-[minmax(320px,420px)_minmax(0,1fr)] overflow-hidden max-[900px]:grid-cols-1 max-[900px]:grid-rows-[minmax(280px,42dvh)_minmax(0,1fr)]">
				<EntrySidebar
					entries={visibleEntries}
					methodFilter={methodFilter}
					query={query}
					selectedId={selectedId}
					sortMode={sortMode}
					stats={stats}
					onClear={clearAll}
					onMethodFilterChange={setMethodFilter}
					onQueryChange={setQuery}
					onSelect={setSelectedId}
					onSortModeChange={setSortMode}
				/>
				<DetailPane
					executionState={selectedExecutionState}
					script={selectedScript}
					selected={selected}
					tab={tab}
					onExecute={executeSelectedScript}
					onScriptChange={setSelectedScript}
					onTabChange={setTab}
				/>
			</main>
		</div>
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
