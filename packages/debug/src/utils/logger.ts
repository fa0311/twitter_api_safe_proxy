import pino from "pino";

type LoggerSettings = {
	logLevel: string;
	logPrettyPrint: boolean;
};

export const createLogger = (settings: LoggerSettings) => {
	return pino({
		transport: settings.logPrettyPrint ? { target: "pino-pretty" } : undefined,
		level: settings.logLevel,
		timestamp: pino.stdTimeFunctions.isoTime,
	});
};
