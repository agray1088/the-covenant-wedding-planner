/**
 * Redesign depth helpers — CURSOR-IMPLEMENTATION-GUIDE §7.1
 * Type glyphs, summary bars, depth stats. Opt-in via data attributes / API.
 */
(function (global) {
  'use strict';

  var TYPE_GLYPHS = {
    text: 'A',
    string: 'A',
    A: 'A',
    number: '#',
    '#': '#',
    currency: '$',
    $: '$',
    select: '◉',
    enum: '◉',
    '◉': '◉',
    person: '☺',
    '☺': '☺',
    checkbox: '☑',
    '☑': '☑',
    link: '↗',
    '↗': '↗',
    attachment: '❐',
    '❐': '❐',
    formula: 'ƒ',
    derived: 'ƒ',
    'ƒ': 'ƒ',
    date: '▤',
    '▤': '▤'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function glyphFor(type) {
    if (!type) return '';
    return TYPE_GLYPHS[type] || TYPE_GLYPHS[String(type).toLowerCase()] || '';
  }

  /** Decorate <th data-col-type="…"> headers with type glyphs (idempotent). */
  function decorateTableHeaders(table) {
    if (!table) return;
    var heads = table.querySelectorAll('thead th[data-col-type]');
    heads.forEach(function (th) {
      if (th.querySelector('.rd-th__type')) return;
      var type = th.getAttribute('data-col-type');
      var g = glyphFor(type);
      if (!g) return;
      var span = document.createElement('span');
      span.className = 'rd-th__type';
      if (g === 'ƒ') span.className += ' rd-th__type--formula';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = g;
      th.insertBefore(span, th.firstChild);
      if (g === 'ƒ') th.classList.add('is-derived');
      th.classList.add('rd-th--typed');
    });
  }

  /**
   * Ensure a summary bar exists under a depth table wrap.
   * cells: [{ text, align?: 'left'|'right', tone?: 'warn'|'danger' }, ...]
   */
  function ensureSummaryBar(wrap, cells) {
    if (!wrap) return null;
    wrap.classList.add('rd-table-wrap--depth');
    var bar = wrap.querySelector(':scope > .rd-table-summary');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'rd-table-summary rd-table-summary--freeze';
      bar.setAttribute('role', 'row');
      wrap.appendChild(bar);
    }
    var row = bar.querySelector('.rd-table-summary__row');
    if (!row) {
      row = document.createElement('div');
      row.className = 'rd-table-summary__row';
      bar.appendChild(row);
    }
    row.innerHTML = (cells || [])
      .map(function (c) {
        var cls = 'rd-table-summary__cell';
        if (c.align === 'right' || c.num) cls += ' is-num';
        if (c.tone === 'warn') cls += ' is-warn';
        if (c.tone === 'danger') cls += ' is-danger';
        return '<div class="' + cls + '">' + esc(c.text == null ? '' : c.text) + '</div>';
      })
      .join('');
    return bar;
  }

  function personCell(name, initials) {
    var init = initials || String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) {
        return w.charAt(0).toUpperCase();
      })
      .join('');
    return (
      '<span class="rd-cell-person">' +
      '<span class="rd-avatar" aria-hidden="true">' +
      esc(init || '?') +
      '</span>' +
      '<span class="rd-cell-person__name">' +
      esc(name || '') +
      '</span></span>'
    );
  }

  function linkChip(label) {
    return (
      '<span class="rd-cell-chip">' +
      esc(label || '') +
      '<span class="rd-cell-chip__arrow" aria-hidden="true">↗</span></span>'
    );
  }

  function matrixMark(kind) {
    // ● confirmed · ○ suspected/partial · — confirmed absent · ✓ suitable
    var map = { confirmed: '●', partial: '○', absent: '—', suitable: '✓' };
    var mark = map[kind] || kind || '—';
    return (
      '<span class="rd-cell-mark" data-mark="' +
      esc(mark) +
      '">' +
      esc(mark) +
      '</span>'
    );
  }

  function rowActions(opts) {
    opts = opts || {};
    return (
      '<span class="rd-row-actions">' +
      '<button type="button" class="rd-row-actions__btn" data-action="drawer">' +
      (opts.drawerLabel || 'Open') +
      '<span class="rd-row-actions__kbd">↵</span></button>' +
      '<button type="button" class="rd-row-actions__btn" data-action="full">' +
      (opts.fullLabel || 'Full editor') +
      '<span class="rd-row-actions__kbd">⇧↵</span></button>' +
      '</span>'
    );
  }

  /**
   * Render a depth-aware stat strip.
   * items: [{ label, value, delta?, filter?, spark?: number[], target?: {pct, tick}, attention?: string, onClick? }]
   */
  function renderStats(host, items) {
    if (!host) return;
    var attentionUsed = false;
    host.classList.add('rd-stats', 'm-stats');
    host.innerHTML = (items || [])
      .map(function (it) {
        var attention = !attentionUsed && it.attention;
        if (attention) attentionUsed = true;
        var cls = 'rd-stat m-stat' + (attention ? ' is-attention' : '');
        var html = '<button type="button" class="' + cls + '"';
        if (it.filter) html += ' data-filter="' + esc(it.filter) + '"';
        html += '>';
        html += '<div class="rd-stat__label m-stat-label">' + esc(it.label) + '</div>';
        html += '<div class="rd-stat__value-row">';
        html += '<div class="rd-stat__value m-stat-val">' + esc(it.value) + '</div>';
        if (it.delta) {
          var dcls = 'rd-stat__delta';
          if (it.deltaTone === 'down') dcls += ' is-down';
          if (it.deltaTone === 'flat') dcls += ' is-flat';
          html += '<div class="' + dcls + '">' + esc(it.delta) + '</div>';
        }
        html += '</div>';
        if (it.spark && it.spark.length) {
          var max = Math.max.apply(null, it.spark.concat([1]));
          html +=
            '<div class="rd-stat__spark" aria-hidden="true">' +
            it.spark
              .map(function (n) {
                var h = Math.max(8, Math.round((n / max) * 100));
                return '<i style="height:' + h + '%"></i>';
              })
              .join('') +
            '</div>';
        }
        if (it.target) {
          var pct = Math.max(0, Math.min(100, Number(it.target.pct) || 0));
          var tick = Math.max(0, Math.min(100, Number(it.target.tick) || 0));
          var over = pct > tick;
          html +=
            '<div class="rd-stat__target" aria-hidden="true">' +
            '<div class="rd-stat__target-fill' +
            (over ? ' is-over' : '') +
            '" style="width:' +
            pct +
            '%"></div>' +
            '<div class="rd-stat__target-tick" style="left:' +
            tick +
            '%"></div></div>';
        }
        if (attention) {
          html += '<div class="rd-stat__note">' + esc(it.attention) + '</div>';
        }
        if (it.filter) {
          html += '<div class="rd-stat__filter">' + esc(it.filter) + '</div>';
        }
        html += '</button>';
        return html;
      })
      .join('');
  }

  /** Empty field placeholder — never a blank box. */
  function emptyAdd(label) {
    return (
      '<button type="button" class="rd-empty-add rd-field-row__value is-empty">' +
      esc(label || 'Add…') +
      '</button>'
    );
  }

  global.RdDepth = {
    TYPE_GLYPHS: TYPE_GLYPHS,
    glyphFor: glyphFor,
    decorateTableHeaders: decorateTableHeaders,
    ensureSummaryBar: ensureSummaryBar,
    personCell: personCell,
    linkChip: linkChip,
    matrixMark: matrixMark,
    rowActions: rowActions,
    renderStats: renderStats,
    emptyAdd: emptyAdd
  };
})(typeof window !== 'undefined' ? window : globalThis);
