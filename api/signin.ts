import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const ATTEMPT_WINDOW_MINUTES = 30;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRole
    ? createClient(supabaseUrl, supabaseServiceRole)
    : null;

interface LoginAttemptRow {
  email_hash: string;
  failed_attempts: number;
  first_failed_at: string | null;
  last_failed_at: string | null;
  locked_until: string | null;
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] ?? req.socket.remoteAddress ?? 'unknown';
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
  return req.socket.remoteAddress ?? 'unknown';
}

function hashEmail(email: string): string {
  const pepper = process.env.AUTH_ATTEMPT_PEPPER ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-auth-attempt-pepper';
  return createHash('sha256').update(`${email}|${pepper}`).digest('hex');
}

async function getAttemptRow(emailHash: string): Promise<LoginAttemptRow | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('auth_login_attempts')
    .select('email_hash,failed_attempts,first_failed_at,last_failed_at,locked_until')
    .eq('email_hash', emailHash)
    .maybeSingle();

  if (error || !data) return null;
  return data as LoginAttemptRow;
}

async function recordFailedAttempt(emailHash: string, ipAddress: string, existing: LoginAttemptRow | null) {
  if (!supabaseAdmin) return { lockedUntil: null as string | null, attempts: 0 };

  const now = Date.now();
  const lastFailedMs = existing?.last_failed_at ? Date.parse(existing.last_failed_at) : 0;
  const withinWindow = lastFailedMs > 0 && now - lastFailedMs <= ATTEMPT_WINDOW_MINUTES * 60_000;
  const nextAttempts = (withinWindow ? existing?.failed_attempts ?? 0 : 0) + 1;

  const lockedUntil =
    nextAttempts >= MAX_FAILED_ATTEMPTS
      ? new Date(now + LOCKOUT_MINUTES * 60_000).toISOString()
      : null;

  await supabaseAdmin.from('auth_login_attempts').upsert(
    {
      email_hash: emailHash,
      failed_attempts: nextAttempts,
      first_failed_at: withinWindow ? existing?.first_failed_at ?? new Date(now).toISOString() : new Date(now).toISOString(),
      last_failed_at: new Date(now).toISOString(),
      locked_until: lockedUntil,
      last_ip: ipAddress,
    },
    { onConflict: 'email_hash' },
  );

  return { lockedUntil, attempts: nextAttempts };
}

async function clearAttempts(emailHash: string, ipAddress: string) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('auth_login_attempts').upsert(
    {
      email_hash: emailHash,
      failed_attempts: 0,
      first_failed_at: null,
      last_failed_at: null,
      locked_until: null,
      last_ip: ipAddress,
    },
    { onConflict: 'email_hash' },
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!await checkRateLimit(req, res, { namespace: 'omnexus_rl:signin', limit: 20, window: '10 m' })) return;

  if (!supabaseAdmin || !supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Auth service is not configured' });
  }

  const { email, password } = req.body ?? {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length > 256) {
    return res.status(400).json({ error: 'Valid password is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailHash = hashEmail(normalizedEmail);
  const ipAddress = getClientIp(req);

  const existingAttempt = await getAttemptRow(emailHash);
  const now = Date.now();
  if (existingAttempt?.locked_until && Date.parse(existingAttempt.locked_until) > now) {
    return res.status(429).json({ error: 'Too many failed sign-in attempts. Please try again in 15 minutes.' });
  }

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ email: normalizedEmail, password }),
  });

  if (!authResponse.ok) {
    const result = await recordFailedAttempt(emailHash, ipAddress, existingAttempt);
    if (result.lockedUntil) {
      return res.status(429).json({ error: 'Too many failed sign-in attempts. Please try again in 15 minutes.' });
    }
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const authPayload = await authResponse.json() as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!authPayload.access_token || !authPayload.refresh_token) {
    return res.status(500).json({ error: 'Unexpected auth response' });
  }

  await clearAttempts(emailHash, ipAddress);

  return res.status(200).json({
    accessToken: authPayload.access_token,
    refreshToken: authPayload.refresh_token,
  });
}
