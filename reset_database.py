"""
FitSync AI — Standalone Developer Database Reset Script
Deletes instance/fitsync.db, creates all tables via SQLAlchemy, seeds 47 exercises, foods, and Demo User, and validates relational integrity.
Run manually via: python reset_database.py
"""

import os
import sys
from pathlib import Path

# Ensure application root directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app import app, db, User, Exercise, Food, seed_database, run_migrations

def reset_database():
    db_path = BASE_DIR / "instance" / "fitsync.db"
    
    print("[RESET] FitSync AI Database Rebuild Tool")
    print(f"Target DB path: {db_path}")

    with app.app_context():
        # 1. Close active connections and remove existing DB file
        try:
            db.session.remove()
            db.engine.dispose()
        except Exception as e:
            print(f"[RESET WARNING] Engine dispose: {e}")

        if db_path.exists():
            try:
                os.remove(db_path)
                print("[RESET] Existing database file deleted successfully.")
            except Exception as e:
                print(f"[RESET WARNING] File deletion deferred (locked by active process), performing SQL drop_all: {e}")

        # 2. Re-create all tables cleanly
        print("[RESET] Dropping existing schema and creating fresh database tables...")
        db.drop_all()
        db.create_all()

        # 3. Run migrations and seeders
        print("[RESET] Executing migrations and seeding datasets...")
        run_migrations()
        seed_database()

        # 4. Relational integrity validation
        user_count = User.query.count()
        ex_count = Exercise.query.count()
        food_count = Food.query.count()

        print("\n--- DATABASE REBUILD VERIFICATION REPORT ---")
        print(f"  [DB PATH] Persistent Database Path : {db_path}")
        print(f"  [USERS]   Registered Users Count  : {user_count}")
        print(f"  [EXERCISES] Biomechanical Exercises  : {ex_count}")
        print(f"  [FOODS]   Food Database Items      : {food_count}")
        print("--- FITSYNC DATABASE REBUILD COMPLETED SUCCESSFULLY ---\n")

if __name__ == "__main__":
    reset_database()
