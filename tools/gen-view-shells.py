#!/usr/bin/env python3
"""Generate missing People/Money view shells from base page shells.

Per Redesign/CURSOR-IMPLEMENTATION-GUIDE.md §7.2–§7.3 and §8:
  {page}-{view}.html · mount ids · panel id · active viewswitch · binding rail note
  Non-table surfaces drop Columns / Auto-fit / Row height chips.
"""
from __future__ import annotations

import re
from pathlib import Path

PAGES = Path("/workspace/Redesign/pages")

# outfile, base, view_slug, view_label, surface_class, rail_note, table_controls, title, viewswitch_labels|None
SPECS = [
    (
        "households-labels.html",
        "households.html",
        "labels",
        "Labels",
        "rd-labelsheet",
        "<b>Skips households with no address</b> rather than printing blank labels.",
        False,
        "Households · Labels",
        ["Table", "Cards", "Labels"],
    ),
    (
        "households-cards.html",
        "households.html",
        "cards",
        "Cards",
        "rd-cardgrid",
        "Cards are the same household records as Table — switching views never reloads the page.",
        False,
        "Households · Cards",
        ["Table", "Cards", "Labels"],
    ),
    (
        "contacts-dayof.html",
        "contacts.html",
        "dayof",
        "Day-of sheet",
        "rd-printsheet",
        "Day-of sheet is a working document — phone and role only, grouped by role.",
        False,
        "Contacts · Day-of sheet",
        ["Table", "Cards", "Day-of sheet"],
    ),
    (
        "contacts-cards.html",
        "contacts.html",
        "cards",
        "Cards",
        "rd-cardgrid",
        "Clicking a card opens the same 360px drawer as Table view.",
        False,
        "Contacts · Cards",
        ["Table", "Cards", "Day-of sheet"],
    ),
    (
        "party-cards.html",
        "party.html",
        "cards",
        "Cards",
        "rd-cardgrid",
        "Every member is also a guest record. Cards share the same data as Table.",
        False,
        "Wedding Party · Cards",
        ["Table", "Cards", "Duties"],
    ),
    (
        "party-duties.html",
        "party.html",
        "duties",
        "Duties",
        "rd-kanban",
        'Duties carries an <b>"Unassigned" column</b> — red, last. Failure is a group, not a filter.',
        False,
        "Wedding Party · Duties",
        ["Table", "Cards", "Duties"],
    ),
    (
        "tables-list.html",
        "tables.html",
        "list",
        "List",
        "rd-grouplist",
        'List must carry a <b>"Not seated" group</b> — accepted guests with no table, red, last.',
        True,
        "Table Layout · List",
        ["Floor plan", "List", "By guest"],
    ),
    (
        "tables-byguest.html",
        "tables.html",
        "byguest",
        "By guest",
        "rd-table-wrap rd-table-wrap--depth",
        "Caterer's export — seat, meal and restriction on one line. Dietary columns are marks, not text. Sticky first column.",
        True,
        "Table Layout · By guest",
        ["Floor plan", "List", "By guest"],
    ),
    (
        "gifts-notes.html",
        "gifts.html",
        "notes",
        "Notes",
        "rd-grouplist",
        "Notes sorts by <b>days owed</b>, not by giver.",
        True,
        "Gifts · Notes",
        ["Table", "Registry", "Notes"],
    ),
    (
        "budget-bycategory.html",
        "budget.html",
        "bycategory",
        "By category",
        "rd-grouplist",
        "Category totals are <b>derived</b> from their lines. Over-target renders red at the group row.",
        True,
        "Budget · By category",
        ["Itemized", "By category", "Pledged &amp; paid"],
    ),
    (
        "budget-pledged.html",
        "budget.html",
        "pledged",
        "Pledged &amp; paid",
        "rd-grouplist",
        'Needs a <b>"Not pledged" group</b> showing the shortfall — money committed with no source. A group, not a footnote.',
        True,
        "Budget · Pledged &amp; paid",
        ["Itemized", "By category", "Pledged &amp; paid"],
    ),
    (
        "payments-calendar.html",
        "payments.html",
        "calendar",
        "Calendar",
        "rd-calendar",
        "Colour encodes <b>status, never size</b>. Dragging proposes a date and flags the contract; it never rewrites a contracted date.",
        False,
        "Payments · Calendar",
        ["Table", "Schedule", "Calendar"],
    ),
    (
        "contracts-documents.html",
        "contracts.html",
        "documents",
        "Documents",
        "rd-cardgrid",
        'A required document that does not exist yet still gets a card, rendered red "Missing". Absence is a state.',
        False,
        "Contracts · Documents",
        ["Table", "Documents", "Schedule"],
    ),
    (
        "contracts-schedule.html",
        "contracts.html",
        "schedule",
        "Schedule",
        "rd-gantt",
        "Instalments are <b>child records</b> — the timeline is drawn, never typed.",
        False,
        "Contracts · Schedule",
        ["Table", "Documents", "Schedule"],
    ),
]


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.replace("&amp;", "&")).strip().lower()


def set_viewswitch(html: str, active_label: str, labels: list[str] | None) -> str:
    def build(active: str, items: list[str]) -> str:
        bits = []
        for lab in items:
            cls = "rd-viewswitch__item"
            if _norm(lab) == _norm(active):
                cls += " is-active"
            bits.append(f'<button type="button" class="{cls}">{lab}</button>')
        return '<div class="rd-viewswitch">' + "".join(bits) + "</div>"

    if labels:
        return re.sub(
            r'<div class="rd-viewswitch">.*?</div>',
            build(active_label, labels),
            html,
            count=1,
            flags=re.S,
        )

    def repl(m: re.Match[str]) -> str:
        block = m.group(0)
        block = re.sub(r"\s*is-active", "", block)

        def item(mi: re.Match[str]) -> str:
            label = mi.group(1)
            cls = "rd-viewswitch__item"
            if _norm(label) == _norm(active_label):
                cls += " is-active"
            return f'<button type="button" class="{cls}">{label}</button>'

        return re.sub(
            r'<button type="button" class="rd-viewswitch__item[^"]*">([^<]+)</button>',
            item,
            block,
        )

    return re.sub(
        r'<div class="rd-viewswitch">.*?</div>',
        repl,
        html,
        count=1,
        flags=re.S,
    )


def drop_table_controls(html: str) -> str:
    """Remove Columns / Auto-fit / Row height chips; keep viewswitch."""
    # Chip buttons that mention those labels (may contain nested SVG)
    html = re.sub(
        r'<button type="button" class="rd-chip"[^>]*>[\s\S]*?(?:Columns\s*·|Auto-fit columns|Row height\s*·)[\s\S]*?</button>\s*',
        '',
        html,
    )
    return html


def replace_surface(html: str, page: str, view: str, surface_class: str) -> str:
    mount = f"{page}-{view}-mount"
    foot = f"{page}-{view}-foot"
    surface = f'''      <div class="rd-surface">
        <!-- View mount per CURSOR-IMPLEMENTATION-GUIDE §8. Fill from the same records as the base view. -->
        <div class="{surface_class}" id="{mount}"></div>
        <span class="rd-table-foot ued-soft" id="{foot}"></span>
      </div>'''
    return re.sub(
        r'      <div class="rd-surface">[\s\S]*?      </div>\n    </main>',
        surface + '\n    </main>',
        html,
        count=1,
    )


def retarget_panel(html: str, page: str, view: str) -> str:
    panel = f"panel-{page}-{view}"
    html = re.sub(
        r'<main class="rd-main" id="panel-[^"]+"([^>]*)>',
        f'<main class="rd-main" id="{panel}" data-panel="{page}" data-view="{view}">',
        html,
        count=1,
    )
    # stats id
    html = re.sub(
        r'(id=")([^"]*-stats)(")',
        rf'\1{page}-{view}-stats\3',
        html,
        count=1,
    )
    return html


def set_rail_note(html: str, note: str) -> str:
    return re.sub(
        r'<p class="rd-rail__note">[\s\S]*?</p>',
        f'<p class="rd-rail__note">{note}</p>',
        html,
        count=1,
    )


def set_title(html: str, title: str) -> str:
    return re.sub(r'<title>[^<]*</title>', f'<title>{title} — Covenant Wedding Planner</title>', html, count=1)


def main() -> None:
    written = []
    for outfile, base, view, label, surface, note, table_controls, title, vlabels in SPECS:
        src = PAGES / base
        if not src.exists():
            raise SystemExit(f"missing base {src}")
        html = src.read_text(encoding="utf-8")
        page = base.replace(".html", "")
        html = set_title(html, title)

        switch_html = (
            '<div class="rd-viewswitch">'
            + "".join(
                f'<button type="button" class="rd-viewswitch__item'
                + (" is-active" if _norm(lab) == _norm(label) else "")
                + f'">{lab}</button>'
                for lab in (vlabels or [])
            )
            + "</div>"
        )
        if '<div class="rd-viewswitch">' in html:
            html = set_viewswitch(html, label, vlabels)
        elif vlabels:
            if '<div class="rd-toolbar__right">' in html:
                html = html.replace(
                    '<div class="rd-toolbar__right">',
                    f'<div class="rd-toolbar__right">{switch_html}',
                    1,
                )
            else:
                html = re.sub(
                    r'(<div class="rd-toolbar">)',
                    rf'\1<div class="rd-toolbar__right">{switch_html}</div>',
                    html,
                    count=1,
                )

        if not table_controls:
            html = drop_table_controls(html)
        html = set_rail_note(html, note)
        html = retarget_panel(html, page, view)
        html = replace_surface(html, page, view, surface)
        out = PAGES / outfile
        out.write_text(html, encoding="utf-8")
        written.append(outfile)
    print("wrote", len(written), "shells:")
    for w in written:
        print(" ", w)


if __name__ == "__main__":
    main()
