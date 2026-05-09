import { useMemo, useState } from "react";
import { filterAndSort } from "./entryUtils";
import type { DebugEntry, EntryFilters } from "./types";

const initialEntryFilters: EntryFilters = { method: "all", version: "all", query: "", sort: "newest" };

export const useEntryFilters = (entries: DebugEntry[]) => {
	const [filters, setFilters] = useState<EntryFilters>(initialEntryFilters);
	const visibleEntries = useMemo(() => filterAndSort(entries, filters), [entries, filters]);

	return { filters, setFilters, visibleEntries };
};
