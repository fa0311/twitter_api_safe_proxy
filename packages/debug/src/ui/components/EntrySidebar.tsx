import type { DebugEntry, MethodFilter, SortMode } from "../types";
import { EntryList } from "./EntryList";

type EntryStats = {
	get: number;
	graphQL: number;
	post: number;
	total: number;
};

type EntrySidebarProps = {
	entries: DebugEntry[];
	methodFilter: MethodFilter;
	onClear: () => void;
	onMethodFilterChange: (value: MethodFilter) => void;
	onQueryChange: (value: string) => void;
	onSelect: (id: number) => void;
	onSortModeChange: (value: SortMode) => void;
	query: string;
	selectedId?: number;
	sortMode: SortMode;
	stats: EntryStats;
};

export function EntrySidebar({
	entries,
	methodFilter,
	onClear,
	onMethodFilterChange,
	onQueryChange,
	onSelect,
	onSortModeChange,
	query,
	selectedId,
	sortMode,
	stats,
}: EntrySidebarProps) {
	return (
		<section className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden border-[#d9e0ea] border-r bg-white max-[900px]:border-r-0 max-[900px]:border-b">
			<div className="grid grid-cols-4 border-[#e7ebf1] border-b text-center text-xs">
				<div className="px-3 py-2">
					<div className="font-bold text-[15px]">{stats.total}</div>
					<div className="text-[#667386]">Total</div>
				</div>
				<div className="border-[#e7ebf1] border-l px-3 py-2">
					<div className="font-bold text-[15px]">{stats.graphQL}</div>
					<div className="text-[#667386]">GraphQL</div>
				</div>
				<div className="border-[#e7ebf1] border-l px-3 py-2">
					<div className="font-bold text-[15px]">{stats.get}</div>
					<div className="text-[#667386]">GET</div>
				</div>
				<div className="border-[#e7ebf1] border-l px-3 py-2">
					<div className="font-bold text-[15px]">{stats.post}</div>
					<div className="text-[#667386]">POST</div>
				</div>
			</div>

			<div className="space-y-3 border-[#e7ebf1] border-b p-3">
				<input
					className="h-9 w-full rounded border border-[#cfd7e3] bg-white px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
					placeholder="Search operation, queryId, path, payload"
					type="search"
					value={query}
					onChange={(event) => onQueryChange(event.target.value)}
				/>
				<div className="grid grid-cols-[1fr_1fr_auto] gap-2 max-[520px]:grid-cols-1">
					<select
						className="h-9 rounded border border-[#cfd7e3] bg-white px-2 text-sm outline-none focus:border-[#2563eb]"
						value={methodFilter}
						onChange={(event) => onMethodFilterChange(event.target.value as MethodFilter)}
					>
						<option value="all">All methods</option>
						<option value="replayable">Replayable GraphQL</option>
						<option value="GET">GET only</option>
						<option value="POST">POST only</option>
					</select>
					<select
						className="h-9 rounded border border-[#cfd7e3] bg-white px-2 text-sm outline-none focus:border-[#2563eb]"
						value={sortMode}
						onChange={(event) => onSortModeChange(event.target.value as SortMode)}
					>
						<option value="newest">Newest first</option>
						<option value="oldest">Oldest first</option>
						<option value="operation">Operation A to Z</option>
						<option value="method">Method</option>
					</select>
					<button
						className="h-9 rounded border border-[#cfd7e3] bg-white px-3 text-sm hover:bg-[#f3f6fa]"
						type="button"
						onClick={onClear}
					>
						Clear
					</button>
				</div>
			</div>

			<EntryList entries={entries} selectedId={selectedId} onSelect={onSelect} />
		</section>
	);
}
