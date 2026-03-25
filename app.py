from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient # 1. Import MongoClient
import os
import re
from datetime import datetime
from dotenv import load_dotenv # 2. Import dotenv for security

load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")

# ─── MONGODB CONFIGURATION ───────────────────────────────────────────────────

# Use your Atlas Connection String here or in a .env file
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://<username>:<password>@cluster.mongodb.net/")
client = MongoClient(MONGO_URI)
db = client.get_database('portfolio_db') # Your DB name

# Collections (Replace SQLite Tables)
messages_col = db.messages
visits_col = db.visits

# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    # Insert visit log
    visits_col.insert_one({
        "page": "/",
        "visited_at": datetime.utcnow().isoformat()
    })
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

    # Insert into MongoDB
    messages_col.insert_one({
        "name": name,
        "email": email,
        "subject": subject,
        "body": body,
        "sent_at": datetime.utcnow().isoformat(),
        "is_read": 0
    })

    return jsonify({"ok": True, "message": "Message received! I'll get back to you soon ✦"}), 201

@app.route("/api/messages", methods=["GET"])
def get_messages():
    # Fetch from MongoDB and convert _id to string for JSON compatibility
    messages = list(messages_col.find().sort("sent_at", -1))
    for msg in messages:
        msg["_id"] = str(msg["_id"]) 
    return jsonify(messages)

@app.route("/api/stats", methods=["GET"])
def stats():
    msg_count = messages_col.count_documents({})
    visit_count = visits_col.count_documents({})
    return jsonify({"messages": msg_count, "visits": visit_count})

# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🚀 Portfolio server with MongoDB → http://localhost:5000")
    app.run(debug=True, port=5000)