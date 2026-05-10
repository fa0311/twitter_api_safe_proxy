import { useMemo, useState } from "react";
import { type DebugEntry, type MethodFilter, type VersionFilter } from "./entryUtils";

const initialEntryFilters: EntryFilters = { method: "all", version: "all", query: "", sort: "newest" };

export type SortMode = "newest" | "oldest" | "label" | "method";

export type EntryFilters = {
	method: MethodFilter;
	version: VersionFilter;
	query: string;
	sort: SortMode;
};


export const useEntryFilters = (entries: DebugEntry[]) => {
	const [filters, setFilters] = useState<EntryFilters>(initialEntryFilters);
	const visibleEntries = useMemo(() => filterAndSort(entries, filters), [entries, filters]);

	return { filters, setFilters, visibleEntries };
};

const filterAndSort = (entries: DebugEntry[], filters: EntryFilters): DebugEntry[] => {
	const query = filters.query.toLowerCase();
	const filtered = entries.filter((entry) => {
		if (filters.method !== "all" && entry.method !== filters.method) return false;
		if (filters.version !== "all" && entry.version !== filters.version) return false;
		if (query && !entry.searchText.includes(query)) return false;
		return true;
	});
	return filtered.toSorted(compareBy[filters.sort]);
};

const compareBy: Record<SortMode, (a: DebugEntry, b: DebugEntry) => number> = {
	newest: (a, b) => b.receivedAt - a.receivedAt,
	oldest: (a, b) => a.receivedAt - b.receivedAt,
	label: (a, b) => a.label.localeCompare(b.label),
	method: (a, b) => a.method.localeCompare(b.method),
};

