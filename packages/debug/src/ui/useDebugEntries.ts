import { useEffect, useRef, useState } from "react";
import { parseCapturedGraphQLRequest } from "../shared/graphqlReplay";
import type { DebugEntry } from "./types";

export const useDebugEntries = () => {
	const [entries, setEntries] = useState<DebugEntry[]>([]);
	const [connected, setConnected] = useState(false);
	const [selectedId, setSelectedId] = useState<number>();
	const nextIdRef = useRef(1);

	useEffect(() => {
		const source = new EventSource("/api/events");

		source.addEventListener("open", () => setConnected(true));
		source.addEventListener("error", () => setConnected(false));
		source.addEventListener("entry", (event) => {
			const raw = JSON.parse(event.data);
			const id = nextIdRef.current;
			nextIdRef.current += 1;
			const entry: DebugEntry = {
				graphQL: parseCapturedGraphQLRequest(raw),
				id,
				raw,
				receivedAt: Date.now(),
			};
			setEntries((current) => [...current, entry]);
			setSelectedId((current) => current ?? id);
		});

		return () => source.close();
	}, []);

	const clearEntries = () => {
		setEntries([]);
		setSelectedId(undefined);
	};

	return {
		clearEntries,
		connected,
		entries,
		selectedId,
		setSelectedId,
	};
};
