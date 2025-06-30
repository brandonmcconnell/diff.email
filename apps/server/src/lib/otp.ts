import { totp } from "otplib";

export function generateOtp(secret: string): string {
	// otplib defaults to 30-s window and 6-digit code (RFC 6238)
	return totp.generate(secret);
}
