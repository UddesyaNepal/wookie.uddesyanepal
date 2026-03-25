"""
Portfolio Backend — Flask + SQLite
Pipeline: app.py → db init → routes → serve
"""

from flask import Flask, request, jsonify, render_template
import sqlite3
import os
import re
from datetime import datetime

app = Flask(__name__, template_folder="templates", static_folder="static")

DB_PATH = os.path.join(os.path.dirname(__file__), "instance", "portfolio.db")

# ─── DB PIPELINE ─────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS messages (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                name      TEXT    NOT NULL,
                email     TEXT    NOT NULL,
                subject   TEXT    NOT NULL,
                body      TEXT    NOT NULL,
                sent_at   TEXT    NOT NULL,
                is_read   INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS visits (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                page       TEXT NOT NULL,
                visited_at TEXT NOT NULL
            );
        """)
    print("✅  Database initialised →", DB_PATH)

# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    with get_db() as conn:
        conn.execute(
            "INSERT INTO visits (page, visited_at) VALUES (?, ?)",
            ("/", datetime.utcnow().isoformat())
        )
    return render_template("index.html")

@app.route("/api/contact", methods=["POST"])
def contact():
    data = request.get_json(silent=True) or {}

    name    = (data.get("name", "") or "").strip()
    email   = (data.get("email", "") or "").strip()
    subject = (data.get("subject", "") or "").strip()
    body    = (data.get("body", "") or "").strip()

    errors = {}
    if not name or len(name) < 2:
        errors["name"] = "Name must be at least 2 characters."
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        errors["email"] = "Please enter a valid email address."
    if not subject or len(subject) < 3:
        errors["subject"] = "Subject must be at least 3 characters."
    if not body or len(body) < 10:
        errors["body"] = "Message must be at least 10 characters."

    if errors:
        return jsonify({"ok": False, "errors": errors}), 422

    with get_db() as conn:
        conn.execute(
            "INSERT INTO messages (name, email, subject, body, sent_at) VALUES (?,?,?,?,?)",
            (name, email, subject, body, datetime.utcnow().isoformat())
        )

    return jsonify({"ok": True, "message": "Message received! I'll get back to you soon ✦"}), 201

@app.route("/api/messages", methods=["GET"])
def get_messages():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, name, email, subject, body, sent_at FROM messages ORDER BY sent_at DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/stats", methods=["GET"])
def stats():
    with get_db() as conn:
        msg_count   = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
        visit_count = conn.execute("SELECT COUNT(*) FROM visits").fetchone()[0]
    return jsonify({"messages": msg_count, "visits": visit_count})

# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

init_db()

if __name__ == "__main__":
    print("🚀  Portfolio server → http://localhost:5000")
    app.run(debug=True, port=5000)