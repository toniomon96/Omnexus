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

// Sender address — set RESEND_FROM_EMAIL in Vercel env vars (must be verified domain).
// Example: "Omnexus <no-reply@notifications.omnexus.fit>"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Omnexus <no-reply@notifications.omnexus.fit>';
const MIN_PASSWORD_LENGTH = 12;

function buildConfirmationEmail(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your Omnexus account</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#0f172a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
          <!-- Logo / header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:14px 20px;">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Omnexus</span>
              </div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#1e293b;border-radius:20px;border:1px solid #334155;padding:40px 32px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f1f5f9;text-align:center;">
                Confirm your account
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;line-height:1.6;text-align:center;">
                You're one click away from unlocking your AI-powered fitness journey. Tap the button below to activate your account.
              </p>
              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a
                      href="${confirmUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;"
                    >
                      Confirm my account
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Fallback link -->
              <p style="margin:28px 0 0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                Or paste this link in your browser:<br />
                <a href="${confirmUrl}" style="color:#818cf8;word-break:break-all;">${confirmUrl}</a>
              </p>
              <!-- Disclaimer -->
              <hr style="border:none;border-top:1px solid #334155;margin:28px 0 24px;" />
              <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
                This link expires in 24 hours. If you didn't create an Omnexus account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#475569;">
                &copy; ${new Date().getFullYear()} Omnexus · Science-backed fitness, powered by AI
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

  // Aggressive rate limiting — signup should be rare per IP.
  if (!await checkRateLimit(req, res, { namespace: 'omnexus_rl:signup', limit: 8, window: '10 m' })) return;

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Service not configured' });
  }

  const { email, password, redirectTo } = req.body ?? {};

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const safeRedirectTo = typeof redirectTo === 'string' ? redirectTo : undefined;

  // 1. Create the user with Supabase admin API.
  //    email_confirm: false — we send our own email via Resend.
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: false, // we handle confirmation manually
  });

  if (createError) {
    // Duplicate email — user already exists
    if (createError.message?.toLowerCase().includes('already') || createError.message?.includes('422')) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }
    console.error('[/api/signup] createUser error:', createError);
    return res.status(500).json({ error: 'Account creation failed. Please try again.' });
  }

  const userId = newUser.user.id;

  // 2. Generate a confirmation link using the Supabase admin API.
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: email.trim().toLowerCase(),
    password,
    options: {
      redirectTo: safeRedirectTo ?? `${process.env.VITE_SITE_URL ?? ''}/auth/callback`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('[/api/signup] generateLink error:', linkError);
    // User was created but we couldn't send the email — still return success
    // so the client knows the account exists (user can use password reset to verify)
    return res.status(200).json({ userId, emailSent: false });
  }

  const confirmUrl = linkData.properties.action_link;

  // 3. Send the branded confirmation email via Resend.
  if (resend) {
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email.trim().toLowerCase(),
      subject: 'Confirm your Omnexus account',
      html: buildConfirmationEmail(confirmUrl),
    });
    if (emailError) {
      console.error('[/api/signup] Resend send error:', emailError);
    }
  } else {
    // Resend not configured — fall back to the generated link in response
    // (useful in development; never expose in production)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[/api/signup] RESEND_API_KEY not set. Confirmation URL:', confirmUrl);
    }
  }

  return res.status(200).json({ userId, emailSent: !!resend });
}
