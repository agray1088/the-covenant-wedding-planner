#!/usr/bin/env python3
"""Generate docs/DEPLOY_WALKTHROUGH.pdf - printable Railway deploy checklist."""

from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parent / "DEPLOY_WALKTHROUGH.pdf"


class PDF(FPDF):
    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(
            0,
            8,
            f"Covenant Planner - Railway deploy walkthrough  |  page {self.page_no()}",
            align="C",
        )


def mono(pdf: PDF, text: str, size: int = 9.5):
    pdf.set_font("Courier", "", size)
    pdf.set_text_color(20, 20, 20)
    pdf.set_fill_color(245, 245, 242)
    pdf.set_x(pdf.l_margin)
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

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(0, 9, "Covenant Planner - Railway deploy walkthrough")
    pdf.ln(1)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(
        0,
        5.5,
        "Printable checklist for deploying the sync API on Railway (managed Postgres + HTTPS). "
        "You paste secrets in Railway / Google / SMTP dashboards - agents cannot log in for you. "
        "Full detail: docs/DEPLOY_WALKTHROUGH.md",
    )
    pdf.ln(1)
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(140, 40, 30)
    pdf.multi_cell(0, 5.5, "Do Step 1 right now: create the Railway project.")
    pdf.ln(2)

    heading(pdf, "0. Prerequisites")
    bullet(pdf, "Railway account (GitHub login recommended)")
    bullet(pdf, "Google Cloud OAuth Web client (for Continue with Google)")
    bullet(pdf, "SMTP: Resend, SendGrid, Mailgun, or Gmail App Password")
    bullet(pdf, "Optional later: Cloudflare R2 or AWS S3 for photos")
    mono(
        pdf,
        "cd C:\\Users\\arian\\the-covenant-wedding-planner\n"
        "git checkout cursor/offline-cloud-sync-017e\n"
        "git pull origin cursor/offline-cloud-sync-017e",
    )

    heading(pdf, "1. Create Railway project (do this now)")
    bullet(pdf, "railway.app -> New Project -> Deploy from GitHub")
    bullet(pdf, "Repo: agray1088/the-covenant-wedding-planner")
    bullet(pdf, "Branch: cursor/offline-cloud-sync-017e (or master after merge)")
    bullet(pdf, "Settings -> Build: Builder = Dockerfile")
    bullet(pdf, "Dockerfile path = Dockerfile  |  Root Directory = / (empty)")
    bullet(pdf, "Click Deploy on pending-changes banner if shown")
    bullet(pdf, "If Railpack 'No start command': set Builder/path above FIRST, then pull + redeploy")

    heading(pdf, "2. Add Postgres")
    bullet(pdf, "Add PostgreSQL service; link it so DATABASE_URL is injected")
    mono(pdf, "DATABASE_SSL=1")

    heading(pdf, "3. Session secret")
    mono(pdf, "openssl rand -hex 32")

    heading(pdf, "4. Core Variables (paste in Railway)")
    mono(
        pdf,
        "NODE_ENV=production\n"
        "PORT=8787\n"
        "HOST=0.0.0.0\n"
        "TRUST_PROXY=1\n"
        "DATABASE_SSL=1\n"
        "SESSION_SECRET=<openssl output>\n"
        "SESSION_DAYS=30\n"
        "SERVE_STATIC=0\n"
        "BOOTSTRAP_EMAIL=\n"
        "BOOTSTRAP_PASSWORD=",
        size=8.5,
    )
    body(pdf, "Omit FEATURE_*=0 from the example (or set to 1) so RSVP/portal features stay on.")

    heading(pdf, "5. PUBLIC_URL + CORS (after Railway gives HTTPS)")
    mono(
        pdf,
        "PUBLIC_URL=https://covenant-api-production.up.railway.app\n"
        "CORS_ORIGIN=http://localhost:8000\n"
        "CLIENT_APP_URL=http://localhost:8000",
        size=8.5,
    )
    body(pdf, "No trailing slash on PUBLIC_URL. Add hosted UI origins to CORS later if needed.")

    heading(pdf, "6. Post-deploy checks")
    mono(
        pdf,
        "curl -s https://YOUR-PUBLIC-URL-HOST/health\n"
        "curl -s https://YOUR-PUBLIC-URL-HOST/setup/status",
        size=8.5,
    )
    body(pdf, 'Expect /health ok + db up. /setup/status shows booleans only (never secrets).')

    heading(pdf, "7. Google OAuth redirect URI")
    mono(pdf, "${PUBLIC_URL}/auth/google/callback")
    body(
        pdf,
        "Example: https://covenant-api-production.up.railway.app/auth/google/callback",
    )
    mono(
        pdf,
        "GOOGLE_CLIENT_ID=<from Google>\n"
        "GOOGLE_CLIENT_SECRET=<from Google>\n"
        "GOOGLE_REDIRECT_URI=",
        size=8.5,
    )
    body(pdf, "Leave GOOGLE_REDIRECT_URI empty to use the default above.")

    heading(pdf, "8. SMTP examples")
    body(pdf, "Resend:")
    mono(
        pdf,
        "SMTP_HOST=smtp.resend.com\n"
        "SMTP_PORT=587\n"
        "SMTP_USER=resend\n"
        "SMTP_PASS=<API key>\n"
        "SMTP_FROM=noreply@your-verified-domain.com\n"
        "SMTP_SECURE=0",
        size=8.5,
    )
    body(pdf, "Gmail App Password:")
    mono(
        pdf,
        "SMTP_HOST=smtp.gmail.com\n"
        "SMTP_PORT=587\n"
        "SMTP_USER=you@gmail.com\n"
        "SMTP_PASS=<app password>\n"
        "SMTP_FROM=you@gmail.com\n"
        "SMTP_SECURE=0",
        size=8.5,
    )

    heading(pdf, "9. Point planner at HTTPS API")
    body(pdf, "Settings -> Cloud sync (beta) -> paste PUBLIC_URL -> Save & enable. Or console:")
    mono(
        pdf,
        "localStorage.setItem('covenant_cloud_api', 'https://YOUR-PUBLIC-URL-HOST');\n"
        "localStorage.setItem('covenant_cloud_enabled', '1');\n"
        "location.reload();",
        size=8.5,
    )

    heading(pdf, "10. Optional R2 photos")
    mono(
        pdf,
        "PHOTO_STORAGE=r2\n"
        "R2_BUCKET=covenant-photos\n"
        "R2_ACCESS_KEY_ID=<key>\n"
        "R2_SECRET_ACCESS_KEY=<secret>\n"
        "R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com\n"
        "R2_PUBLIC_BASE_URL=https://photos.example.com",
        size=8.5,
    )

    self_check_page(pdf, 50)
    pdf.ln(3)
    pdf.set_draw_color(180, 180, 180)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + pdf.epw, pdf.get_y())
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(0, 7, "Troubleshooting (short)")
    pdf.ln(1)
    bullet(pdf, "Railpack 'No start command': Builder=Dockerfile, path=Dockerfile, Deploy banner")
    bullet(pdf, "Healthcheck fail: link Postgres, DATABASE_SSL=1, wait for DATABASE_URL")
    bullet(pdf, "CORS errors: exact planner origin in CORS_ORIGIN")
    bullet(pdf, "redirect_uri_mismatch: Console URI = PUBLIC_URL + /auth/google/callback")
    bullet(pdf, "503 smtp_not_configured: paste SMTP_* and redeploy")
    bullet(pdf, "Client mismatch: covenant_cloud_api must equal PUBLIC_URL")

    self_check_page(pdf, 40)
    pdf.ln(3)
    pdf.set_draw_color(180, 180, 180)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + pdf.epw, pdf.get_y())
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(0, 7, "Local demo (unchanged)")
    pdf.ln(1)
    mono(pdf, "demo@covenant.local\ncovenant-demo\nhttp://localhost:18787")
    body(pdf, "Do not point production secrets at local Docker. See RECONNECT_AFTER_RESTART.md.")

    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(
        0,
        5,
        "Keep this PDF with your deploy notes. Full walkthrough: docs/DEPLOY_WALKTHROUGH.md",
    )

    pdf.output(str(OUT))
    size = OUT.stat().st_size
    print(f"Wrote {OUT} ({size} bytes)")
    if size < 500:
        raise SystemExit("PDF too small - generation likely failed")


if __name__ == "__main__":
    main()
