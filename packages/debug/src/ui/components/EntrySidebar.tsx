import { countKeys, formatTime, labelOf, metaOf, methodBadgeClass } from "../entryUtils";
import type { DebugEntry, MethodFilter, SortMode } from "../types";

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
	onOnlyReplayableChange: (value: boolean) => void;
	onQueryChange: (value: string) => void;
	onSelect: (id: number) => void;
	onSortModeChange: (value: SortMode) => void;
	onlyReplayable: boolean;
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
	onOnlyReplayableChange,
	onQueryChange,
	onSelect,
	onSortModeChange,
	onlyReplayable,
	query,
	selectedId,
	sortMode,
	stats,
}: EntrySidebarProps) {
	return (
		<section className="grid min-h-0 grid-rows-[auto_auto_1fr] border-[#d9e0ea] border-r bg-white max-[900px]:border-r-0 max-[900px]:border-b">
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
				<label className="inline-flex items-center gap-2 text-[#536173] text-sm">
					<input
						checked={onlyReplayable}
						className="h-4 w-4"
						type="checkbox"
						onChange={(event) => onOnlyReplayableChange(event.target.checked)}
					/>
					Replayable GraphQL only
				</label>
			</div>

			<div className="min-h-0 overflow-auto">
				{entries.length === 0 ? (
					<div className="p-5 text-[#667386] text-sm">No matching entries</div>
				) : (
					entries.map((entry) => {
						const method = entry.graphQL?.method ?? "RAW";
						const selectedEntry = entry.id === selectedId;
						return (
							<button
								className={`grid w-full cursor-pointer gap-2 border-0 border-[#edf0f4] border-b bg-transparent px-3.5 py-3 text-left hover:bg-[#f4f8ff] ${
									selectedEntry ? "bg-[#edf5ff]" : ""
								}`}
								key={entry.id}
								type="button"
								onClick={() => onSelect(entry.id)}
							>
								<span className="flex min-w-0 items-center gap-2">
									<span className={`rounded border px-2 py-0.5 font-bold text-[11px] ${methodBadgeClass(method)}`}>
										{method}
									</span>
									<span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-sm">
										{String(labelOf(entry))}
									</span>
									<span className="ml-auto whitespace-nowrap font-mono text-[#667386] text-[11px]">
										#{entry.id}
									</span>
								</span>
								<span className="overflow-hidden text-ellipsis whitespace-nowrap text-[#667386] text-xs">
									{metaOf(entry) || "No metadata"}
								</span>
								<span className="flex flex-wrap items-center gap-2 text-[#7a8697] text-[11px]">
									<span>{formatTime(entry.receivedAt)}</span>
									{entry.graphQL ? (
										<>
											<span>variables {countKeys(entry.graphQL.variables)}</span>
											<span>features {countKeys(entry.graphQL.features)}</span>
										</>
									) : (
										<span>not replayable</span>
									)}
								</span>
							</button>
						);
					})
				)}
			</div>
		</section>
	);
}
