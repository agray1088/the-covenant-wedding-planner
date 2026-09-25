/**
 * Optional SMTP helper for password reset / username recovery.
 * When SMTP_* is unset, callers get a clear smtp_not_configured error.
 */
import net from 'net';
import tls from 'tls';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function flag(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').trim().toLowerCase());
}

export function smtpConfigured() {
  const host = (process.env.SMTP_HOST || '').trim();
  if (!host) return false;
  // FEATURE_EMAIL=0 forces off even when host is set.
  if (process.env.FEATURE_EMAIL != null && String(process.env.FEATURE_EMAIL).trim() !== '' && !flag('FEATURE_EMAIL')) {
    return false;
  }
  return true;
}

export function smtpStatus() {
  return {
    configured: smtpConfigured(),
    host: (process.env.SMTP_HOST || '').trim() || null,
    from: (process.env.SMTP_FROM || '').trim() || null
  };
}

function smtpSettings() {
  return {
    host: (process.env.SMTP_HOST || '').trim(),
    port: Number(process.env.SMTP_PORT || 587),
    user: (process.env.SMTP_USER || '').trim(),
    pass: process.env.SMTP_PASS || '',
    from: (process.env.SMTP_FROM || process.env.MAGIC_LINK_FROM || 'noreply@covenant.local').trim(),
    secure: flag('SMTP_SECURE') || Number(process.env.SMTP_PORT || 587) === 465
  };
}

/** Minimal SMTP sender — avoids a hard nodemailer dependency for local/dev. */
async function sendViaSmtp({ to, subject, text, html }) {
  const cfg = smtpSettings();
  if (!cfg.host) {
    const err = new Error('SMTP is not configured. Set SMTP_HOST (and usually SMTP_USER / SMTP_PASS / SMTP_FROM).');
    err.code = 'smtp_not_configured';
    throw err;
  }

  // Prefer nodemailer when installed (optional peer).
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined
    });
    await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html: html || undefined
    });
    return { ok: true, via: 'nodemailer' };
  } catch (e) {
    if (e && e.code === 'MODULE_NOT_FOUND') {
      // fall through to raw SMTP
    } else if (e && e.code === 'smtp_not_configured') {
      throw e;
    } else if (e && !e.code?.startsWith?.('MODULE')) {
      // nodemailer present but send failed
      throw e;
    }
  }

  return sendRawSmtp(cfg, { to, subject, text, html });
}

function readLine(socket) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString('utf8');
      if (buf.includes('\n')) {
        socket.off('data', onData);
        socket.off('error', onErr);
        resolve(buf);
      }
    };
    const onErr = (err) => {
      socket.off('data', onData);
      reject(err);
    };
    socket.on('data', onData);
    socket.on('error', onErr);
  });
}

async function expectCode(socket, code) {
  const line = await readLine(socket);
  if (!line.startsWith(String(code))) {
    const err = new Error(`SMTP unexpected response (wanted ${code}): ${line.trim()}`);
    err.code = 'smtp_error';
    throw err;
  }
  return line;
}

async function writeCmd(socket, cmd) {
  socket.write(cmd + '\r\n');
}

async function sendRawSmtp(cfg, { to, subject, text, html }) {
  const connect = () =>
    new Promise((resolve, reject) => {
      const sock = cfg.secure
        ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host }, () => resolve(sock))
        : net.connect({ host: cfg.host, port: cfg.port }, () => resolve(sock));
      sock.setEncoding('utf8');
      sock.on('error', reject);
    });

  let socket = await connect();
  try {
    await expectCode(socket, 220);
    await writeCmd(socket, `EHLO covenant-sync`);
    await expectCode(socket, 250);

    if (!cfg.secure && cfg.port === 587) {
      await writeCmd(socket, 'STARTTLS');
      await expectCode(socket, 220);
      socket = await new Promise((resolve, reject) => {
        const tlsSock = tls.connect({ socket, servername: cfg.host }, () => resolve(tlsSock));
        tlsSock.setEncoding('utf8');
        tlsSock.on('error', reject);
      });
      await writeCmd(socket, `EHLO covenant-sync`);
      await expectCode(socket, 250);
    }

    if (cfg.user) {
      await writeCmd(socket, 'AUTH LOGIN');
      await expectCode(socket, 334);
      await writeCmd(socket, Buffer.from(cfg.user).toString('base64'));
      await expectCode(socket, 334);
      await writeCmd(socket, Buffer.from(cfg.pass).toString('base64'));
      await expectCode(socket, 235);
    }

    await writeCmd(socket, `MAIL FROM:<${cfg.from}>`);
    await expectCode(socket, 250);
    await writeCmd(socket, `RCPT TO:<${to}>`);
    await expectCode(socket, 250);
    await writeCmd(socket, 'DATA');
    await expectCode(socket, 354);

    const boundary = 'covenant_' + Date.now();
    const headers = [
      `From: ${cfg.from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
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
    await writeCmd(socket, headers.join('\r\n') + '\r\n\r\n' + body + '\r\n.');
    await expectCode(socket, 250);
    await writeCmd(socket, 'QUIT');
    return { ok: true, via: 'raw-smtp' };
  } finally {
    try {
      socket.end();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Send an email. Throws with err.code = 'smtp_not_configured' when SMTP is unset.
 */
export async function sendMail({ to, subject, text, html }) {
  if (!smtpConfigured()) {
    const err = new Error(
      'Email is not configured on this server. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM (see docs/AUTH.md).'
    );
    err.code = 'smtp_not_configured';
    throw err;
  }
  return sendViaSmtp({ to, subject, text, html });
}
