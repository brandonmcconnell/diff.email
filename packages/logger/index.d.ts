import type pino from "pino";

/** Shared Pino logger instance pre-configured for diff.email backends */
declare const logger: pino.Logger;
export default logger;
