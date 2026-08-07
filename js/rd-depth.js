/**
 * Redesign depth helpers — CURSOR-IMPLEMENTATION-GUIDE §7.1
 * Type glyphs, summary bars, depth stats, table decoration.
 * Works with CWP `data-t` headers and opt-in `data-col-type`.
 */
(function (global) {
  'use strict';

  var TYPE_GLYPHS = {
    text: 'A',
    string: 'A',
    A: 'A',
    number: '#',
    num: '#',
    '#': '#',
    currency: '$',
    money: '$',
    $: '$',
    select: '◉',
    enum: '◉',
    status: '◉',
    '◉': '◉',
    person: '☺',
    name: '☺',
    '☺': '☺',
    checkbox: '☑',
    bool: '☑',
    '☑': '☑',
    link: '↗',
    ref: '↗',
    '↗': '↗',
    attachment: '❐',
    file: '❐',
    '❐': '❐',
    formula: 'ƒ',
    derived: 'ƒ',
    'ƒ': 'ƒ',
    date: '▤',
    time: '▤',
    '▤': '▤',
    drag: ''
  };

  var LABEL_TYPE_HINTS = [
    [/\$|amount|cost|paid|price|budget|cover|total|balance|due|pledged/i, 'currency'],
    [/date|due|fitting|when|deadline/i, 'date'],
    [/^#|count|qty|quantity|seats|guests|shots|files|covers$/i, 'number'],
    [/name|guest|member|giver|owner|vendor|person|who/i, 'person'],
    [/phone|email|link|url|site/i, 'link'],
    [/file|attach|document|pdf/i, 'attachment'],
    [/rsvp|status|side|role|meal|group|type|reply|attire|method/i, 'select'],
    [/family|invited|thank|plus|must|yes|check/i, 'checkbox']
  ];

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

  function inferTypeFromLabel(label) {
    var t = String(label || '').replace(/[▾▲▼]/g, '').trim();
    if (!t) return 'text';
    for (var i = 0; i < LABEL_TYPE_HINTS.length; i++) {
      if (LABEL_TYPE_HINTS[i][0].test(t)) return LABEL_TYPE_HINTS[i][1];
    }
    return 'text';
  }

  function headerType(th) {
    return (
      th.getAttribute('data-col-type') ||
      th.getAttribute('data-t') ||
      inferTypeFromLabel(th.textContent)
    );
  }

  function headerLabelText(th) {
    var clone = th.cloneNode(true);
    clone.querySelectorAll('.rd-th__type, .cwp-col-resizer, .col-filter, .cwp-col-filter, button, input').forEach(function (n) {
      n.remove();
    });
    return (clone.textContent || '').replace(/[▾▲▼]/g, '').replace(/\s+/g, ' ').trim();
  }

  /** Decorate headers with type glyphs (idempotent). */
  function decorateTableHeaders(table) {
    if (!table) return;
    var heads = table.querySelectorAll('thead th');
    heads.forEach(function (th) {
      if (th.classList.contains('cwp-sel') || th.classList.contains('rd-th--add')) return;
      if (th.querySelector('.rd-th__type')) return;
      if (th.querySelector('input[type="checkbox"]') && !(th.getAttribute('data-t') || th.getAttribute('data-col-type'))) {
        th.setAttribute('data-col-type', 'checkbox');
      }
      var type = headerType(th);
      if (!th.getAttribute('data-col-type')) th.setAttribute('data-col-type', type);
      var g = glyphFor(type);
      if (!g) return;
      var span = document.createElement('span');
      span.className = 'rd-th__type';
      if (g === 'ƒ') span.className += ' rd-th__type--formula';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = g;
      var flx = th.querySelector('.cwp-th-flx');
      if (flx) flx.insertBefore(span, flx.firstChild);
      else th.insertBefore(span, th.firstChild);
      if (g === 'ƒ') th.classList.add('is-derived');
      th.classList.add('rd-th--typed');
      if (type === 'currency' || type === 'money' || type === 'number' || type === 'num') {
        th.classList.add('is-num');
      }
    });
  }

  function decoratePersonCells(table) {
    if (!table) return;
    var heads = Array.prototype.slice.call(table.querySelectorAll('thead tr:last-child th'));
    var personIdx = [];
    heads.forEach(function (th, i) {
      var type = headerType(th);
      var label = headerLabelText(th).toLowerCase();
      if (type === 'person' || type === 'name' || /^(guest|member|name|giver|owner|vendor)$/.test(label)) {
        personIdx.push(i);
      }
    });
    if (!personIdx.length) return;
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      if (tr.classList.contains('is-group') || tr.classList.contains('is-add') || tr.classList.contains('cwp-group')) return;
      personIdx.forEach(function (i) {
        var td = tr.children[i];
        if (!td || td.querySelector('.rd-cell-person, .rd-avatar, input, select, button')) return;
        var name = (td.textContent || '').replace(/\s+/g, ' ').trim();
        if (!name || name === '—' || name === '-' || name === '+') return;
        td.innerHTML = personCell(name);
      });
    });
  }

  function alignTypedCells(table) {
    if (!table) return;
    var heads = Array.prototype.slice.call(table.querySelectorAll('thead tr:last-child th'));
    var types = heads.map(headerType);
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      if (tr.classList.contains('is-group') || tr.classList.contains('cwp-group')) return;
      types.forEach(function (type, i) {
        var td = tr.children[i];
        if (!td) return;
        if (!td.getAttribute('data-col-type')) td.setAttribute('data-col-type', type);
        if (type === 'currency' || type === 'money' || type === 'number' || type === 'num') {
          td.classList.add('is-num');
        }
        if (type === 'formula' || type === 'derived' || type === 'ƒ') {
          td.classList.add('is-derived');
        }
        if (type === 'checkbox' || type === 'bool') {
          td.classList.add('is-check');
        }
      });
    });
  }

  /**
   * Summary bar — counts blanks / failures in colour when cells not provided.
   * cells: [{ text, align?, tone? }, ...] optional override.
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
    if (cells && cells.length) {
      row.innerHTML = cells
        .map(function (c) {
          var cls = 'rd-table-summary__cell';
          if (c.align === 'right' || c.num) cls += ' is-num';
          if (c.tone === 'warn') cls += ' is-warn';
          if (c.tone === 'danger') cls += ' is-danger';
          return '<div class="' + cls + '">' + esc(c.text == null ? '' : c.text) + '</div>';
        })
        .join('');
    }
    return bar;
  }

  function buildDomSummaryCells(table) {
    var heads = Array.prototype.slice.call(table.querySelectorAll('thead tr:last-child th'));
    if (!heads.length) return [];
    var bodyRows = Array.prototype.slice.call(table.querySelectorAll('tbody tr')).filter(function (tr) {
      return !tr.classList.contains('is-group') && !tr.classList.contains('cwp-group') && !tr.classList.contains('is-add') && !tr.classList.contains('cwp-empty-cta');
    });
    var n = bodyRows.length;
    return heads.map(function (th, i) {
      var type = headerType(th);
      var blanks = 0;
      bodyRows.forEach(function (tr) {
        var td = tr.children[i];
        if (!td) {
          blanks++;
          return;
        }
        var txt = (td.textContent || '').replace(/\s+/g, ' ').trim();
        if (!txt || txt === '—' || txt === '-' || txt === '☐' || txt.toLowerCase() === 'pending') blanks++;
      });
      var isNum = type === 'currency' || type === 'money' || type === 'number' || type === 'num';
      if (i === 0 || th.classList.contains('cwp-sel')) {
        return { text: n ? n + ' rows' : '', num: false };
      }
      if (blanks) {
        return {
          text: blanks + ' blank',
          num: isNum,
          tone: blanks > Math.max(1, Math.floor(n / 4)) ? 'danger' : 'warn'
        };
      }
      return { text: '', num: isNum };
    });
  }

  function ensureAddColumn(table) {
    if (!table || table.dataset.rdAddCol === '1') return;
    var headRow = table.querySelector('thead tr:last-child');
    if (!headRow) return;
    if (headRow.querySelector('.rd-th--add')) {
      table.dataset.rdAddCol = '1';
      return;
    }
    /* Only on redesign depth tables inside .rd-scope panels — not every CWP hub table. */
    var panel = table.closest('.rd-page, [id^="panel-"]');
    if (!panel || !document.body.classList.contains('rd-scope')) return;
    if (!table.closest('.rd-surface, .rd-table-wrap--depth')) return;

    var th = document.createElement('th');
    th.className = 'rd-th--add';
    th.title = 'Add field';
    th.textContent = '＋';
    headRow.appendChild(th);
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      if (tr.classList.contains('is-group') || tr.classList.contains('cwp-group')) return;
      var td = document.createElement('td');
      td.className = 'rd-td--add';
      td.textContent = '＋';
      tr.appendChild(td);
    });
    table.dataset.rdAddCol = '1';
  }

  /** Full depth decorate for one table. */
  function decorateTable(table, opts) {
    opts = opts || {};
    if (!table || table.dataset.rdDepth === '1' && !opts.force) return table;
    decorateTableHeaders(table);
    alignTypedCells(table);
    if (opts.personCells !== false) decoratePersonCells(table);
    table.classList.add('rd-table--freeze-first');
    var wrap = table.closest('.rd-table-wrap, .cwp-table-wrap, .ued-table-wrap');
    if (wrap) {
      wrap.classList.add('rd-table-wrap--depth');
      if (opts.summary !== false) {
        ensureSummaryBar(wrap, opts.summaryCells || buildDomSummaryCells(table));
      }
    }
    if (opts.addColumn) ensureAddColumn(table);
    table.dataset.rdDepth = '1';
    return table;
  }

  /** Decorate every table under root (active panel or document). */
  function decorateAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var tables = scope.querySelectorAll('table.rd-table, table.cwp-table, .rd-table-wrap table, .cwp-table-wrap table');
    tables.forEach(function (t) {
      try {
        if (typeof isRecordEditorMiniTable === 'function' && isRecordEditorMiniTable(t)) return;
        decorateTable(t, { force: true, addColumn: false, summary: true });
      } catch (e) { /* non-fatal */ }
    });
  }

  function personCell(name, initials) {
    var init =
      initials ||
      String(name || '')
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
    var map = { confirmed: '●', partial: '○', absent: '—', suitable: '✓' };
    var mark = map[kind] || kind || '—';
    return '<span class="rd-cell-mark" data-mark="' + esc(mark) + '">' + esc(mark) + '</span>';
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
   * Depth-aware stat strip.
   * items: [{ label, value, delta?, deltaTone?, filter?, spark?, target?, attention?, onFilter? }]
   */
  function renderStats(host, items) {
    if (!host) return;
    var attentionUsed = false;
    host.classList.add('rd-stats', 'm-stats');
    host.innerHTML = (items || [])
      .map(function (it, idx) {
        var attention = !attentionUsed && it.attention;
        if (attention) attentionUsed = true;
        var cls = 'rd-stat m-stat' + (attention ? ' is-attention' : '');
        var html = '<button type="button" class="' + cls + '" data-stat-index="' + idx + '"';
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
        if (attention) html += '<div class="rd-stat__note">' + esc(it.attention) + '</div>';
        if (it.filter) html += '<div class="rd-stat__filter">' + esc(it.filter) + '</div>';
        html += '</button>';
        return html;
      })
      .join('');

    host.querySelectorAll('.rd-stat[data-stat-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-stat-index'), 10);
        var it = items[i];
        if (!it) return;
        if (typeof it.onFilter === 'function') it.onFilter(it);
        else if (it.filterAction && typeof global[it.filterAction] === 'function') global[it.filterAction](it);
      });
    });
  }

  function emptyAdd(label) {
    return (
      '<button type="button" class="rd-empty-add rd-field-row__value is-empty">' +
      esc(label || 'Add…') +
      '</button>'
    );
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) {
        return w.charAt(0).toUpperCase();
      })
      .join('') || '?';
  }

  function digitsOnly(phone) {
    return String(phone || '').replace(/\D+/g, '');
  }

  /** Mark empty drawer inputs with pale “Add…” — never a blank box. */
  function decorateEmptyFields(root) {
    if (!root) return;
    root.querySelectorAll('input.rd-field-row__value, textarea.rd-field-row__value').forEach(function (el) {
      if (el.readOnly || el.disabled) return;
      if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'hidden' || el.type === 'date' || el.type === 'number' || el.type === 'time') return;
      var empty = !String(el.value || '').trim();
      el.classList.toggle('is-empty', empty);
      if (empty) {
        if (!el.getAttribute('placeholder') || el.getAttribute('placeholder') === 'Add…') {
          el.setAttribute('placeholder', 'Add…');
        }
      }
    });
    root.querySelectorAll('select.rd-field-row__value').forEach(function (el) {
      if (el.disabled) return;
      var empty = !String(el.value || '').trim();
      el.classList.toggle('is-empty', empty);
    });
    root.querySelectorAll('.rd-field-row__value:not(input):not(textarea):not(select):not(button):not(label)').forEach(function (el) {
      var txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt || txt === '—' || txt === '-') {
        el.classList.add('is-empty');
        if (!el.querySelector('.rd-empty-add') && !el.closest('.rd-field-row__value--readonly')) {
          el.textContent = '';
          el.insertAdjacentHTML('beforeend', emptyAdd('Add…'));
        }
      }
    });
  }

  function relatedBlock(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    var head =
      '<div class="rd-related__head">' +
      esc(opts.title || 'Related') +
      (opts.pageLabel
        ? '<a href="#" data-rd-related-page="' + esc(opts.page || '') + '">' + esc(opts.pageLabel) + '</a>'
        : '') +
      (opts.addLabel
        ? '<button type="button" class="rd-related__add" data-rd-related-add="' +
          esc(opts.addKey || '') +
          '">' +
          esc(opts.addLabel) +
          '</button>'
        : '') +
      '</div>';
    var body;
    if (!rows.length) {
      body = '<div class="rd-empty">' + esc(opts.empty || 'Nothing linked yet.') + '</div>';
    } else {
      body =
        '<table class="rd-table"><tbody>' +
        rows
          .map(function (r) {
            return (
              '<tr><td>' +
              esc(r.left || '') +
              '</td><td class="is-num">' +
              esc(r.right || '') +
              '</td></tr>'
            );
          })
          .join('') +
        '</tbody></table>';
    }
    return '<div class="rd-related" data-rd-related="' + esc(opts.id || '') + '">' + head + body + '</div>';
  }

  function commentsBlock(items) {
    items = items || [];
    var list = items
      .map(function (c) {
        return (
          '<div class="rd-comment' +
          (c.resolved ? ' rd-comment--resolved' : '') +
          '">' +
          '<div class="rd-comment__meta"><span class="rd-comment__author">' +
          esc(c.author || 'Someone') +
          '</span><span>' +
          esc(c.when || '') +
          '</span>' +
          (c.resolved
            ? ''
            : '<button type="button" class="rd-comment__resolve" data-rd-comment-resolve>Resolve</button>') +
          '</div>' +
          '<div class="rd-comment__body">' +
          esc(c.text || '') +
          '</div></div>'
        );
      })
      .join('');
    return (
      '<div class="rd-comments" data-rd-comments>' +
      '<div class="rd-related__head">Comments</div>' +
      (list || '<div class="rd-empty">No comments yet. A comment is a conversation — not a note.</div>') +
      '<div class="rd-comment rd-comment--compose"><textarea class="rd-field-row__value rd-field-row__value--textarea" rows="2" placeholder="Write a comment… Use @name to mention." data-rd-comment-input></textarea></div>' +
      '</div>'
    );
  }

  function activityBlock(entries) {
    entries = entries || [];
    if (!entries.length) {
      return (
        '<div class="rd-activity" data-rd-activity><div class="rd-related__head">Activity</div>' +
        '<div class="rd-empty">No activity yet.</div></div>'
      );
    }
    var html = entries
      .map(function (e) {
        var cls = 'rd-activity__row' + (e.consequence ? ' is-consequence' : '');
        var effect = e.effect ? ' <span class="rd-activity__effect">' + esc(e.effect) + '</span>' : '';
        return (
          '<div class="' +
          cls +
          '">' +
          esc(e.text || '') +
          effect +
          (e.when ? ' · ' + esc(e.when) : '') +
          '</div>'
        );
      })
      .join('');
    return (
      '<div class="rd-activity" data-rd-activity><div class="rd-related__head">Activity</div>' + html + '</div>'
    );
  }

  function provenanceLine(opts) {
    opts = opts || {};
    var created = opts.created || '—';
    var createdBy = opts.createdBy || '—';
    var modified = opts.modified || created;
    var modifiedBy = opts.modifiedBy || createdBy;
    return (
      '<div class="rd-drawer__provenance" data-rd-provenance>Created ' +
      esc(created) +
      ' by ' +
      esc(createdBy) +
      ' · Last modified ' +
      esc(modified) +
      ' by ' +
      esc(modifiedBy) +
      '</div>'
    );
  }

  function quickActionsHtml(draft) {
    draft = draft || {};
    var phone = String(draft.phone || '').trim();
    var email = String(draft.email || '').trim();
    var dig = digitsOnly(phone);
    var call = phone
      ? '<a class="rd-btn" href="tel:' + esc(dig || phone) + '">Call</a>'
      : '<button type="button" class="rd-btn" disabled title="No phone on file">Call</button>';
    var mail = email
      ? '<a class="rd-btn" href="mailto:' + esc(email) + '">Email</a>'
      : '<button type="button" class="rd-btn" disabled title="No email on file">Email</button>';
    var wa = dig
      ? '<a class="rd-btn" href="https://wa.me/' + esc(dig) + '" target="_blank" rel="noopener">WhatsApp</a>'
      : '<button type="button" class="rd-btn" disabled title="No phone on file">WhatsApp</button>';
    return '<div class="rd-drawer__quick" data-drawer-quick>' + call + mail + wa + '</div>';
  }

  /* Auto-run after panel paints when redesign chrome is live. */
  function scheduleDecorate(root) {
    if (!document.body.classList.contains('rd-scope')) return;
    requestAnimationFrame(function () {
      decorateAll(root || document.getElementById('main') || document);
    });
  }

  global.RdDepth = {
    TYPE_GLYPHS: TYPE_GLYPHS,
    glyphFor: glyphFor,
    inferTypeFromLabel: inferTypeFromLabel,
    decorateTableHeaders: decorateTableHeaders,
    decorateTable: decorateTable,
    decorateAll: decorateAll,
    scheduleDecorate: scheduleDecorate,
    ensureSummaryBar: ensureSummaryBar,
    personCell: personCell,
    linkChip: linkChip,
    matrixMark: matrixMark,
    rowActions: rowActions,
    renderStats: renderStats,
    emptyAdd: emptyAdd,
    initials: initials,
    decorateEmptyFields: decorateEmptyFields,
    relatedBlock: relatedBlock,
    commentsBlock: commentsBlock,
    activityBlock: activityBlock,
    provenanceLine: provenanceLine,
    quickActionsHtml: quickActionsHtml
  };
})(typeof window !== 'undefined' ? window : globalThis);
