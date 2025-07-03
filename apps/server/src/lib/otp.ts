import { totp } from "otplib";

export function generateOtp(secret: string): string {
	return totp.generate(secret);
}
