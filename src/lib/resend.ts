import { Resend } from "resend";

let resendClient: Resend | null | undefined;

/**
 * Server-only Resend client. Returns null until RESEND_API_KEY is configured.
 */
export function getResendClient(): Resend | null {
  if (resendClient !== undefined) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    resendClient = null;
    return resendClient;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "no-reply@indiroute.co";
