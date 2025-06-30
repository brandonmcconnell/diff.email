import logger from "@diff-email/logger";

/**
 * Wrap an async operation with an automatic fallback.
 *
 * The `primary` function is executed first.  If it succeeds its result is
 * returned.  When it throws, the `fallback` function is invoked instead.  If
 * the fallback also throws an error, that error is re-thrown to the caller so
 * the surrounding job can be marked as failed.
 *
 * A logger can be provided to surface rich context.  When omitted a shared
 * default logger is used.
 */
export async function withFallback<T>(params: {
	readonly primary: () => Promise<T>;
	readonly fallback: () => Promise<T>;
	readonly label?: string; // Human-readable name for logging purposes.
	readonly log?: typeof logger;
}): Promise<T> {
	const { primary, fallback, label = "operation", log = logger } = params;

	try {
		return await primary();
	} catch (primaryErr) {
		log.warn({ err: primaryErr }, `${label} failed – attempting fallback`);
		try {
			return await fallback();
		} catch (fallbackErr) {
			log.error({ err: fallbackErr }, `${label} fallback also failed`);
			throw fallbackErr;
		}
	}
}
