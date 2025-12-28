import pino from "pino";

type LoggerSettings = {
	level: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
	prettyPrint: boolean;
};

export const createLogger = () => {
	let pinoInstance: pino.Logger | undefined;

	const init = (settings: LoggerSettings) => {
		const transport = {
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "HH:MM:ss Z",
				ignore: "pid,hostname",
			},
		};
		pinoInstance = pino({
			level: settings.level,
			transport: settings.prettyPrint ? transport : undefined,
		});
	};

	const info = (...args: Parameters<pino.LogFn>) => {
		(pinoInstance ?? console).info(...args);
	};

	const error = (...args: Parameters<pino.LogFn>) => {
		(pinoInstance ?? console).error(...args);
	};

	const warn = (...args: Parameters<pino.LogFn>) => {
		(pinoInstance ?? console).warn(...args);
	};

	const debug = (...args: Parameters<pino.LogFn>) => {
		(pinoInstance ?? console).debug(...args);
	};

	return { info, error, warn, debug, init };
};

export const logger = createLogger();
