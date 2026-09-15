import sys
import os
from pathlib import Path

# Add project root directory to sys.path so app.py and local packages can be imported
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Import Flask app and db from root app.py
from app import app, db

# Initialize database tables on serverless function context start if needed
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Database initialization note: {e}")

# Entry point handler for Vercel Serverless Function
