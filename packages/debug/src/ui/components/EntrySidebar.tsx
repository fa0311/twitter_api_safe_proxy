import { useMemo, useState } from "react";
import { filterAndSort, statsOf } from "../entryUtils";
import { useDebugEntriesStore } from "../store";
import type { EntryFilters, EntryStats } from "../types";
import { EntryFilterControls } from "./EntryFilterControls";
import { EntryList } from "./EntryList";

const initialFilters: EntryFilters = { method: "all", version: "all", query: "", sort: "newest" };

const statsList: { key: keyof EntryStats; label: string }[] = [
	{ key: "total", label: "Total" },
	{ key: "v11", label: "v1.1" },
	{ key: "v2", label: "v2" },
	{ key: "graphql", label: "graphql" },
];

export const EntrySidebar = () => {
	const entries = useDebugEntriesStore((s) => s.entries);
	const [filters, setFilters] = useState<EntryFilters>(initialFilters);

	const visibleEntries = useMemo(() => filterAndSort(entries, filters), [entries, filters]);
	const stats = useMemo(() => statsOf(entries), [entries]);

	return (
		<section className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden border-[#d9e0ea] border-r bg-white max-[900px]:border-r-0 max-[900px]:border-b">
			<div className="grid grid-cols-4 border-[#e7ebf1] border-b text-center text-xs">
				{statsList.map(({ key, label }, index) => (
					<div className={`px-3 py-2 ${index > 0 ? "border-[#e7ebf1] border-l" : ""}`} key={key}>
						<div className="font-bold text-[15px]">{stats[key]}</div>
						<div className="text-[#667386]">{label}</div>
					</div>
				))}
			</div>

			<EntryFilterControls filters={filters} onFiltersChange={setFilters} />

			<EntryList entries={visibleEntries} />
		</section>
	);
};
