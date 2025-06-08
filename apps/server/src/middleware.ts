import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// CORS_ORIGIN can be a comma-delimited allow-list, e.g.
// "https://diff.email,https://preview.diff.email,https://diff-email-web.vercel.app"
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
	.split(",")
	.map((o) => o.trim())
	.filter(Boolean);

export function middleware(req: NextRequest) {
	// Pre-flight: immediately respond 204 so the request never reaches the route.
	const res =
		req.method === "OPTIONS"
			? NextResponse.json(null, { status: 204 })
			: NextResponse.next();

	const origin = req.headers.get("origin") ?? "";

	if (allowedOrigins.includes(origin)) {
		// Echo back the requesting origin (only one value allowed per spec).
		res.headers.set("Access-Control-Allow-Origin", origin);
		res.headers.set("Vary", "Origin");
	}

	res.headers.set("Access-Control-Allow-Credentials", "true");
	res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
	res.headers.set(
		"Access-Control-Allow-Headers",
		// If the client requested specific headers, echo those; else allow common ones.
		req.headers.get("access-control-request-headers") ??
			"Content-Type, Authorization",
	);

	return res;
}

export const config = {
	matcher: "/:path*",
};
