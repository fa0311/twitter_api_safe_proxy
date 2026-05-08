import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type DebugEntry = any;

const findByKey = (value: unknown, key: string, depth = 0, seen = new WeakSet<object>()): unknown => {
	if (depth > 8 || value === null || value === undefined || typeof value !== "object") {
		return undefined;
	}
	if (seen.has(value)) {
		return undefined;
	}
	seen.add(value);

	if (Object.hasOwn(value, key)) {
		return (value as Record<string, unknown>)[key];
	}

	const values = Array.isArray(value) ? value : Object.values(value);
	for (const item of values) {
		const found = findByKey(item, key, depth + 1, seen);
		if (found !== undefined) {
			return found;
		}
	}
	return undefined;
};

const labelOf = (entry: DebugEntry) =>
	findByKey(entry, "operationName") ?? findByKey(entry, "url") ?? findByKey(entry, "property") ?? "entry";

const metaOf = (entry: DebugEntry) =>
	[
		findByKey(entry, "property"),
		findByKey(entry, "operationType"),
		findByKey(entry, "method"),
		findByKey(entry, "queryId"),
	]
		.filter(Boolean)
		.join(" | ");

function App() {
	const [entries, setEntries] = useState<DebugEntry[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>();
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		const source = new EventSource("/debug/events");

		source.addEventListener("open", () => setConnected(true));
		source.addEventListener("error", () => setConnected(false));
		source.addEventListener("entry", (event) => {
			const entry = JSON.parse(event.data);
			setEntries((current) => [...current, entry]);
			setSelectedIndex((current) => current ?? 0);
		});

		return () => source.close();
	}, []);

	const selected = selectedIndex === undefined ? undefined : entries[selectedIndex];

	return (
		<div className="grid min-h-screen grid-rows-[auto_1fr] bg-[#f6f7f9] font-sans text-[#18202a]">
			<header className="flex items-center gap-3 border-[#d8dee8] border-b bg-white px-4 py-3">
				<div className="mr-auto font-bold">Twitter API Debug</div>
				<div className="inline-flex items-center gap-2 text-[#586577] text-[13px]">
					<span className={`h-2 w-2 rounded-full ${connected ? "bg-[#168a55]" : "bg-[#b3261e]"}`} />
					{connected ? "Connected" : "Disconnected"}
				</div>
			</header>
			<main className="grid min-h-0 grid-cols-[minmax(320px,42%)_minmax(0,1fr)] max-[800px]:grid-cols-1 max-[800px]:grid-rows-[42vh_1fr]">
				<section className="overflow-auto border-[#d8dee8] border-r bg-white max-[800px]:border-r-0 max-[800px]:border-b">
					{entries.length === 0 ? (
						<div className="p-4 text-[#667386]">No entries</div>
					) : (
						entries
							.map((entry, index) => ({ entry, index }))
							.toReversed()
							.map(({ entry, index }) => (
								<button
									className={`grid w-full cursor-pointer grid-cols-[84px_minmax(0,1fr)] gap-3 border-0 border-[#edf0f4] border-b bg-transparent px-3.5 py-2.5 text-left hover:bg-[#eef5ff] ${
										index === selectedIndex ? "bg-[#eef5ff]" : ""
									}`}
									key={index}
									type="button"
									onClick={() => setSelectedIndex(index)}
								>
									<span className="whitespace-nowrap font-mono text-[#667386] text-xs">#{index + 1}</span>
									<span className="min-w-0">
										<span className="block overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
											{String(labelOf(entry))}
										</span>
										<span className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-[#667386] text-xs">
											{metaOf(entry)}
										</span>
									</span>
								</button>
							))
					)}
				</section>
				<section className="min-w-0 overflow-auto p-4">
					<pre className="m-0 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
						{selected ? JSON.stringify(selected, null, 2) : "No entry selected"}
					</pre>
				</section>
			</main>
		</div>
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
