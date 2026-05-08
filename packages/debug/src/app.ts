import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

const waitUntilAbort = async (signal: AbortSignal) => {
	if (signal.aborted) {
		return;
	}
	await new Promise<void>((resolve) => {
		signal.addEventListener("abort", () => resolve(), { once: true });
	});
};

export const createDebugApp = () => {
	const listeners = new Set<(entry: unknown) => void>();
	const app = new Hono();

	app.get("/debug/events", (c) =>
		streamSSE(c, async (stream) => {
			const listener = (entry: unknown) => {
				void stream.writeSSE({
					event: "entry",
					data: JSON.stringify(entry),
				});
			};
			listeners.add(listener);

			await waitUntilAbort(c.req.raw.signal);
			listeners.delete(listener);
		}),
	);

	const emit = (entry: unknown) => {
		for (const listener of listeners) {
			listener(entry);
		}
	};

	return { app, emit } as const;
};
