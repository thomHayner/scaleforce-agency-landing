import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

interface ContactPayload {
  name?: string;
  email?: string;
  message?: string;
  company?: string;
  location?: string;
  disclaimer?: boolean;
  // Honeypot — must remain empty for legitimate submissions.
  website?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// eslint-disable-next-line no-control-regex -- intentional: rejecting control chars in header-bound input
const HAS_CTRL_RE = /[\u0000-\u001F\u007F]/;

// Caps on user-controlled fields — bounds request size and outbound email size
// for a public endpoint. Email max follows RFC 5321 local+domain limits.
const MAX_LEN = {
  name: 200,
  email: 254,
  message: 5000,
  company: 200,
  location: 200,
} as const;

// Strip CR/LF and other control chars and clamp length so user-controlled
// values are safe to interpolate into mail headers (e.g. Subject).
function sanitizeHeader(input: string, maxLen = 120): string {
  // eslint-disable-next-line no-control-regex -- intentional: stripping control chars is the point
  return input.replace(/[\r\n\t\v\f\u0000-\u001F\u007F]/g, ' ').slice(0, maxLen).trim();
}

function coerceCheckbox(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'string') {
    const v = value.toLowerCase();
    return v === 'true' || v === 'on' || v === '1' || v === 'yes';
  }
  return false;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml(payload: Required<Pick<ContactPayload, 'name' | 'email' | 'message'>> & Partial<ContactPayload>): string {
  const rows = [
    ['Name', payload.name],
    ['Email', payload.email],
    ['Company', payload.company || '—'],
    ['Location', payload.location || '—'],
    ['Disclaimer accepted', payload.disclaimer ? 'Yes' : 'No'],
  ]
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">${label}</td><td style="padding:4px 0;">${escapeHtml(String(value))}</td></tr>`)
    .join('');
  return `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#0f172a;">
  <h2 style="margin:0 0 16px;font-size:18px;">New contact form submission</h2>
  <table style="border-collapse:collapse;margin-bottom:16px;">${rows}</table>
  <h3 style="margin:0 0 8px;font-size:14px;">Message</h3>
  <pre style="white-space:pre-wrap;font-family:inherit;margin:0;padding:12px;background:#f1f5f9;border-radius:8px;">${escapeHtml(payload.message)}</pre>
</div>`;
}

function renderText(payload: Required<Pick<ContactPayload, 'name' | 'email' | 'message'>> & Partial<ContactPayload>): string {
  return [
    `New contact form submission`,
    ``,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Company: ${payload.company || '—'}`,
    `Location: ${payload.location || '—'}`,
    `Disclaimer accepted: ${payload.disclaimer ? 'Yes' : 'No'}`,
    ``,
    `Message:`,
    payload.message,
  ].join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let parsed: unknown;
  try {
    parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: 'invalid_json' });
  }
  // Normalize to a plain object — reject null, primitives, and arrays so the
  // downstream property accesses can't throw on a JSON payload of `null` / `true` / `"str"`.
  if (parsed === undefined) {
    parsed = {};
  } else if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return res.status(400).json({ ok: false, error: 'invalid_json' });
  }
  const body = parsed as ContactPayload;

  // Honeypot — silently succeed without sending.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  // Reject control chars in addition to format check — `email` becomes the
  // Reply-To header, and EMAIL_RE only blocks whitespace.
  if (!EMAIL_RE.test(email) || HAS_CTRL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  const company = typeof body.company === 'string' ? body.company.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';

  if (
    name.length > MAX_LEN.name ||
    email.length > MAX_LEN.email ||
    message.length > MAX_LEN.message ||
    company.length > MAX_LEN.company ||
    location.length > MAX_LEN.location
  ) {
    return res.status(400).json({ ok: false, error: 'field_too_long' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error('contact: missing required env (RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL)');
    return res.status(502).json({ ok: false, error: 'mailer_unconfigured' });
  }

  const payload = {
    name,
    email,
    message,
    company,
    location,
    disclaimer: coerceCheckbox(body.disclaimer),
  };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[scaleforce.agency] New contact: ${sanitizeHeader(name)}`,
      html: renderHtml(payload),
      text: renderText(payload),
    });
    if (error) {
      console.error('contact: resend error', error);
      return res.status(502).json({ ok: false, error: 'mailer_failed' });
    }
  } catch (err) {
    console.error('contact: send threw', err);
    return res.status(502).json({ ok: false, error: 'mailer_failed' });
  }

  return res.status(200).json({ ok: true });
}
