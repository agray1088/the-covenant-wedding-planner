/**
 * Email helper (password reset, RSVP, invites, vendor portal).
 * Transports: Resend HTTPS API (RESEND_API_KEY, preferred) or SMTP (SMTP_*).
 * When neither is set, callers get a clear smtp_not_configured error.
 */
import net from 'net';
import tls from 'tls';

function flag(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').trim().toLowerCase());
}

function emailFeatureOff() {
  return process.env.FEATURE_EMAIL != null
    && String(process.env.FEATURE_EMAIL).trim() !== ''
    && !flag('FEATURE_EMAIL');
}

const CONNECT_TIMEOUT_MS = () => Number(process.env.SMTP_CONNECT_TIMEOUT_MS || 10000);
const IO_TIMEOUT_MS = () => Number(process.env.SMTP_IO_TIMEOUT_MS || 15000);
const API_TIMEOUT_MS = () => Number(process.env.EMAIL_API_TIMEOUT_MS || 15000);

export function resendConfigured() {
  return !!(process.env.RESEND_API_KEY || '').trim() && !emailFeatureOff();
}

export function smtpHostConfigured() {
  return !!(process.env.SMTP_HOST || '').trim() && !emailFeatureOff();
}

/** 'resend-api' | 'smtp' | 'none' — Resend API wins when both are set. */
export function emailTransport() {
  if (resendConfigured()) return 'resend-api';
  if (smtpHostConfigured()) return 'smtp';
  return 'none';
}

/** True when ANY email transport is usable (name kept for existing callers). */
export function smtpConfigured() {
  return emailTransport() !== 'none';
}

export function smtpStatus() {
  const from = (process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim() || null;
  return {
    configured: smtpConfigured(),
    transport: emailTransport(),
    resendConfigured: resendConfigured(),
    smtpHostConfigured: smtpHostConfigured(),
    host: (process.env.SMTP_HOST || '').trim() || null,
    from
  };
}

function fromAddress() {
  return (
    process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.MAGIC_LINK_FROM || 'noreply@covenant.local'
  ).trim();
}

function smtpSettings() {
  return {
    host: (process.env.SMTP_HOST || '').trim(),
    port: Number(process.env.SMTP_PORT || 587),
    user: (process.env.SMTP_USER || '').trim(),
    pass: process.env.SMTP_PASS || '',
    from: fromAddress(),
    secure: flag('SMTP_SECURE') || Number(process.env.SMTP_PORT || 587) === 465
  };
}

/** Domain-only form safe for logs. */
export function maskEmail(addr) {
  const s = String(addr || '');
  const at = s.lastIndexOf('@');
  if (at < 1) return '(invalid)';
  return `${s[0]}***@${s.slice(at + 1)}`;
}

function clean(v) {
  return String(v || '').replace(/[\r\n]+/g, ' ');
}

function mailError(code, message, extra = {}) {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extra);
  return err;
}

function bareAddress(from) {
  const m = /<([^>]+)>/.exec(from);
  return (m ? m[1] : from).trim();
}

async function sendViaResendApi({ to, subject, text, html }) {
  const key = (process.env.RESEND_API_KEY || '').trim();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS());
  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress(),
        to: [to],
        subject: clean(subject),
        text: text || undefined,
        html: html || undefined
      }),
      signal: ctrl.signal
    });
  } catch (e) {
    if (e && e.name === 'AbortError') {
      throw mailError('email_timeout', `Resend API did not respond within ${API_TIMEOUT_MS()}ms.`);
    }
    throw mailError('email_network_error', `Could not reach api.resend.com: ${e && e.cause && e.cause.code || e.message}`);
  } finally {
    clearTimeout(timer);
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const detail = (body && (body.message || body.error)) || res.statusText;
    const code = res.status === 401 || res.status === 403 ? 'resend_rejected' : 'resend_http_error';
    throw mailError(code, `Resend API ${res.status}: ${detail}`, { status: res.status });
  }
  return { ok: true, via: 'resend-api', id: body && body.id ? body.id : null };
}

/** Buffered SMTP reply reader (handles multi-line "250-" replies) with timeouts. */
function makeReplyReader(socket) {
  let buf = '';
  let pending = null;
  let failure = null;
  const tryResolve = () => {
    if (!pending) return;
    if (failure) {
      const p = pending;
      pending = null;
      p.reject(failure);
      return;
    }
    const lines = buf.split(/\r?\n/);
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d{3} /.test(lines[i]) || /^\d{3}$/.test(lines[i])) {
        const reply = lines.slice(0, i + 1).join('\n');
        buf = lines.slice(i + 1).join('\n');
        const p = pending;
        pending = null;
        clearTimeout(p.timer);
        p.resolve(reply);
        return;
      }
    }
  };
  const fail = (err) => {
    failure = failure || err;
    if (pending) {
      clearTimeout(pending.timer);
      tryResolve();
    }
  };
  socket.on('data', (c) => {
    buf += c.toString('utf8');
    tryResolve();
  });
  socket.on('error', (e) => fail(e));
  socket.on('close', () => fail(mailError('smtp_connection_closed', 'SMTP server closed the connection unexpectedly.')));
  return {
    read(step) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending = null;
          reject(mailError('smtp_timeout', `SMTP timed out after ${IO_TIMEOUT_MS()}ms waiting for server reply (${step}).`));
        }, IO_TIMEOUT_MS());
        pending = { resolve, reject, timer };
        tryResolve();
      });
    }
  };
}

function connectSocket(cfg) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        sock.destroy();
      } catch {
        /* ignore */
      }
      reject(
        mailError(
          'smtp_connect_timeout',
          `Could not connect to ${cfg.host}:${cfg.port} within ${CONNECT_TIMEOUT_MS()}ms (port may be blocked by the host).`
        )
      );
    }, CONNECT_TIMEOUT_MS());
    const onConnect = () => {
      clearTimeout(timer);
      resolve(sock);
    };
    const sock = cfg.secure
      ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host }, onConnect)
      : net.connect({ host: cfg.host, port: cfg.port }, onConnect);
    sock.once('error', (e) => {
      clearTimeout(timer);
      reject(mailError('smtp_connect_failed', `SMTP connect to ${cfg.host}:${cfg.port} failed: ${e.code || e.message}`, { cause: e }));
    });
  });
}

async function sendViaSmtp({ to, subject, text, html }) {
  const cfg = smtpSettings();
  if (!cfg.host) {
    throw mailError('smtp_not_configured', 'SMTP is not configured. Set SMTP_HOST (and usually SMTP_USER / SMTP_PASS / SMTP_FROM).');
  }
  return sendRawSmtp(cfg, { to, subject, text, html });
}

async function sendRawSmtp(cfg, { to, subject, text, html }) {
  let socket = await connectSocket(cfg);
  socket.removeAllListeners('error');
  let reader = makeReplyReader(socket);
  const expect = async (code, step) => {
    const reply = await reader.read(step);
    if (!reply.startsWith(String(code))) {
      const rc = reply.slice(0, 3);
      const err = mailError(
        rc === '535' || rc === '534' ? 'smtp_auth_failed' : rc === '550' || rc === '553' || rc === '554' ? 'smtp_rejected' : 'smtp_error',
        `SMTP ${step}: expected ${code}, got "${reply.trim().slice(0, 200)}"`
      );
      throw err;
    }
    return reply;
  };
  const cmd = (line) => socket.write(line + '\r\n');
  try {
    await expect(220, 'greeting');
    cmd('EHLO covenant-sync');
    const ehlo = await expect(250, 'EHLO');

    if (!cfg.secure && (cfg.port === 587 || /STARTTLS/i.test(ehlo))) {
      cmd('STARTTLS');
      await expect(220, 'STARTTLS');
      socket.removeAllListeners('data');
      socket.removeAllListeners('close');
      socket.removeAllListeners('error');
      socket = await new Promise((resolve, reject) => {
        const t = tls.connect({ socket, servername: cfg.host }, () => resolve(t));
        t.once('error', reject);
      });
      reader = makeReplyReader(socket);
      cmd('EHLO covenant-sync');
      await expect(250, 'EHLO after STARTTLS');
    }

    if (cfg.user) {
      cmd('AUTH LOGIN');
      await expect(334, 'AUTH LOGIN');
      cmd(Buffer.from(cfg.user).toString('base64'));
      await expect(334, 'AUTH user');
      cmd(Buffer.from(cfg.pass).toString('base64'));
      await expect(235, 'AUTH password');
    }

    cmd(`MAIL FROM:<${bareAddress(cfg.from)}>`);
    await expect(250, 'MAIL FROM');
    cmd(`RCPT TO:<${clean(to)}>`);
    await expect(250, 'RCPT TO');
    cmd('DATA');
    await expect(354, 'DATA');

    const boundary = 'covenant_' + Date.now();
    const headers = [
      `From: ${clean(cfg.from)}`,
      `To: ${clean(to)}`,
      `Subject: ${clean(subject)}`,
      'MIME-Version: 1.0'
    ];
    let body;
    if (html) {
      headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      body = [
        `--${boundary}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        text || '',
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        html,
        `--${boundary}--`,
        ''
      ].join('\r\n');
    } else {
      headers.push('Content-Type: text/plain; charset=utf-8');
      body = text || '';
    }
    const stuffed = body.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
    socket.write(headers.join('\r\n') + '\r\n\r\n' + stuffed + '\r\n.\r\n');
    await expect(250, 'end of DATA');
    cmd('QUIT');
    return { ok: true, via: 'smtp' };
  } finally {
    try {
      socket.destroy();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Send an email via the active transport. Logs every attempt (masked recipient,
 * never credentials or body). Throws with err.code on failure
 * ('smtp_not_configured' when no transport is set).
 */
export async function sendMail({ to, subject, text, html, kind = 'unspecified' }) {
  const transport = emailTransport();
  const who = maskEmail(to);
  if (transport === 'none') {
    console.warn(`[covenant-mail] kind=${kind} to=${who} result=skipped reason=no_transport`);
    throw mailError(
      'smtp_not_configured',
      'Email is not configured on this server. Set RESEND_API_KEY, or SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM (see docs/AUTH.md).'
    );
  }
  const started = Date.now();
  console.log(`[covenant-mail] kind=${kind} to=${who} transport=${transport} result=attempt`);
  try {
    const out = transport === 'resend-api'
      ? await sendViaResendApi({ to, subject, text, html })
      : await sendViaSmtp({ to, subject, text, html });
    console.log(
      `[covenant-mail] kind=${kind} to=${who} transport=${transport} result=sent ms=${Date.now() - started}${out.id ? ` id=${out.id}` : ''}`
    );
    return out;
  } catch (e) {
    console.error(
      `[covenant-mail] kind=${kind} to=${who} transport=${transport} result=failed ms=${Date.now() - started} code=${e && e.code || 'error'} message=${JSON.stringify(String(e && e.message || e).slice(0, 300))}`
    );
    if (e && !e.transport) e.transport = transport;
    throw e;
  }
}
