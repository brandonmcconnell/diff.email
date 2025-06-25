var _a;
import pino from "pino";
const logger = pino({
    level: (_a = process.env.LOG_LEVEL) !== null && _a !== void 0 ? _a : "info",
    transport: process.env.NODE_ENV !== "production" && !process.env.NEXT_RUNTIME
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
