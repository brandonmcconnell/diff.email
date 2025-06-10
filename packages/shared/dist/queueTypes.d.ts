import type { Client, Engine } from "./emailClients";
export interface ScreenshotJobData {
    /**
     * ID of the `runs` row this screenshot belongs to.
     */
    runId: string;
    /**
     * The HTML string to render when setContent fallback is used.
     */
    html: string;
    /**
     * Email client identifier (gmail, outlook, …).
     */
    client: Client;
    /**
     * Rendering engine identifier (chromium, firefox, webkit).
     */
    engine: Engine;
    /**
     * Whether dark-mode media emulation should be enabled.
     */
    dark: boolean;
    /**
     * Optional subject token used by clients that rely on inbox search to open
     * the rendered email (e.g., Yahoo, AOL).
     */
    subjectToken?: string;
    /**
     * Optional RFC-5322 Message-ID used by Gmail deep-linking.
     */
    messageId?: string;
}
