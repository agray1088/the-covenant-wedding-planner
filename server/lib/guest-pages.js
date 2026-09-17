/**
 * Simple mobile-friendly guest HTML (RSVP form + gated portal landing).
 * Not a marketing site — one clean composition per page.
 */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout({ title, body, script }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<style>
  :root {
    --ink: #1c1917;
    --muted: #57534e;
    --paper: #faf7f2;
    --card: #ffffff;
    --line: #e7e5e4;
    --accent: #3f5d4a;
    --accent-ink: #f8faf8;
    --warn: #9a3412;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    color: var(--ink);
    background:
      radial-gradient(1200px 600px at 10% -10%, #e8efe9 0%, transparent 55%),
      radial-gradient(900px 500px at 100% 0%, #f3ebe3 0%, transparent 50%),
      var(--paper);
  }
  main {
    max-width: 28rem;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 3rem;
  }
  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 0 0 0.35rem;
    line-height: 1.2;
  }
  .lead { color: var(--muted); margin: 0 0 1.5rem; line-height: 1.45; font-size: 1.05rem; }
  .panel {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 1.25rem;
  }
  label { display: block; font-size: 0.85rem; color: var(--muted); margin: 0.85rem 0 0.35rem; }
  input, select, textarea {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--line);
    border-radius: 8px;
    font: inherit;
    background: #fff;
    color: var(--ink);
  }
  textarea { min-height: 5rem; resize: vertical; }
  .row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .row > * { flex: 1 1 8rem; }
  button, .btn {
    display: inline-block;
    margin-top: 1.25rem;
    padding: 0.7rem 1.1rem;
    border: 0;
    border-radius: 8px;
    background: var(--accent);
    color: var(--accent-ink);
    font: inherit;
    font-size: 1rem;
    cursor: pointer;
    text-decoration: none;
  }
  button.secondary { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
  .msg { margin-top: 1rem; padding: 0.75rem; border-radius: 8px; background: #f5f5f4; color: var(--muted); }
  .msg.ok { background: #ecfdf5; color: #065f46; }
  .msg.err { background: #fef2f2; color: var(--warn); }
  .meta { margin-top: 1.5rem; font-size: 0.8rem; color: #a8a29e; }
  .pub-block { margin: 0 0 1rem; }
  .pub-block h2 { font-size: 1rem; margin: 0 0 0.35rem; }
  .pub-block p { margin: 0; color: var(--muted); line-height: 1.45; }
</style>
</head>
<body>
<main>${body}</main>
${script ? `<script>${script}</script>` : ''}
</body>
</html>`;
}

export function rsvpPageHtml({ guestName, weddingName, weddingDate, token, existing }) {
  const ex = existing || {};
  const body = `
    <h1>RSVP</h1>
    <p class="lead">${esc(weddingName || 'Wedding')}${weddingDate ? ` · ${esc(weddingDate)}` : ''}<br>
    Hi ${esc(guestName || 'there')} — please let us know if you can join us.</p>
    <form class="panel" id="rsvp-form" method="post" action="/guest/rsvp/${esc(token)}">
      <label for="attending">Will you attend?</label>
      <select id="attending" name="rsvp" required>
        <option value="">Choose…</option>
        <option value="yes"${ex.rsvp === 'yes' ? ' selected' : ''}>Joyfully attending</option>
        <option value="no"${ex.rsvp === 'no' ? ' selected' : ''}>Unable to attend</option>
        <option value="maybe"${ex.rsvp === 'maybe' ? ' selected' : ''}>Maybe</option>
      </select>
      <label for="meal">Meal preference</label>
      <input id="meal" name="meal" maxlength="120" value="${esc(ex.meal || '')}" placeholder="e.g. chicken, vegetarian">
      <label for="dietary">Dietary notes</label>
      <input id="dietary" name="dietary" maxlength="200" value="${esc(ex.dietary || '')}" placeholder="allergies or restrictions">
      <label><input type="checkbox" name="plusOne" value="1"${ex.plusOne ? ' checked' : ''} style="width:auto;margin-right:0.4rem"> Bringing a +1</label>
      <label for="notes">Message for the couple</label>
      <textarea id="notes" name="notes" maxlength="1000" placeholder="Optional note">${esc(ex.notes || '')}</textarea>
      <button type="submit">Submit RSVP</button>
      <div id="msg" class="msg" hidden></div>
    </form>
    <p class="meta">This link is personal to you. Please do not share it publicly.</p>
  `;
  const script = `
    const form = document.getElementById('rsvp-form');
    const msg = document.getElementById('msg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.hidden = false;
      msg.className = 'msg';
      msg.textContent = 'Saving…';
      const fd = new FormData(form);
      const body = {
        rsvp: fd.get('rsvp'),
        meal: fd.get('meal') || '',
        dietary: fd.get('dietary') || '',
        plusOne: fd.get('plusOne') === '1',
        notes: fd.get('notes') || ''
      };
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || data.error || ('HTTP ' + res.status));
        msg.className = 'msg ok';
        msg.textContent = data.message || 'Thank you — your RSVP was saved.';
      } catch (err) {
        msg.className = 'msg err';
        msg.textContent = err.message || 'Could not save RSVP.';
      }
    });
  `;
  return layout({ title: `RSVP · ${weddingName || 'Wedding'}`, body, script });
}

export function portalPageHtml({ slug, weddingName, accessMode, published, unlocked }) {
  const pub = published || {};
  const title = pub.headline || weddingName || 'Wedding';
  const blocks = [];
  if (pub.date) blocks.push(`<div class="pub-block"><h2>Date</h2><p>${esc(pub.date)}</p></div>`);
  if (pub.venue) blocks.push(`<div class="pub-block"><h2>Venue</h2><p>${esc(pub.venue)}</p></div>`);
  if (pub.schedule) blocks.push(`<div class="pub-block"><h2>Schedule</h2><p>${esc(pub.schedule)}</p></div>`);
  if (pub.dressCode) blocks.push(`<div class="pub-block"><h2>Dress code</h2><p>${esc(pub.dressCode)}</p></div>`);
  if (pub.message) blocks.push(`<div class="pub-block"><h2>Note</h2><p>${esc(pub.message)}</p></div>`);
  if (pub.rsvpHint) blocks.push(`<div class="pub-block"><h2>RSVP</h2><p>${esc(pub.rsvpHint)}</p></div>`);

  let gate = '';
  if (!unlocked && accessMode !== 'unlisted') {
    const needEmail = accessMode === 'email' || accessMode === 'email_or_code';
    const needCode = accessMode === 'code' || accessMode === 'email_or_code';
    gate = `
      <form class="panel" id="gate-form">
        <p class="lead" style="margin-bottom:0.75rem">This page is private. ${
          accessMode === 'email' ? 'Enter the email from your invitation.'
            : accessMode === 'code' ? 'Enter the access code from the couple.'
            : 'Enter your invitation email or the access code.'
        }</p>
        ${needEmail ? `<label for="email">Guest email</label><input id="email" name="email" type="email" autocomplete="email">` : ''}
        ${needCode ? `<label for="code">Access code</label><input id="code" name="code" type="text" autocomplete="off">` : ''}
        <button type="submit">Continue</button>
        <div id="msg" class="msg" hidden></div>
      </form>`;
  }

  const body = `
    <h1>${esc(title)}</h1>
    <p class="lead">${esc(pub.subhead || (weddingName ? `${weddingName}` : 'Private guest page'))}</p>
    ${gate || `<div class="panel">${blocks.length ? blocks.join('') : '<p class="lead" style="margin:0">Welcome. Details will appear here when the couple publishes them.</p>'}</div>`}
    <p class="meta">Unlisted · not indexed for search engines</p>
  `;
  const script = unlocked || accessMode === 'unlisted' ? '' : `
    const form = document.getElementById('gate-form');
    const msg = document.getElementById('msg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.hidden = false;
      msg.className = 'msg';
      msg.textContent = 'Checking…';
      const fd = new FormData(form);
      try {
        const res = await fetch('/p/${esc(slug)}/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: fd.get('email') || '', code: fd.get('code') || '' })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || data.error || ('HTTP ' + res.status));
        if (data.token) {
          document.cookie = 'covenant_portal_' + ${JSON.stringify(slug)} + '=' + encodeURIComponent(data.token)
            + '; Path=/; Max-Age=86400; SameSite=Lax';
        }
        location.reload();
      } catch (err) {
        msg.className = 'msg err';
        msg.textContent = err.message || 'Access denied.';
      }
    });
  `;
  return layout({ title, body, script });
}

export function simpleMessagePage(title, message, isError) {
  return layout({
    title,
    body: `<h1>${esc(title)}</h1><div class="msg ${isError ? 'err' : 'ok'}">${esc(message)}</div>`
  });
}
