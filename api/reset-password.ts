import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Omnexus <no-reply@notifications.omnexus.fit>';

function buildResetPasswordEmail(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your Omnexus password</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#0f172a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:14px 20px;">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Omnexus</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#1e293b;border-radius:20px;border:1px solid #334155;padding:40px 32px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f1f5f9;text-align:center;">Reset your password</h1>
              <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;line-height:1.6;text-align:center;">
                Tap the button below to securely reset your Omnexus password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a
                      href="${resetUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;"
                    >
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                Or paste this link in your browser:<br />
                <a href="${resetUrl}" style="color:#818cf8;word-break:break-all;">${resetUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #334155;margin:28px 0 24px;" />
              <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
                If you did not request this reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!await checkRateLimit(req, res, { namespace: 'omnexus_rl:reset-password', limit: 6, window: '10 m' })) return;

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Service not configured' });
  }

  const { email, redirectTo } = req.body ?? {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const safeEmail = email.trim().toLowerCase();
  const safeRedirectTo = typeof redirectTo === 'string' ? redirectTo : `${process.env.VITE_SITE_URL ?? ''}/auth/callback`;

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: safeEmail,
    options: { redirectTo: safeRedirectTo },
  });

  // Always return 200 so the endpoint does not reveal account existence.
  if (linkError || !linkData?.properties?.action_link) {
    return res.status(200).json({ sent: true });
  }

  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: safeEmail,
      subject: 'Reset your Omnexus password',
      html: buildResetPasswordEmail(linkData.properties.action_link),
    });
  }

  return res.status(200).json({ sent: true });
}
