# Visual Evidence — Browser Comparison Screenshots

## 📸 Screenshot References

### Mockup: Venue & Vendors (11c) with Stat Strip
**Source:** `localhost:8000/Redesign/Planner Screens Master.dc.html` → Section 11

**What the mockup shows:**
- **Stat Strip Row:**
  - VENDORS: 10
  - BOOKED: 5  
  - BOOKED VALUE: $20,440
  - PAID TO DATE: $11,360
  - NO CONTRACT: 4

- **Day-of Critical View Below:**
  - Filter: "Group by day-of role"
  - Vendors listed with confirmation times
  - Contact info and timing details

**Screenshot location:** `/tmp/computer-use/3675f.webp` (captured during browser pass)

---

### Live: Venue & Vendors Page (Current Implementation)
**Source:** `localhost:8000` → VENDORS → Venue & Vendors

**What the live page shows:**
- ❌ **No stat strip** — Missing entirely
- ✅ Views sidebar with counts (All vendors: 0, Booked: 0, etc.)
- ✅ "Add a record" button for empty state
- ✅ Table structure exists but empty

**Gap:** The prominent stat strip showing aggregate vendor metrics (count, booked, value, paid, unsigned) is not implemented in the live version.

---

### Mockup: Wedding Setup (15a) Form Grid
**Source:** `localhost:8000/Redesign/Planner Screens Master.dc.html` → Section 35

**What the mockup shows:**
- **Stat Strip:** DAYS TO WEDDING: 96 | TASKS COMPLETE: 24 of 59 | VENDORS BOOKED: 5 | GUESTS INVITED: 142 | BUDGET TARGET: $30,000
- **Form Body Grid Layout:**
  - Two-column structure with sections:
    - Left: THE COUPLE (Bride/Groom fields, Shown as, Home church)
    - Right: THE DAY (Wedding date, Ceremony, Reception, Time zone)
  - Below: MONEY (Total budget, Target guest count)
  - Below: GUESTS & SEATING (layout TBD in mockup)

---

### Live: Wedding Setup Page (Current Implementation)
**Source:** `localhost:8000` → Wedding Setup (sidebar or Quick Jump)

**What the live page shows:**
- ✅ Stat strip present and matches mockup
- ❌ Form body uses old layout:
  - Section: THE COUPLE (full width)
  - Section: DATE & BUDGET (full width)
  - Section: VENUE, CEREMONY & STYLE (full width)
- ❌ Fields not arranged in mockup's two-column grid pattern

**Gap:** Form sections are stacked vertically instead of using the redesigned grid layout where THE COUPLE and THE DAY are side-by-side columns.

---

### Mockup: Get Started (15b) Guide Structure
**Source:** Master mockup Section 36

**What the mockup shows:**
- Header: "Welcome - Start Here"
- Structured guide sections with:
  - Step numbers
  - Icons
  - Card-based layout
  - Clear visual hierarchy

---

### Live: Get Started Page (Current Implementation)
**Source:** `localhost:8000` → Get Started (footer link or Quick Jump)

**What the live page shows:**
- ✅ Page exists with "Welcome - Start Here" header
- ✅ Content text present
- ❌ Generic article/prose layout
- ❌ No step cards or iconography
- ❌ Different visual hierarchy

**Gap:** Content is present but formatting doesn't match the structured guide design with cards and visual elements.

---

## 🔍 How to Verify

### Setup:
```bash
npm run serve
```

### Open two browser windows side-by-side:
1. **Live:** `http://localhost:8000`
2. **Mockup:** `http://localhost:8000/Redesign/Planner Screens Master.dc.html`

### Navigation:
**Wedding Setup (15a):**
- Live: Sidebar → Wedding Setup OR Quick Jump → Wedding Setup
- Mockup: Scroll to section 35 → Click "Wedding Setup"

**Venue & Vendors (11c):**
- Live: Top menu VENDORS → Venue & Vendors
- Mockup: Scroll to section 11 → Click "Venue & Vendors"

**Get Started (15b):**
- Live: Footer → Get Started OR Quick Jump → Get Started
- Mockup: Scroll to section 36 → Click "Get Started, Guide & FAQ"

---

## 📊 Visual Comparison Checklist

| Element | Mockup | Live | Match? |
|---------|--------|------|--------|
| **Wedding Setup Stat Strip** | ✅ Present | ✅ Present | ✅ YES |
| **Wedding Setup Form Grid** | ✅ Two-column | ❌ Stacked | ❌ NO |
| **Vendor Stat Strip** | ✅ Present | ❌ Missing | ❌ NO |
| **Vendor Table** | ✅ Present | ✅ Present | ✅ YES |
| **Get Started Header** | ✅ Present | ✅ Present | ✅ YES |
| **Get Started Body Cards** | ✅ Structured | ❌ Generic | ❌ NO |
| **Top Bar** | ✅ All elements | ✅ All elements | ✅ YES |
| **Profile Drawer** | ✅ Categories | ⚠️ Similar | ⚠️ CLOSE |

---

## 📷 Screenshot Archive

All browser screenshots captured during verification pass are saved to:
`/tmp/computer-use/*.webp`

Key screenshots:
- `3675f.webp` — Venue & Vendors mockup with stat strip and day-of view
- `b21b0.webp` — Wedding Setup mockup showing form grid layout
- `d9c1b.webp` — Live Venue & Vendors page (no stat strip)
- `b7102.webp` — Live Wedding Setup page (stat strip + legacy form)

---

## ✅ Evidence Quality

**High Confidence (Directly Viewed):**
- Wedding Setup stat strip: ✅ Matches
- Wedding Setup form body: ❌ Doesn't match grid
- Vendor stat strip: ❌ Missing
- Vendor table: ✅ Present
- Top bar: ✅ Matches

**Medium Confidence (Viewed but Not Exhaustive):**
- Get Started page body
- Profile drawer categories

**Low Confidence (Not Fully Tested):**
- FAQ, Page-by-Page Guide pages
- Essentials views (require data)
- Theme builder, Settings modals
- Dark mode variants
