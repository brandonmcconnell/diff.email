import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema/auth";
import { resend } from "./resend";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	trustedOrigins: [process.env.CORS_ORIGIN || ""],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await resend().emails.send({
				from: "diff.email <donotreply@diff.email>",
				to: user.email,
				subject: "Reset your password",
				html: `
					<h2>Reset Your Password</h2>
					<p>Click the link below to reset your password:</p>
					<a href="${url}">${url}</a>
					<p>If you didn't request this, you can safely ignore this email.</p>
				`,
			});
		},
	},
	emailVerification: {
		sendOnSignUp: false,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, token }) => {
			const verificationUrl = `${process.env.VITE_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&callbackURL=/settings/connections`;

			await resend().emails.send({
				from: "diff.email <donotreply@diff.email>",
				to: user.email,
				subject: "Verify your diff.email account",
				html: `
					<h2>Verify Your diff.email Account</h2>
					<p>Click the link below to verify your email:</p>
					<a href="${verificationUrl}">${verificationUrl}</a>
				`,
			});
		},
	},
	user: {
		additionalFields: {
			firstName: {
				type: "string",
			},
			lastName: {
				type: "string",
			},
		},
	},
});
