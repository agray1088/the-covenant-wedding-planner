#!/usr/bin/env python3
"""Generate docs/RECONNECT_AFTER_RESTART.pdf — printable reconnect checklist."""

from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parent / "RECONNECT_AFTER_RESTART.pdf"


class PDF(FPDF):
    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, f"Covenant Planner - reconnect after restart  |  page {self.page_no()}", align="C")


def mono(pdf: PDF, text: str, size: int = 9.5):
    pdf.set_font("Courier", "", size)
    pdf.set_text_color(20, 20, 20)
    pdf.set_fill_color(245, 245, 242)
    pdf.set_x(pdf.l_margin)
    # Multi-line code block with light background
    line_h = size * 0.55
    lines = text.strip("\n").split("\n")
    block_h = line_h * len(lines) + 4
    x = pdf.l_margin
    y = pdf.get_y()
    w = pdf.epw
    pdf.rect(x, y, w, block_h, style="F")
    pdf.set_xy(x + 2, y + 2)
    for line in lines:
        pdf.cell(w - 4, line_h, line, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(x + 2)
    pdf.set_y(y + block_h + 2)


def heading(pdf: PDF, text: str):
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 12)
    self_check_page(pdf, 18)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(0, 7, text)
    pdf.ln(1)


def body(pdf: PDF, text: str):
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(40, 40, 40)
    self_check_page(pdf, 14)
    pdf.multi_cell(0, 5.5, text)
    pdf.ln(1)


def bullet(pdf: PDF, text: str):
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(40, 40, 40)
    self_check_page(pdf, 14)
    pdf.set_x(pdf.l_margin + 4)
    pdf.multi_cell(pdf.epw - 4, 5.5, f"-  {text}")
    pdf.ln(0.5)


def self_check_page(pdf: PDF, need: float):
    if pdf.get_y() + need > pdf.h - pdf.b_margin:
        pdf.add_page()


def main():
    pdf = PDF(orientation="P", unit="mm", format="Letter")
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(16, 14, 16)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(0, 9, "Covenant Planner - Reconnect after restart")
    pdf.ln(1)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(
        0,
        5.5,
        "Printable checklist for Windows after a laptop restart "
        "(Docker + planner + cloud sync + pgAdmin).",
    )
    pdf.ln(1)
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(140, 40, 30)
    pdf.multi_cell(0, 5.5, "Host sync API port is 18787 (not 8787).")
    pdf.ln(2)

    # Steps
    heading(pdf, "1. Start Docker Desktop")
    body(pdf, "Start Docker Desktop and wait until it shows Running.")

    heading(pdf, "2. Open PowerShell in the repo")
    mono(
        pdf,
        "cd C:\\Users\\arian\\the-covenant-wedding-planner\n"
        "git checkout cursor/offline-cloud-sync-017e\n"
        "git pull origin cursor/offline-cloud-sync-017e",
    )

    heading(pdf, "3. Start the stack")
    mono(pdf, "docker compose down\ndocker compose up -d")

    heading(pdf, "4. Confirm sync-api is up")
    mono(pdf, "docker compose ps")
    body(pdf, "Host API port is 18787 (not 8787). Confirm the sync/api service is up.")

    heading(pdf, "5. Start planner on :8000 (if needed)")
    mono(pdf, "npx --yes serve -l 8000")
    body(pdf, "Open: http://localhost:8000/")

    heading(pdf, "6. Browser console - enable cloud sync")
    body(pdf, "Open DevTools > Console, paste:")
    mono(
        pdf,
        "localStorage.setItem('covenant_cloud_api', 'http://localhost:18787');\n"
        "localStorage.setItem('covenant_cloud_enabled', '1');\n"
        "location.reload();",
        size=8.5,
    )

    heading(pdf, "7. Settings > Cloud sync (beta)")
    body(pdf, "In the planner UI, open Settings > Cloud sync (beta) and confirm it is connected.")

    heading(pdf, "8. Demo login")
    mono(pdf, "demo@covenant.local\ncovenant-demo")

    heading(pdf, "9. pgAdmin (browser)")
    body(pdf, "URL: http://localhost:5050/browser/")
    mono(pdf, "admin@covenant.dev\ncovenant")

    heading(pdf, "10. Desktop pgAdmin (database connection)")
    mono(
        pdf,
        "Host:     127.0.0.1\n"
        "Port:     15432\n"
        "Database: covenant\n"
        "Username: covenant\n"
        "Password: covenant\n"
        "SSL mode: Disable",
    )

    # Troubleshooting — prefer keep with content; new page if needed
    self_check_page(pdf, 70)
    pdf.ln(3)
    pdf.set_draw_color(180, 180, 180)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + pdf.epw, pdf.get_y())
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(0, 7, "Troubleshooting: port 8787 forbidden")
    pdf.ln(1)
    body(
        pdf,
        "If an error mentions 8787 bind / access permissions:",
    )
    bullet(
        pdf,
        'Confirm docker-compose.yml has "18787:8787":',
    )
    mono(pdf, "findstr 18787 docker-compose.yml")
    body(pdf, 'Expect something like: "18787:8787"')
    bullet(pdf, "Pull the latest branch again:")
    mono(pdf, "git pull origin cursor/offline-cloud-sync-017e")
    bullet(
        pdf,
        "Do not use an old Docker Desktop Compose profile still mapping host 8787.",
    )
    bullet(pdf, "Update localStorage if it still points at 8787:")
    mono(
        pdf,
        "localStorage.setItem('covenant_cloud_api', 'http://localhost:18787');\n"
        "location.reload();",
        size=8.5,
    )

    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(
        0,
        5,
        "Keep this PDF with your laptop notes. Demo credentials are intentional for local reconnect.",
    )

    pdf.output(str(OUT))
    size = OUT.stat().st_size
    print(f"Wrote {OUT} ({size} bytes)")
    if size < 500:
        raise SystemExit("PDF too small — generation likely failed")


if __name__ == "__main__":
    main()
