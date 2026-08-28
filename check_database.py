"""
FitSync AI — Database Health & Schema Diagnostic Tool
Verifies SQLite path, connection, and core table existence.
"""

import sys
from pathlib import Path
from app import app, db, User, Exercise, Food, DB_PATH

REQUIRED_TABLES = [
    "users",
    "user_profiles",
    "user_equipments",
    "user_food_preferences",
    "nutrition_targets",
    "exercises",
    "foods",
    "custom_foods",
    "workout_plans",
    "workout_days",
    "workout_exercises",
    "meal_plans",
    "meals",
    "progress_records",
    "completed_workouts",
    "chat_conversations",
    "chat_messages"
]

def check_database():
    print("=" * 60)
    print("FITSYNC DATABASE HEALTH")
    print("=" * 60)

    with app.app_context():
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        db_exists = DB_PATH.exists()
        db_size = DB_PATH.stat().st_size if db_exists else 0

        print(f"Canonical path:")
        print(f"{DB_PATH}")
        print()
        print(f"Exists:")
        print(f"{'YES' if db_exists else 'NO'}")
        print()
        print(f"Size:")
        print(f"{db_size}")
        print()

        try:
            inspector = db.inspect(db.engine)
            existing_tables = set(inspector.get_table_names())
            missing_tables = [t for t in REQUIRED_TABLES if t not in existing_tables]

            users_pass = "users" in existing_tables

            print(f"SQLite connection:")
            print(f"OK")
            print()
            print(f"Users table:")
            print(f"{'PASS' if users_pass else 'FAIL'}")
            print()
            print(f"Required tables:")
            print(f"{len(existing_tables) - len(missing_tables)}/{len(REQUIRED_TABLES)}")
            print()

            if missing_tables:
                print(f"[FAIL] Missing tables: {', '.join(missing_tables)}")
                print("=" * 60)
                sys.exit(1)

            user_cnt = User.query.count()
            ex_cnt = Exercise.query.count()
            food_cnt = Food.query.count()

            print(f"Users:")
            print(f"{user_cnt}")
            print()
            print(f"Exercises:")
            print(f"{ex_cnt}")
            print()
            print(f"Foods:")
            print(f"{food_cnt}")
            print()
            print(f"Database URI:")
            print(f"{db_uri}")
            print("=" * 60)
            sys.exit(0)

        except Exception as err:
            print(f"SQLite connection:")
            print(f"FAIL ({err})")
            print("=" * 60)
            sys.exit(1)

if __name__ == "__main__":
    check_database()
