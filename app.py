from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
import os
import re
from datetime import datetime
from dotenv import load_dotenv

# This loads your MONGO_URI from Render's environment settings
load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")

# ─── MONGODB CONFIGURATION ───────────────────────────────────────────────────

# 1. Get the URI from Render (or use your direct string for testing)
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    # If Render hasn't set the variable yet, it uses this one:
    MONGO_URI = "mongodb+srv://uddesya:uddesya123@cluster0.b6zjkkg.mongodb.net/?retryWrites=true&w=majority"

# 2. Connect to the Cluster
client = MongoClient(MONGO_URI)
db = client.get_database('portfolio_db')

# 3. Define your Collections
messages_col = db.messages
visits_col = db.visits

# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    # This automatically tracks every time someone opens your site
    try:
        visits_col.insert_one({
            "page": "/",
            "visited_at": datetime.utcnow().isoformat()
        })
    except Exception as e:
        print(f"Database Error: {e}")
    
    return render_template("index.html")

@app.route("/api/contact", methods=["POST"])
def contact():
    # FIX: This detects if data is coming from a Form or from JavaScript JSON
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    # Clean the data (remove extra spaces)
    name    = (data.get("name", "") or "").strip()
    email   = (data.get("email", "") or "").strip()
    subject = (data.get("subject", "") or "").strip()
    body    = (data.get("body", "") or "").strip()

    # Validation Logic
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

    # 4. SAVE TO MONGODB ATLAS
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
    # This lets you see all messages in order
    messages = list(messages_col.find().sort("sent_at", -1))
    for msg in messages:
        msg["_id"] = str(msg["_id"]) # Convert MongoDB ID to text
    return jsonify(messages)

# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # This tells Render which port to use (10000 by default)
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)