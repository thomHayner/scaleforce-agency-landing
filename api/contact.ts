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

  let body: ContactPayload;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  } catch {
    return res.status(400).json({ ok: false, error: 'invalid_json' });
  }

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

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
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
    company: typeof body.company === 'string' ? body.company.trim() : '',
    location: typeof body.location === 'string' ? body.location.trim() : '',
  };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[scaleforce.agency] New contact: ${name}`,
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
