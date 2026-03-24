"""
view_db.py - Run this to see your messages cleanly.
Usage: python view_db.py
"""

import sqlite3
import os

# Checks both locations automatically
BASE = os.path.dirname(os.path.abspath(__file__))
DB1  = os.path.join(BASE, "instance", "portfolio.db")
DB2  = os.path.join(BASE, "portfolio.db")

if   os.path.exists(DB1): DB_PATH = DB1
elif os.path.exists(DB2): DB_PATH = DB2
else:
    print("ERROR: portfolio.db not found.")
    print("Run 'python app.py' first, then try again.")
    exit()

print("Reading from:", DB_PATH)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

print("\n" + "="*60)
print("  MESSAGES")
print("="*60)

try:
    rows = conn.execute("SELECT * FROM messages ORDER BY rowid DESC").fetchall()
except:
    rows = conn.execute("SELECT * FROM messages").fetchall()

if not rows:
    print("  (no messages yet — send one from the contact form!)")
else:
    for r in rows:
        d = dict(r)
        print(f"\n  ID      : {d.get('id','?')}")
        print(f"  Name    : {d.get('name','?')}")
        print(f"  Email   : {d.get('email','?')}")
        print(f"  Subject : {d.get('subject','?')}")
        print(f"  Message : {d.get('body') or d.get('message','?')}")
        print(f"  Time    : {d.get('created_at') or d.get('sent_at','?')}")
        print("  " + "-"*40)

total = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
print(f"\n  Total messages: {total}")
print("="*60 + "\n")
conn.close()