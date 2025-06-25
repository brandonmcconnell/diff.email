import pino from "pino";

const logger = pino({
	level: process.env.LOG_LEVEL ?? "info",
	transport:
		process.env.NODE_ENV !== "production" && !process.env.NEXT_RUNTIME
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
					},
				}
			: undefined,
});

export default logger;
