/* Weekend Logistics — Transport gantt (Views.dc #31f) & Rooms household
   rows (Views.dc #31e).

   Layers a read surface on top of the existing transportation / hotelBlocks /
   travelAccommodations CWP tables in planner.js:
     - Transport view gets a 12pm–midnight gantt: one row per vehicle (split
       per day when a vehicle runs on more than one date), bars positioned
       from pickupTime/dropoffTime and coloured by coverage.
     - Rooms view gets grouped household rows: one group per hotel block,
       a "covered by the couple" group, a "staying elsewhere" group, and a
       "nowhere booked" group built from guests with neither a travel row
       nor a home address on file.
   The raw CWP tables stay mounted (tucked under "Edit as table") so every
   record is still directly editable — this file only adds the surfaces the
   mocks draw above them. */
(function (global) {
  'use strict';

  function esc(v) {
    return typeof escapeHtml === 'function' ? escapeHtml(v) : String(v == null ? '' : v);
  }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function num(v) {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }
  function money(n) {
    if (!n) return '';
    return typeof fmt === 'function' ? fmt(n) : ('$' + Math.round(n).toLocaleString('en-US'));
  }
  function dateLabel(iso, opts) {
    if (!iso) return '';
    return typeof humanDate === 'function' ? humanDate(iso, opts || { month: 'short', day: 'numeric' }) : iso;
  }
  function timeLabel(hhmm) {
    if (!hhmm) return '';
    return typeof humanTime === 'function' ? humanTime(hhmm) : hhmm;
  }
  function minutesOf(hhmm) {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''));
    if (!m) return null;
    return (parseInt(m[1], 10) || 0) * 60 + (parseInt(m[2], 10) || 0);
  }
  function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }
  function personMatch(nameA, nameB) {
    const a = String(nameA || '').trim();
    const b = String(nameB || '').trim();
    if (!a || !b) return false;
    if (a.toLowerCase() === b.toLowerCase()) return true;
    const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reA = new RegExp('\\b' + escRe(a) + '\\b', 'i');
    const reB = new RegExp('\\b' + escRe(b) + '\\b', 'i');
    return reA.test(b) || reB.test(a);
  }
  function emptyState(text) {
    return `<div class="rd-log-gantt__empty rd-log-rooms__empty">${esc(text)}</div>`;
  }

  /* ============================== Transport gantt (31f) ================= */

  const AXIS_START = 12 * 60;
  const AXIS_END = 24 * 60;
  const AXIS_SPAN = AXIS_END - AXIS_START;

  function axisPercent(mins) {
    const clamped = Math.max(AXIS_START, Math.min(AXIS_END, mins));
    return ((clamped - AXIS_START) / AXIS_SPAN) * 100;
  }
  function barStyle(startMins, endMins) {
    const left = axisPercent(startMins);
    const right = axisPercent(endMins);
    const width = Math.max(right - left, 2.4);
    return `left:${left.toFixed(2)}%;width:${width.toFixed(2)}%`;
  }
  function movementWindow(r) {
    let s = minutesOf(r.pickupTime);
    let e = minutesOf(r.dropoffTime);
    if (s == null) s = AXIS_START;
    if (e == null || e <= s) e = s + 30;
    return { start: s, end: e };
  }

  /* A driver's own commitments — weekend timeline items and vendor
     appointments where the host/contact is the same person as a driver. */
  function buildPersonCommitments() {
    const list = [];
    arr(global.data && global.data.weekendTimeline).forEach(w => {
      if (!w.host) return;
      list.push({
        person: w.host,
        date: String(w.date || '').slice(0, 10),
        start: w.start, end: w.end,
        label: w.event || 'Weekend item'
      });
    });
    arr(global.data && global.data.appointments).forEach(a => {
      if (!a.contact) return;
      list.push({
        person: a.contact,
        date: String(a.date || '').slice(0, 10),
        start: a.time, end: '',
        label: a.title || 'Appointment'
      });
    });
    return list;
  }

  function movementBarStatus(r, win, commitments) {
    const driver = String(r.driver || '').trim();
    if (!driver) return { tone: 'red' };
    const iso = String(r.date || '').slice(0, 10);
    const clash = commitments.find(c => {
      if (iso && c.date && c.date !== iso) return false;
      if (!personMatch(driver, c.person)) return false;
      const cs = minutesOf(c.start);
      if (cs == null) return false;
      let ce = minutesOf(c.end);
      if (ce == null || ce <= cs) ce = cs + 45;
      return overlaps(win.start, win.end, cs, ce);
    });
    return clash ? { tone: 'amber', clash } : { tone: 'green' };
  }

  function buildTransportLanes(rows) {
    const byLane = new Map();
    rows.forEach((r, idx) => {
      const vehicle = String(r.vehicle || '').trim();
      const driver = String(r.driver || '').trim();
      const baseKey = vehicle || (driver ? 'driver:' + driver.toLowerCase() : 'row:' + idx);
      const iso = String(r.date || '').slice(0, 10);
      const laneKey = baseKey.toLowerCase() + '::' + iso;
      if (!byLane.has(laneKey)) byLane.set(laneKey, { key: baseKey, iso, rows: [] });
      byLane.get(laneKey).rows.push(r);
    });
    return Array.from(byLane.values())
      .sort((a, b) => {
        const d = (a.iso || 'zzzz').localeCompare(b.iso || 'zzzz');
        return d || a.key.localeCompare(b.key);
      })
      .map(lane => {
        lane.rows.sort((a, b) => (minutesOf(a.pickupTime) || 0) - (minutesOf(b.pickupTime) || 0));
        return lane;
      });
  }

  function laneMeta(lane) {
    const vehicleCounts = {};
    const driverCounts = {};
    const groupNames = new Set();
    lane.rows.forEach(r => {
      const v = String(r.vehicle || '').trim();
      const d = String(r.driver || '').trim();
      if (v) vehicleCounts[v] = (vehicleCounts[v] || 0) + 1;
      if (d) driverCounts[d] = (driverCounts[d] || 0) + 1;
      if (r.group) groupNames.add(String(r.group).trim());
    });
    const topKey = counts => Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '';
    const vehicle = topKey(vehicleCounts);
    const driver = topKey(driverCounts);
    let title;
    if (vehicle && driver) title = vehicle + ' · ' + driver;
    else if (vehicle) title = vehicle + ' · unassigned';
    else if (driver) title = 'Driver · ' + driver;
    else title = 'Unassigned vehicle';
    const dayLabel = lane.iso
      ? (typeof logisticsDayLabel === 'function' ? logisticsDayLabel({ date: lane.iso }) : dateLabel(lane.iso))
      : 'Undated';
    const runsLabel = lane.rows.length + (lane.rows.length === 1 ? ' run' : ' runs');
    const subParts = [runsLabel, dayLabel];
    if (groupNames.size === 1) subParts.push(Array.from(groupNames)[0]);
    return { title, sub: subParts.join(' · ') };
  }

  function transportBarHtml(r, win, status) {
    const time = timeLabel(r.pickupTime);
    const route = [r.pickup, r.dropoff].filter(Boolean).join(' → ');
    const titleText = (time ? time + ' ' : '') + (route || r.group || 'Movement');
    let subText = '';
    if (status.tone === 'red') subText = 'no driver booked';
    else if (status.tone === 'amber') subText = 'clash · needed at ' + (status.clash.label || 'another commitment');
    else subText = r.group || '';
    return `<div class="rd-log-gantt__bar rd-log-gantt__bar--${status.tone}" style="${barStyle(win.start, win.end)}">
      <div class="rd-log-gantt__bar-title">${esc(titleText)}</div>
      ${subText ? `<div class="rd-log-gantt__bar-sub">${esc(subText)}</div>` : ''}
    </div>`;
  }

  function transportClashText(row, win, clash) {
    const driver = esc(String(row.driver || '').trim());
    const route = esc([row.pickup, row.dropoff].filter(Boolean).join(' → ') || 'a run');
    const at = esc(timeLabel(row.pickupTime));
    const label = esc(clash.label || 'another commitment');
    const clashTime = clash.start ? ' (' + esc(timeLabel(clash.start)) + ')' : '';
    return `<b>${driver}</b> is booked for ${route} at ${at}, but is also needed at <b>${label}</b>${clashTime}.`;
  }

  function axisMarksHtml() {
    return [12, 14, 16, 18, 20, 22, 24].map(h => {
      const label = h === 24 ? '12am' : h === 12 ? '12pm' : (((h > 12 ? h - 12 : h)) + (h >= 12 ? 'pm' : 'am'));
      return `<span class="rd-log-gantt__axis-mark">${label}</span>`;
    }).join('');
  }

  function renderLogisticsTransportGantt() {
    const host = document.getElementById('logistics-transport-gantt');
    if (!host) return;
    const rows = arr(global.data && global.data.transportation);
    if (!rows.length) {
      host.innerHTML = emptyState('No transportation movements recorded yet.');
      return;
    }
    const commitments = buildPersonCommitments();
    const lanes = buildTransportLanes(rows);
    const clashes = [];

    const rowsHtml = lanes.map(lane => {
      const meta = laneMeta(lane);
      const bars = lane.rows.map(r => {
        const win = movementWindow(r);
        const status = movementBarStatus(r, win, commitments);
        if (status.tone === 'amber') clashes.push({ row: r, win, clash: status.clash });
        return transportBarHtml(r, win, status);
      }).join('');
      return `<div class="rd-log-gantt__row">
        <div class="rd-log-gantt__label">
          <div class="rd-log-gantt__label-title">${esc(meta.title)}</div>
          <div class="rd-log-gantt__label-sub">${esc(meta.sub)}</div>
        </div>
        <div class="rd-log-gantt__track">${bars}</div>
      </div>`;
    }).join('');

    const clashHtml = clashes.length ? `<div class="rd-log-gantt__clash">
      <div class="rd-log-gantt__clash-title">Clash${clashes.length === 1 ? '' : 'es'} the schedule doesn't check on its own</div>
      ${clashes.map(c => `<div class="rd-log-gantt__clash-item">${transportClashText(c.row, c.win, c.clash)}</div>`).join('')}
    </div>` : '';

    host.innerHTML = clashHtml
      + `<div class="rd-log-gantt__axis"><span class="rd-log-gantt__axis-spacer"></span>${axisMarksHtml()}</div>`
      + `<div class="rd-log-gantt__rows">${rowsHtml}</div>`;
  }

  function logisticsTransportStatsData() {
    const rows = arr(global.data && global.data.transportation);
    const vehicleKeys = new Set();
    let covered = 0, noDriver = 0, spend = 0;
    rows.forEach((r, idx) => {
      const vehicle = String(r.vehicle || '').trim();
      const driver = String(r.driver || '').trim();
      vehicleKeys.add((vehicle || (driver ? 'driver:' + driver.toLowerCase() : 'row:' + idx)).toLowerCase());
      if (driver) covered++; else noDriver++;
      spend += num(r.cost);
    });
    return { vehicles: vehicleKeys.size, movements: rows.length, covered, noDriver, spend };
  }

  /* ============================== Rooms grouped list (31e) =============== */

  function accommodationPayer(r) {
    if (r.payer === 'couple' || r.payer === 'direct') return r.payer;
    const g = String(r.group || '').toLowerCase();
    if (/wedding party|vip/.test(g)) return 'couple';
    return 'direct';
  }
  function accommodationNights(r) {
    if (!r.arrival || !r.departure || typeof dateFromISO !== 'function') return null;
    const a = dateFromISO(r.arrival);
    const b = dateFromISO(r.departure);
    if (!a || !b) return null;
    const diff = Math.round((b - a) / 86400000);
    return diff > 0 ? diff : null;
  }
  function guestHeadcount(g) {
    let n = 1;
    if (/&| and /i.test(String(g.name || ''))) n += 1;
    if (g.plusone) n += 1;
    const kids = parseInt(g.children, 10);
    if (kids > 0) n += kids;
    return n;
  }

  /* Households with neither a travel/accommodation row nor a home address
     on file — the "nobody knows where they're sleeping" list. A populated
     address on any member of the household is treated as "local, no room
     needed" rather than unresolved. */
  function nowhereBookedHouseholds() {
    const guests = arr(global.data && global.data.guests);
    const travel = arr(global.data && global.data.travelAccommodations);
    const housedNames = new Set(travel.map(r => String(r.guest || '').trim().toLowerCase()).filter(Boolean));

    const resolvedHouseholds = new Set();
    guests.forEach(g => {
      const nameKey = String(g.name || '').trim().toLowerCase();
      const household = String(g.household || g.name || 'Guest').trim();
      if (housedNames.has(nameKey) || String(g.address || '').trim()) resolvedHouseholds.add(household);
    });

    const byHousehold = new Map();
    guests.forEach(g => {
      const household = String(g.household || g.name || 'Guest').trim();
      if (resolvedHouseholds.has(household)) return;
      if (!byHousehold.has(household)) byHousehold.set(household, { household, headcount: 0 });
      byHousehold.get(household).headcount += guestHeadcount(g);
    });
    return Array.from(byHousehold.values()).sort((a, b) => b.headcount - a.headcount);
  }

  function roomsStatusPill(status) {
    const s = String(status || '').trim();
    let scheme = 'green', label = s || 'Confirmed';
    if (/at risk|unclaimed/i.test(s)) scheme = 'gold';
    else if (/unresolved|nowhere|no answer/i.test(s)) scheme = 'red';
    else if (/local/i.test(s)) scheme = 'gray';
    return `<span class="status-pill" data-pillscheme="${scheme}">${esc(label)}</span>`;
  }

  function roomsHouseholdRowHtml(r) {
    const nights = accommodationNights(r);
    const rooms = parseInt(r.rooms, 10) || 1;
    const metaParts = [];
    if (r.arrival) {
      const range = dateLabel(r.arrival) + (r.departure ? '–' + dateLabel(r.departure) : '');
      metaParts.push(range);
    }
    if (nights) metaParts.push(nights + (nights === 1 ? ' night' : ' nights'));
    const payer = accommodationPayer(r);
    const payerLabel = payer === 'couple' ? 'Couple pays' : 'Paid direct';
    const amount = money(num(r.cost)) || '—';
    return `<div class="rd-log-rooms__row">
      <div class="rd-log-rooms__who">
        <div class="rd-log-rooms__name">${esc(r.guest || 'Guest')}${rooms > 1 ? ' · ' + rooms + ' rooms' : ''}</div>
        ${metaParts.length ? `<div class="rd-log-rooms__meta">${esc(metaParts.join(' · '))}</div>` : ''}
      </div>
      <div class="rd-log-rooms__payer">${esc(payerLabel)}</div>
      <div class="rd-log-rooms__amount">${esc(amount)}</div>
      <div class="rd-log-rooms__status">${roomsStatusPill(r.status || 'Confirmed')}</div>
    </div>`;
  }

  function roomsResidualRowHtml(n, cutoffLabel) {
    return `<div class="rd-log-rooms__row rd-log-rooms__row--residual">
      <div class="rd-log-rooms__who">
        <div class="rd-log-rooms__name">${n} room${n === 1 ? '' : 's'} unclaimed</div>
        <div class="rd-log-rooms__meta">Held at the block rate</div>
      </div>
      <div class="rd-log-rooms__payer">${cutoffLabel ? 'Release ' + esc(cutoffLabel) : '—'}</div>
      <div class="rd-log-rooms__amount">$0</div>
      <div class="rd-log-rooms__status">${roomsStatusPill('At risk')}</div>
    </div>`;
  }

  function intOrNull(v) {
    if (v === undefined || v === null || String(v).trim() === '') return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }
  function roomsBlockGroupHtml(block, rows) {
    const reserved = intOrNull(block.reserved);
    const booked = intOrNull(block.booked);
    const taken = booked != null ? booked : rows.length;
    const held = reserved != null ? reserved : Math.max(taken, rows.length);
    const unclaimed = Math.max(0, held - taken);
    const cutoffLabel = block.cutoff ? dateLabel(block.cutoff) : '';
    const title = `${esc(block.hotel || 'Hotel')} block · ${held} room${held === 1 ? '' : 's'} held · ${taken} taken`;
    const sub = cutoffLabel
      ? `release date ${esc(cutoffLabel)}${unclaimed ? ` · ${unclaimed} room${unclaimed === 1 ? '' : 's'} will be lost if unclaimed` : ''}`
      : (block.rate ? `rate ${esc(block.rate)}` : '');
    let rowsHtml = rows.map(roomsHouseholdRowHtml).join('');
    if (unclaimed > 0) rowsHtml += roomsResidualRowHtml(unclaimed, cutoffLabel);
    if (!rowsHtml) {
      rowsHtml = `<div class="rd-log-rooms__row"><div class="rd-log-rooms__who"><div class="rd-log-rooms__name" style="font-style:italic;color:var(--text-muted,#8a7e6b)">No households claimed from this block yet</div></div></div>`;
    }
    return `<div class="rd-log-rooms__group">
      <div class="rd-log-rooms__group-head">
        <span class="rd-log-rooms__group-title">${title}</span>
        ${sub ? `<span class="rd-log-rooms__group-sub">${sub}</span>` : ''}
      </div>
      ${rowsHtml}
    </div>`;
  }

  function roomsCoupleGroupHtml(rows) {
    const total = rows.reduce((s, r) => s + num(r.cost), 0);
    const roomCount = rows.reduce((s, r) => s + (parseInt(r.rooms, 10) || 1), 0);
    return `<div class="rd-log-rooms__group rd-log-rooms__group--couple">
      <div class="rd-log-rooms__group-head">
        <span class="rd-log-rooms__group-title">Covered by the couple</span>
        <span class="rd-log-rooms__group-sub">${roomCount} room${roomCount === 1 ? '' : 's'}${total ? ' · ' + money(total) + ' posts to the Accommodation line' : ''}</span>
      </div>
      ${rows.map(roomsHouseholdRowHtml).join('')}
    </div>`;
  }

  function roomsElsewhereGroupHtml(rows) {
    const rowsHtml = rows.map(r => `<div class="rd-log-rooms__row">
      <div class="rd-log-rooms__who">
        <div class="rd-log-rooms__name">${esc(r.guest || 'Guest')}</div>
        ${r.notes ? `<div class="rd-log-rooms__meta">${esc(r.notes)}</div>` : ''}
      </div>
      <div class="rd-log-rooms__payer">&mdash;</div>
      <div class="rd-log-rooms__amount">&mdash;</div>
      <div class="rd-log-rooms__status">${roomsStatusPill('Local')}</div>
    </div>`).join('');
    return `<div class="rd-log-rooms__group">
      <div class="rd-log-rooms__group-head">
        <span class="rd-log-rooms__group-title">Staying elsewhere · ${rows.length} household${rows.length === 1 ? '' : 's'}</span>
        <span class="rd-log-rooms__group-sub">no room needed · listed so nobody is chased twice</span>
      </div>
      ${rowsHtml}
    </div>`;
  }

  function roomsNowhereGroupHtml(list) {
    const totalGuests = list.reduce((s, h) => s + h.headcount, 0);
    if (!list.length) {
      return `<div class="rd-log-rooms__group">
        <div class="rd-log-rooms__group-head">
          <span class="rd-log-rooms__group-title">Nowhere booked · 0 guests</span>
          <span class="rd-log-rooms__group-sub">every household has an accommodation record or a home address on file</span>
        </div>
      </div>`;
    }
    const [featured, ...rest] = list;
    const plainRow = h => `<div class="rd-log-rooms__row">
      <div class="rd-log-rooms__who">
        <div class="rd-log-rooms__name">${esc(h.household)} household</div>
        <div class="rd-log-rooms__meta">${h.headcount} guest${h.headcount === 1 ? '' : 's'}</div>
      </div>
      <div class="rd-log-rooms__payer">No room booked</div>
      <div class="rd-log-rooms__amount">&mdash;</div>
      <div class="rd-log-rooms__status">${roomsStatusPill('Unresolved')}</div>
    </div>`;
    return `<div class="rd-log-rooms__group rd-log-rooms__group--danger">
      <div class="rd-log-rooms__group-head">
        <span class="rd-log-rooms__group-title">Nowhere booked · ${totalGuests} guest${totalGuests === 1 ? '' : 's'}</span>
        <span class="rd-log-rooms__group-sub">${list.length} household${list.length === 1 ? '' : 's'} with no hotel on file</span>
      </div>
      <div class="rd-log-rooms__row rd-log-rooms__row--callout">
        <div class="rd-log-rooms__who">
          <div class="rd-log-rooms__name">${esc(featured.household)} household</div>
          <div class="rd-log-rooms__meta">${featured.headcount} guest${featured.headcount === 1 ? '' : 's'} · highest headcount still unresolved</div>
        </div>
        <div class="rd-log-rooms__payer">No room booked</div>
        <div class="rd-log-rooms__amount">&mdash;</div>
        <div class="rd-log-rooms__status">${roomsStatusPill('Unresolved')}</div>
      </div>
      ${rest.map(plainRow).join('')}
    </div>`;
  }

  function renderLogisticsRoomsGrouped() {
    const host = document.getElementById('logistics-rooms-grouped');
    if (!host) return;
    const blocks = arr(global.data && global.data.hotelBlocks);
    const travel = arr(global.data && global.data.travelAccommodations);

    if (!blocks.length && !travel.length) {
      host.innerHTML = emptyState('No hotel blocks or accommodations recorded yet.');
      return;
    }

    const byHotel = new Map();
    const elsewhere = [];
    travel.forEach(r => {
      const hotel = String(r.hotel || '').trim();
      if (!hotel || /^local$/i.test(hotel)) { elsewhere.push(r); return; }
      const key = hotel.toLowerCase();
      if (!byHotel.has(key)) byHotel.set(key, []);
      byHotel.get(key).push(r);
    });

    const coupleRows = [];
    let html = '';
    blocks.forEach(h => {
      const key = String(h.hotel || '').trim().toLowerCase();
      const rows = byHotel.get(key) || [];
      byHotel.delete(key);
      const directRows = rows.filter(r => accommodationPayer(r) !== 'couple');
      rows.filter(r => accommodationPayer(r) === 'couple').forEach(r => coupleRows.push(r));
      html += roomsBlockGroupHtml(h, directRows);
    });
    /* hotel names present on a travel row but with no matching hotelBlocks entry */
    byHotel.forEach(rows => {
      const directRows = rows.filter(r => accommodationPayer(r) !== 'couple');
      rows.filter(r => accommodationPayer(r) === 'couple').forEach(r => coupleRows.push(r));
      if (directRows.length) html += roomsBlockGroupHtml({ hotel: rows[0].hotel, reserved: '', booked: String(directRows.length), cutoff: '' }, directRows);
    });

    if (coupleRows.length) html += roomsCoupleGroupHtml(coupleRows);
    if (elsewhere.length) html += roomsElsewhereGroupHtml(elsewhere);
    html += roomsNowhereGroupHtml(nowhereBookedHouseholds());

    host.innerHTML = html;
  }

  function logisticsRoomsStatsData() {
    const blocks = arr(global.data && global.data.hotelBlocks);
    const travel = arr(global.data && global.data.travelAccommodations);
    let roomsHeld = 0, claimed = 0;
    blocks.forEach(h => {
      const reserved = intOrNull(h.reserved);
      const booked = intOrNull(h.booked) || 0;
      roomsHeld += reserved != null ? reserved : booked;
      claimed += booked;
    });
    let releaseBlock = null;
    blocks.forEach(h => {
      if (!h.cutoff) return;
      if (!releaseBlock || String(h.cutoff) < String(releaseBlock.cutoff)) releaseBlock = h;
    });
    const releaseAtRisk = releaseBlock
      ? Math.max(0, (intOrNull(releaseBlock.reserved) || 0) - (intOrNull(releaseBlock.booked) || 0))
      : 0;
    const releaseLabel = releaseBlock ? dateLabel(releaseBlock.cutoff) : '—';

    let couplePays = 0;
    travel.forEach(r => { if (accommodationPayer(r) === 'couple') couplePays += num(r.cost); });

    const nowhere = nowhereBookedHouseholds();
    const nowhereGuests = nowhere.reduce((s, h) => s + h.headcount, 0);

    return { roomsHeld, claimed, releaseLabel, releaseAtRisk, couplePays, nowhereGuests, nowhereHouseholds: nowhere.length };
  }

  global.renderLogisticsTransportGantt = renderLogisticsTransportGantt;
  global.renderLogisticsRoomsGrouped = renderLogisticsRoomsGrouped;
  global.logisticsTransportStatsData = logisticsTransportStatsData;
  global.logisticsRoomsStatsData = logisticsRoomsStatsData;
  global.logisticsNowhereBookedHouseholds = nowhereBookedHouseholds;
})(typeof window !== 'undefined' ? window : this);
