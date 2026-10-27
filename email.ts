// Stub. Replace with Resend, Postmark, SES, etc.
export async function sendEmail(opts: { to: string; subject: string; text: string }) {
  console.log(`[email] to=${opts.to} subject="${opts.subject}"\n${opts.text}`);
}
