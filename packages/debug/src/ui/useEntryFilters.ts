import { useMemo, useState } from "react";
import { filterAndSortEntries, type EntryFilters, initialEntryFilters } from "./entryFilters";
import type { DebugEntry } from "./entryUtils";

export const useEntryFilters = (entries: DebugEntry[]) => {
	const [filters, setFilters] = useState<EntryFilters>(initialEntryFilters);
	const visibleEntries = useMemo(() => filterAndSortEntries(entries, filters), [entries, filters]);

	return { filters, setFilters, visibleEntries };
};

export type { EntryFilters, SortMode } from "./entryFilters";
