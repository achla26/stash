import nodemailer from "nodemailer";

let cached: nodemailer.Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transport(): nodemailer.Transporter {
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cached;
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!isSmtpConfigured()) {
    // Dev fallback — no SMTP configured: link sirf server log me jata hai
    console.log(`[mail:dev] to=${to} subject=${subject}`);
    console.log(html.replace(/\s+/g, " "));
    return;
    }
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  await transport().sendMail({ from, to, subject, html });
}

export function resetEmailHtml(url: string): string {
  return `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
      <div style="width:36px;height:36px;border-radius:10px;background:#007AFF;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">S</div>
      <span style="font-size:18px;font-weight:700">Stash</span>
    </div>
    <h1 style="font-size:20px;margin:0 0 8px">Reset your password</h1>
    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px">
      We received a request to reset your Stash password. Click the button below to choose a new one. The link expires in 1 hour.
    </p>
    <a href="${url}" style="display:inline-block;background:#007AFF;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px">Reset password</a>
    <p style="color:#888;font-size:12px;line-height:1.6;margin:24px 0 0">
      If you didn't request this, you can safely ignore this email.<br/>
      Or paste this link in your browser:<br/>${url}
    </p>
  </div>`;
}
