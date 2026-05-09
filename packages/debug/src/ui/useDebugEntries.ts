import { useEffect, useRef, useState } from "react";
import { parseCapturedGraphQLRequest } from "../shared/graphqlReplay";
import type { DebugEntry } from "./types";

type CapturedPayload = {
	error?: unknown;
	request: unknown;
	response?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object" && !Array.isArray(value);

const capturedPayloadOf = (raw: unknown): CapturedPayload => {
	if (isRecord(raw) && ("request" in raw || "response" in raw || "error" in raw)) {
		return {
			error: raw.error,
			request: raw.request,
			response: raw.response,
		};
	}

	return { request: raw };
};

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
			const captured = capturedPayloadOf(raw);
			const id = nextIdRef.current;
			nextIdRef.current += 1;
			const entry: DebugEntry = {
				error: captured.error,
				graphQL: parseCapturedGraphQLRequest(captured.request),
				id,
				raw,
				request: captured.request,
				response: captured.response,
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
