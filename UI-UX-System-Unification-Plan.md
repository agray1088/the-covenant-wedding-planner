# Covenant Wedding Planner — UI/UX System Unification Plan

**Goal:** Make the entire planner render from one shared UI/UX system so every page and sub‑page looks and behaves consistently, is controlled from a single set of tokens and components, and measurably follows the established design principles.

**Status of this document:** Working plan. Nothing here is executed yet. Phases are ordered so that foundation work (Phase 1) unblocks component work (Phase 2), which unblocks page remediation (Phase 3).

---

## 0. Current‑state assessment (why we need this)

The app grew several overlapping styling systems that all render similar‑looking UI in different ways:

- **`ued-*`** — the "editorial v4" component set (`.ued-page`, `.ued-panel`, `.ued-mast`, `.ued-table-card`, `.ued-table-head`, `.ued-band`, `.ued-stat`, `.ued-btn`, `.ued-link`, `.ued-progress`, `.ued-caption`).
- **`m-*`** — the masthead system (`.m-mast-wrap`, `.m-mast`, `.m-title`, `.m-wayfind`, `.m-meta`, `.m-block`, `.m-thinrule`) injected by `injectMasthead()`.
- **`cwp`** — the table engine (`.cwp-section`, `.cwp-section-head`, `.cwp-toolbar`, `.cwp-btn`, `.cwp-table`, `.ro-preview`) used for Data Hub tables and read‑only previews.
- **`planner-table-*`** — a second table/filter control system.
- **`editorial-v4` override layer** — many high‑specificity `body.editorial-v4 #main .panel …` rules and `[class*="-card"]` resets in `planner.css`, `planner-spacing-premium.css`, `planner-page-gutters.css`, `planner-dark-editorial.css` that patch the above.

**Consequences observed during Dashboard work:**
- The same value (gutter, radius, hairline color) is defined in multiple places, so changing one page didn't change others.
- Broad `[class*="-card"]` rules paint or strip backgrounds/borders unpredictably (we hit this on the hub record cards and stat cards).
- High‑specificity `!important` overrides fight each other, so fixes required escalating specificity or `box-shadow`‑as‑border workarounds.
- Elements outside the content container (masthead, scripture band, banner editor) drift out of alignment with the cards.

**Design target:** one token layer → one canonical component per pattern → every page composed from those components → each page audited against a checklist.

---

## Phase 1 — Foundation: tokens + principles as the single source of truth

**Objective:** Every visual decision references a token. No page hardcodes a color, radius, spacing value, or gutter.

### 1.1 Token inventory & consolidation

Create/confirm a single canonical token file (`css/planner-tokens.css`) as the only place these are defined. Audit the codebase for hardcoded values and replace them with `var(--token)`.

| Token group | Tokens | Notes / current state |
|---|---|---|
| **Gutter** | `--planner-page-gutter` | ✅ Done — one clamp, applied via `#main` padding; all pages inherit. Keep this as the model. |
| **Spacing scale** | `--space-1…8`, `--planner-section-gap`, `--planner-form-gap`, `--planner-panel-padding` | Consolidate; audit for stray rem/px in component CSS. |
| **Corner radius** | `--radius-sm`, `--radius-md`, `--radius-card` | Pick 2–3 values (we favor *less rounded*: ~4px controls, ~8px cards). Replace literal `border-radius:` values. |
| **Hairline / border** | `--border`, `--border-strong`, `--card-border` | One hairline color light + one dark. Retire `#e6ddc9`/`#d9cdb8`/`#e0d6c2` literals scattered in CSS. |
| **Surfaces** | `--surface-canvas`, `--surface-content`, `--card-bg`, `--section-bg` | Note: `--card-bg` currently resolves to `transparent` — decide intended card surface once, globally. |
| **Palette** | `--forest`, `--gold`, `--theme-primary`, `--theme-accent`, status whispers | Keep theme‑driven; ensure every accent uses `var(--theme-primary)` not a literal burgundy/forest. |
| **Dark palette** | `--dm-*` (neutral charcoal set) | ✅ Established as theme‑independent. Ensure new components map into it. |
| **Type** | `--font-serif`, `--font-sans`, `--font-voice`, type‑scale sizes | Editorial serif for headings, sans for UI/labels; define sizes as tokens. |
| **Elevation** | shadow tokens (light = subtle, dark = none) | Prefer hairline borders over shadows per the established look. |

**Deliverables for 1.1**
- A "token map" section appended to the **UI/UX System** dev page listing every token and its value.
- A grep‑based audit list of hardcoded colors/radii/spacings to replace (search for hex colors, `border-radius:`, `padding:` with literals, `box-shadow:`).

### 1.2 Principles reference (the acceptance criteria)

Encode the principles we established as an explicit checklist (already partly on the UI/UX System page). These are the pass/fail criteria used in Phase 3.

**Laws of UX applied**
- Hierarchy & Emphasis — one clear primary action per view; most‑important info first and largest.
- Aesthetic–Usability — editorial type, hairline rules, generous white space, squared‑ish corners.
- Hick's & Miller's — group choices; ≤ ~7 items per group; overflow menus for the rest.
- Fitts's — ≥ 44px tap targets; primary CTA reachable; thumb zone on mobile.
- Jakob's — familiar conventions (regular calendar grid, breadcrumb wayfinding, standard forms).
- Proximity / Common Region — related data grouped in one container/card.
- Zeigarnik / Goal‑Gradient — surface unfinished work; show progress.

**Graphic‑design principles applied**
- Alignment — everything on one shared left/gutter axis (no mixed center/left).
- Contrast — emphasis via size/weight, accessible color contrast.
- Balance — asymmetric balance with a right‑side counterweight where a hero is left‑aligned.
- Color — theme palette + theme‑independent dark mode.
- White space — consistent gutter and section spacing.
- Proportion — dominant element carries the most visual weight.
- Repetition / Unity — same components, tokens, fonts everywhere.
- Rhythm / Movement — consistent grid spacing; top‑to‑bottom reading order.
- Emphasis / Proximity / Unity — one focal point, grouped related items, cohesive whole.

**Deliverable for 1.2:** a canonical "Principles Checklist" block (reused verbatim in Phase 3 audits).

---

## Dark Mode — the parallel color skin (not a separate UX)

**Key framing:** the planner has **one UX system with two color skins.** Dark mode does **not** change layout, components, interactions, information hierarchy, or any principle — a page in dark mode is structurally identical to light. What changes is only the **color/surface layer**. Treat dark mode as a first‑class, parallel visual system that every component must satisfy — not an afterthought.

### D.1 Principles specific to dark mode

- **Theme‑independent.** Dark mode overrides *every* light theme (Burgundy, Forest & Gold, etc.). When dark is on, accents resolve to the neutral‑charcoal set, not the active theme's hue. This is intentional and must be preserved — no theme color should bleed into dark.
- **Neutral‑charcoal palette.** Surfaces `#0e0e0e / #151515 / #161616 / #191919 / #1a1a1a / #1e1e1e / #262626 / #2d2d2d`; borders `#2a2a2a / #333 / #3a3a3a / #4a4a4a`; text `#ededed / #d2d2d2 / #c9c4bb / #9a9a9a / #6a6a6a`; monochrome accents (charcoal fills, near‑white text, light‑grey links, `rgba(255,255,255,.25)` focus rings). Status colors are heavily desaturated "whispers," not vivid.
- **Prefer hairline borders over shadows.** In dark, drop `box-shadow` and use `#333` hairlines (matches the light‑mode hairline approach).
- **Parity is mandatory.** No component ships until it is verified in dark as well as light.

### D.2 Mechanism (how it works today)

- The neutral‑charcoal palette lives in `--dm-*` tokens in `css/planner-dark-editorial.css` (loaded **after** `planner.css` so it wins).
- A remap block re‑points theme tokens (`--theme-primary`, `--forest`, chart colors, etc.) to the `--dm-*` set when `body.dark-mode` is on, and clears the inline `!important` theme vars so the dark stylesheet controls.
- Applied via `applyDarkMode(on)`; `body.dark-mode` (and/or `[data-theme="dark"]`) is the switch.
- Components that use theme tokens (`var(--theme-primary)`, `var(--forest)`, `var(--muted)`, `var(--border)`) adapt automatically. Components that **hardcode** a color (e.g., a literal `#d9cdb8` hairline or `#faf7f1` surface) must add an explicit `body.dark-mode …` override — this is a recurring source of dark‑mode bugs and a key audit item.

### D.3 Dark‑mode audit checklist (run alongside the Phase 3 checklist)

For every page/component in dark mode:
1. No theme hue bleeds through (verify the accent is charcoal/neutral, not burgundy/forest).
2. All surfaces map to a `--dm-*` value; no stray white/cream fills.
3. Every hairline/border is visible on charcoal (`#333`‑class), not an invisible light tan.
4. Text contrast is adequate (`#ededed`/`#d2d2d2` on charcoal; muted `#9a9a9a` still legible).
5. No drop shadows; hairlines only.
6. Focus/hover states visible (`rgba(255,255,255,.25)` rings, subtle hover).
7. Footer, masthead, scripture band, overlays, and print‑preview skins all covered (easy to miss).
8. Any component with a hardcoded light color has a matching `body.dark-mode` override.

### D.4 Deliverable

A dedicated **Dark Mode** section on the UI/UX System dev page: the `--dm-*` palette swatches, the theme‑independence rule, the remap mechanism, and the parity checklist — shown side‑by‑side with the light equivalents.

---

## Phase 2 — Canonicalize the shared components

**Objective:** For each recurring UI pattern, define ONE canonical component, style it once from tokens, and make every page use it. Retire duplicate/override CSS rather than adding more.

### 2.1 Component catalog (canonical vs. deprecated)

| Pattern | Canonical | Deprecate / migrate away from |
|---|---|---|
| Page header | `injectMasthead()` → `.m-mast-wrap` (breadcrumb + title + meta + actions + hairline) | Inline `.ued-mast`, `.smart-page-title-wrap`, page‑specific `*-title-wrap`, per‑page `<h2>` titles |
| Page scripture | `.page-scripture-footer` (token gutter, hairline) | Static per‑page scripture cards, duplicate hero scriptures |
| Card / panel | `.ued-panel` (transparent bg, hairline border, token radius, no shadow) | `[class*="-card"]` ad‑hoc styles, `.m-block`, `.card`, `.inst-card` variants |
| Stat band | `.ued-band` + `.ued-stat` (centered, hairline card) | Page‑specific stat strips |
| Record cards | `.hub-record-card` grid | Any bespoke record card markup |
| Data table | `cwp` engine (`.cwp-section` + `.cwp-toolbar` + `.cwp-table`) | `planner-table-*` control card, hand‑built preview tables where a cwp mount exists |
| Read‑only preview header | Merged into `.cwp-toolbar` (badge + Export + Edit next to Search/Clear/Auto‑fit) via `cwpMergeReadOnlyHeaders()` | Separate `.ued-table-head` title rows (now hidden) |
| Buttons | `.ued-btn` (primary/secondary) + `.cwp-btn` (toolbar) | `.btn`, `.btn-forest`, `.btn-gold`, `.btn-outline` legacy classes |
| Links / chips | `.ued-link`, status `.ro-badge-inline` | Mixed link/badge styles |
| Progress | `.ued-progress` / `.ued-progress-row` | Ad‑hoc bars/rings |
| Overlays / editors | Record‑editor modal + inline editor shell | One‑off modal markup |

### 2.2 Component styling rules (write once, from tokens)

For each canonical component, define exactly one styling block that:
- Uses only tokens (Phase 1).
- Sets background, border (hairline), radius, padding, type from tokens.
- Includes light + dark parity (map to `--dm-*`).
- Has a documented specificity (avoid the `!important` arms race; prefer a single authoritative rule).

### 2.3 Retire the override layer

Systematically remove or neutralize the broad `[class*="-card"]` and duplicate `body.editorial-v4 #main .panel …` rules once the canonical component owns the styling. This is the highest‑risk step — do it component‑by‑component with verification, not all at once.

**Deliverables for Phase 2**
- Canonical component list published on the UI/UX System dev page (with a live example of each).
- One authoritative CSS block per component.
- A removal log of deprecated rules retired.

---

### 2.4 Target canonical systems — the end‑state, and what each absorbs

Every recurring pattern routes through exactly one of these. The bespoke/duplicate namespaces on the right are retired into the canonical system on the left.

1. **Page scaffold + masthead** — injected masthead + `.ued-page` in the shared gutter is the only page structure. *Absorbs/retires:* `smart-page-title-wrap`, `inst-title-wrap`, the Ceremony & Honeymoon heroes, and any page rendering its own title on top of the masthead. → one header, one title, one axis.
2. **Card** — the hairline `.ued-panel` treatment is the only card. *Absorbs:* `smart-side-card`, `hm-card`, `inst-card`, mood cards, `phase-record-cards.css`, `phase-guest-insight-cards.css`, and the broad `[class*="-card"]` override layer.
3. **Stat / metric band** — `.ued-band` / `.ued-stat` (centered, hairline). *Absorbs:* `smart-stat-card` and page‑specific stat strips.
4. **Buttons** — one primary / secondary / toolbar set. *Absorbs/retires:* legacy `btn-*` (btn-forest/gold/outline); reconciles `ued-btn` + `cwp-btn` into one system.
5. **Table engine + toolbar** — CWP is the canonical table; retire the `planner-table-*` control system and any hand‑built preview tables. One Search / Filter / Clear / Auto‑fit toolbar everywhere (read‑only header already merged in via `cwpMergeReadOnlyHeaders`).
6. **Form** — one field / label / select / textarea component. *Absorbs:* Wedding Setup form, `hm-*` forms, and other page‑local form markup.
7. **Tabs** — one tab component. *Absorbs:* `cer-tabbar`, Logistics sub‑tabs, Smart Calendar view tabs, Vendors Tracker/Shortlist tabs, Data Hub category tabs.
8. **Status + badges** — one status treatment (theme + dark mapped). *Absorbs:* `.status-pill--*` and assorted badges/chips (`.ro-badge-inline`).
9. **Progress** — `.ued-progress`. *Absorbs:* bespoke bars/rings and `ux-goal-bar`.
10. **Overlays / modals / record editor** — the shared record‑editor shell owns all editing; the coach, filters, legal/help, and any one‑off modals adopt the same shell.
11. **Icons** — one icon system. *Absorbs:* `uedIcon`, inline SVGs, and Material Symbols.
12. **Cross‑cutting behaviors** — dark‑mode parity (every component maps to `--dm-*`), one set of responsive breakpoints/reflow rules, and shared empty / loading / error states.

**Legitimately custom (keep the core, wrap in shared chrome):** the Smart Calendar grid, the Table Layout / seating tool, the Vendor Comparison matrix, and the Vision Board palette/photo tools. Their unique interaction core stays; their header, toolbar, cards, buttons, stats, badges, and empty states use the systems above — "custom body, shared frame." The print/keepsake `cvp-*` templates stay a separate system on purpose (print rules differ), kept token‑consistent only.

### 2.5 Duplicate headers — investigated, largely a non‑issue (keep the guard)

The concern was that pages inject the masthead **and** render their own title/hero on top of it. **Verified live** on **Smart Calendar**, **Honeymoon**, and **Ceremony & Reception**: the masthead is the single visible page title on all three; the page‑local title wraps (`smart-page-title-wrap`, the honeymoon/ceremony heroes) are already suppressed by the masthead system, and the only other headings are legitimate *section* headers (H3). So there is **no visible duplicate header** to remove.

**Residual cleanup (low priority):** the static page‑local title markup may still exist in `index.html` as dead (hidden) code — remove it during Phase 3 cleanup for tidiness, but it is not a visible defect. **Keep the guard** in the Phase 3 masthead checklist ("no page‑local title/hero duplicating the masthead") so any *new* page doesn't reintroduce it. Lesson: this item was inferred from class names in code and turned out not to render — a reminder that consolidation steps must be confirmed against the live UI, not just the source.

---

## Phase 3 — Page‑by‑page audit & remediation

**Objective:** Bring every page and sub‑view into compliance with the Phase 1 principles using Phase 2 components. Audit first (produce a punch list), then remediate in batches with live verification.

### 3.1 Full inventory to audit

**Top‑level pages (category → page)**
- Start Here: Get Started, Page‑by‑Page Guide, FAQ
- Start Planning: UI/UX System (dev), Wedding Setup
- Planning: Dashboard ✅, Smart Calendar, Planning Timeline / Tasks, Notes, Appointments
- Finances: Budget, Payments, Contracts, Gifts
- Venue & Vendors: Wedding Venue, Vendors (+ Shortlist & Compare sub‑tab)
- People: Guest List, Wedding Party, Table Layout
- Ceremony & Reception: Ceremony & Reception, Entertainment, Catering & Menu, Photography Shot List
- Design & Details: Vision Board / Mood, Design details
- After the Day: Honeymoon / After, Thank‑you tracking
- Marriage Rhythms: Prayer Journal, Premarital Counseling, Scriptures
- Weekend Logistics (sub‑tabs): Weekend Timeline, Travel & Hotels, Transportation, Family/VIP Care, Bachelor/ette, Maps & Directions, Contacts

**Sub‑views / cross‑cutting**
- Database Hub (every category tab: People, Finances, Vendors, Planning, Faith, Design, Honeymoon, Logistics + Budget hub)
- Read‑only preview cards on each page (headers now merged into toolbar)
- Share Packets, Email Templates, Print templates (`cvp*` skins)
- Overlays: record editor modal, coach/onboarding, banner scripture editor, filters/popovers
- Global chrome: top bar, context sidebar, footer, masthead
- States: light + dark; desktop / tablet (~860px) / mobile (~640px); empty vs. populated data

### 3.2 Per‑page audit checklist (score each page)

For each page, record pass/fail + notes on:
1. **Masthead** — uses `injectMasthead`, single title, no duplicate category label, actions consolidated, **and no page‑local title/hero rendered on top of the masthead** (see 2.5).
2. **Gutter/alignment** — content, masthead, scripture, and any out‑of‑container elements share the token gutter and one left axis.
3. **Cards** — use `.ued-panel` treatment (hairline, token radius, no shadow, correct surface); no stray `[class*="-card"]` artifacts.
4. **Hierarchy/emphasis** — one primary action; most important element dominant; no competing action clusters or duplicated info (dates, titles, scriptures).
5. **Tables** — cwp engine where applicable; toolbar consolidated; icons/columns per the agreed rules; read‑only header merged.
6. **Typography** — serif headings, sans UI labels, token sizes.
7. **Color + dark mode** — theme tokens only; verified in neutral‑charcoal dark.
8. **White space / rhythm** — consistent section spacing; not cluttered.
9. **Responsive** — reflows at tablet/mobile; tap targets ≥44px.
10. **Empty/edge states** — sensible empty states; long content truncates/wraps.

### 3.3 Remediation workflow (per page)

1. Load the page (light) → screenshot → run the checklist → log deviations.
2. Toggle dark → verify parity.
3. Resize to tablet/mobile → verify reflow.
4. Fix by swapping to canonical components / tokens (Phase 2), not new one‑off CSS.
5. Re‑verify light + dark + responsive.
6. Mark the page "compliant" in the tracker.

### 3.4 Suggested batch sequencing

1. **Shared chrome first** (highest leverage): masthead, scripture, footer, context sidebar, buttons, cards, tables. Fixing these fixes fragments of every page at once.
2. **High‑traffic pages:** Dashboard ✅ → Budget → Guest List → Vendors → Tasks → Smart Calendar → Payments.
3. **Faith / reflective pages:** Prayer, Counseling, Scriptures (read‑only header pattern already unified).
4. **Detail pages:** Ceremony, Catering, Entertainment, Shot List, Vision Board, Honeymoon, Logistics sub‑tabs.
5. **Data Hub tabs** (each category) and **overlays/print templates** last.

---

## Verification protocol (applies to every change)

- **Light + dark** every time (dark is theme‑independent neutral charcoal).
- **Responsive** at desktop, ~860px (tablet), ~640px (mobile).
- **Cache:** `planner.js` and CSS cache on normal reloads; hard‑refresh (Ctrl+Shift+R) or a temporary `?v=` on the script for JS verification, removed afterward.
- **Preview stability:** the live preview has been intermittently freezing; when it does, verify via computed styles (getComputedStyle) and re‑screenshot after it recovers.
- **Regression guard:** after retiring override CSS, spot‑check 2–3 previously‑fine pages to catch cascade regressions.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Retiring broad `[class*="-card"]`/override rules breaks pages that silently relied on them | Do it component‑by‑component; regression‑check after each; keep a removal log to revert quickly. |
| Token changes cascade unexpectedly (nested elements double‑applying a token) | Prefer one authoritative element per property (e.g., gutter on `#main` only); audit nested usages before changing a token. |
| Specificity/`!important` conflicts | Consolidate to one authoritative rule per component; remove competing overrides instead of stacking more. |
| Preview instability slows verification | Batch work; verify by computed style when rendering is down; hard‑refresh between JS changes. |
| Scope creep across ~30 pages + sub‑views | Audit‑first punch list with a tracker; fix in the batch order above; "definition of done" per page. |

---

## Definition of done

- Every visual value comes from a token; no page‑local hardcoded colors/radii/spacing remain.
- Each recurring pattern is rendered by exactly one canonical component, styled once, with light+dark parity.
- Deprecated/override CSS for those patterns is removed.
- Every page and sub‑view has passed the Phase 3 checklist in light, dark, and at desktop/tablet/mobile.
- The UI/UX System dev page documents the tokens, the canonical components (with live examples), and the principles checklist — serving as the living source of truth.

---

## Recommended first step

Run the **Phase 3.1–3.2 audit** across all pages to produce the punch list (grouped by principle and by page), *before* editing. That converts this plan into a concrete, prioritized task list and surfaces which shared‑component fixes (Phase 2) will have the most leverage.
