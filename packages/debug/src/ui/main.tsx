import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { toCreateAppReplayRequest } from "../shared/graphqlReplay";
import { DetailPane } from "./components/DetailPane";
import { EntrySidebar } from "./components/EntrySidebar";
import { labelOf, searchTextOf } from "./entryUtils";
import "./style.css";
import type { DetailTab, MethodFilter, ReplayState, SortMode } from "./types";
import { useDebugEntries } from "./useDebugEntries";

function App() {
	const { clearEntries, connected, entries, selectedId, setSelectedId } = useDebugEntries();
	const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
	const [onlyReplayable, setOnlyReplayable] = useState(false);
	const [query, setQuery] = useState("");
	const [sortMode, setSortMode] = useState<SortMode>("newest");
	const [tab, setTab] = useState<DetailTab>("request");
	const [replayById, setReplayById] = useState<Record<number, ReplayState>>({});

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
			if (onlyReplayable && !entry.graphQL) {
				return false;
			}
			if (methodFilter !== "all" && entry.graphQL?.method !== methodFilter) {
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
	}, [entries, methodFilter, onlyReplayable, query, sortMode]);

	const selected = entries.find((entry) => entry.id === selectedId);
	const selectedReplayState = selected ? replayById[selected.id] ?? { status: "idle" as const } : undefined;

	const clearAll = () => {
		clearEntries();
		setReplayById({});
	};

	const replaySelected = async () => {
		if (!selected?.graphQL) {
			return;
		}

		setReplayById((current) => ({ ...current, [selected.id]: { status: "loading" } }));
		setTab("response");

		const replay = toCreateAppReplayRequest(selected.graphQL);

		try {
			const response = await fetch(replay.path, {
				method: replay.method,
				headers: replay.body ? { "content-type": "application/json" } : undefined,
				body: replay.body ? JSON.stringify(replay.body) : undefined,
			});
			const payload = await response.json().catch(() => null);
			setReplayById((current) => ({
				...current,
				[selected.id]: {
					result: {
						finishedAt: Date.now(),
						payload,
						status: response.status,
					},
					status: "done",
				},
			}));
		} catch (error) {
			setReplayById((current) => ({
				...current,
				[selected.id]: {
					message: error instanceof Error ? error.message : "Replay failed",
					status: "error",
				},
			}));
		}
	};

	return (
		<div className="grid min-h-screen grid-rows-[auto_1fr] bg-[#f5f7fa] font-sans text-[#17202c]">
			<header className="border-[#d9e0ea] border-b bg-white px-5 py-3">
				<div className="flex flex-wrap items-center gap-3">
					<div className="mr-auto">
						<div className="font-bold text-[15px]">Twitter API Debug</div>
						<div className="text-[#667386] text-xs">Captured createApp traffic and GraphQL replay</div>
					</div>
					<div className="inline-flex items-center gap-2 rounded border border-[#d9e0ea] px-2.5 py-1 text-[#586577] text-xs">
						<span className={`h-2 w-2 rounded-full ${connected ? "bg-[#168a55]" : "bg-[#b3261e]"}`} />
						{connected ? "Connected" : "Disconnected"}
					</div>
				</div>
			</header>

			<main className="grid min-h-0 grid-cols-[minmax(360px,44%)_minmax(0,1fr)] max-[900px]:grid-cols-1 max-[900px]:grid-rows-[minmax(420px,48vh)_1fr]">
				<EntrySidebar
					entries={visibleEntries}
					methodFilter={methodFilter}
					onlyReplayable={onlyReplayable}
					query={query}
					selectedId={selectedId}
					sortMode={sortMode}
					stats={stats}
					onClear={clearAll}
					onMethodFilterChange={setMethodFilter}
					onOnlyReplayableChange={setOnlyReplayable}
					onQueryChange={setQuery}
					onSelect={setSelectedId}
					onSortModeChange={setSortMode}
				/>
				<DetailPane
					replayState={selectedReplayState}
					selected={selected}
					tab={tab}
					onReplay={replaySelected}
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
