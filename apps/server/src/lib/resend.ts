import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
	throw new Error("Missing RESEND_API_KEY environment variable");
}

export const resend = () =>
	process.env.RESEND_API_KEY
		? new Resend(process.env.RESEND_API_KEY)
		: { emails: { send: async (...args: unknown[]) => console.log(args) } };
