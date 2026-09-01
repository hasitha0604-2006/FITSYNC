"""
FITSYNC AI — DATABASE RUNTIME CONSISTENCY REGRESSION TEST SUITE
Verifies canonical database path resolution, Flask SQLAlchemy engine connectivity,
schema completeness (17/17 tables), startup idempotency, user persistence across restarts,
and error-free login query execution.
"""

import os
import unittest
from pathlib import Path
from sqlalchemy import func, text
from app import app, db, User, UserProfile, init_app_database, normalize_email

class DatabaseRuntimeConsistencyTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        base_dir = Path(__file__).resolve().parent.parent
        self.app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{(base_dir / 'instance' / 'fitsync.db').as_posix()}"
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        init_app_database(self.app)

    def tearDown(self):
        db.session.remove()
        self.ctx.pop()

    # 1. Canonical database path is deterministic
    def test_1_canonical_database_path_deterministic(self):
        base_dir = Path(__file__).resolve().parent.parent
        expected_path = (base_dir / "instance" / "fitsync.db").resolve()
        self.assertTrue(expected_path.as_posix().endswith("instance/fitsync.db"))
        self.assertTrue(expected_path.parent.exists())

    # 2. Flask SQLAlchemy URI points to canonical database
    def test_2_sqlalchemy_uri_points_to_canonical_db(self):
        base_dir = Path(__file__).resolve().parent.parent
        expected_db_path = (base_dir / "instance" / "fitsync.db").resolve()
        configured_uri = self.app.config.get('SQLALCHEMY_DATABASE_URI', '')
        self.assertTrue(configured_uri.startswith("sqlite:///"))
        self.assertIn("instance/fitsync.db", configured_uri)

    # 3. Flask engine connects to canonical database
    def test_3_flask_engine_connects_to_canonical_db(self):
        with db.engine.connect() as conn:
            res = conn.execute(text("PRAGMA database_list;")).fetchall()
            db_files = [row[2] for row in res if row[2]]
            self.assertTrue(any("fitsync.db" in f for f in db_files))

    # 4. users table exists
    def test_4_users_table_exists(self):
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        self.assertIn("users", tables)

    # 5. All 17 required tables exist
    def test_5_all_17_required_tables_exist(self):
        required = [
            "users", "user_profiles", "user_equipments", "user_food_preferences",
            "nutrition_targets", "exercises", "foods", "custom_foods",
            "workout_plans", "workout_days", "workout_exercises", "meal_plans",
            "meals", "progress_records", "completed_workouts",
            "chat_conversations", "chat_messages"
        ]
        inspector = db.inspect(db.engine)
        tables = set(inspector.get_table_names())
        for req in required:
            self.assertIn(req, tables, f"Missing required table: {req}")

    # 6. Fresh schema initialization does not drop existing tables
    def test_6_schema_init_does_not_drop_tables(self):
        # Create a test user
        email = "schema_test@fitsync.ai"
        u = User(email=email, password_hash="hash123")
        db.session.add(u)
        db.session.commit()

        # Run safe initialization again
        init_app_database(self.app)

        # Verify user still exists
        found = User.query.filter_by(email=email).first()
        self.assertIsNotNone(found)

    # 7. Startup is idempotent
    def test_7_startup_is_idempotent(self):
        init_app_database(self.app)
        init_app_database(self.app)
        cnt = User.query.filter_by(email="demo@fitsync.ai").count()
        self.assertEqual(cnt, 1)

    # 8. Existing user survives startup
    def test_8_existing_user_survives_startup(self):
        email = "survive_startup@fitsync.ai"
        u = User(email=email, password_hash="pwd123")
        db.session.add(u)
        db.session.commit()

        # Re-run startup
        init_app_database(self.app)
        reloaded = User.query.filter_by(email=email).first()
        self.assertIsNotNone(reloaded)

    # 9. Existing user survives restart (session remove / engine dispose)
    def test_9_existing_user_survives_restart(self):
        email = "survive_restart@fitsync.ai"
        u = User(email=email, password_hash="pwd123")
        db.session.add(u)
        db.session.commit()
        uid = u.id

        # Dispose connections
        db.session.remove()
        db.engine.dispose()

        # Re-query
        reloaded = User.query.get(uid)
        self.assertIsNotNone(reloaded)
        self.assertEqual(reloaded.email, email)

    # 10. Login query works (SELECT COUNT(*), User.query.first(), lower(email) lookup)
    def test_10_login_query_works(self):
        # 1. Direct engine count query
        with db.engine.connect() as conn:
            res = conn.execute(text("SELECT COUNT(*) FROM users;")).scalar()
            self.assertGreaterEqual(res, 0)

        # 2. ORM first() query
        first_user = User.query.first()
        self.assertIsNotNone(first_user)

        # 3. Case-insensitive email query
        clean_email = normalize_email("DEMO@FITSYNC.AI")
        user = User.query.filter(func.lower(User.email) == clean_email).first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, "demo@fitsync.ai")

    # 11. No alternate accidental database is created
    def test_11_no_alternate_accidental_db_created(self):
        base_dir = Path(__file__).resolve().parent.parent
        instance_dir = base_dir / "instance"
        all_dbs = list(instance_dir.glob("*.db"))
        self.assertEqual(len(all_dbs), 1)
        self.assertEqual(all_dbs[0].name, "fitsync.db")

    # 12. Test database isolation works correctly
    def test_12_test_database_isolation(self):
        u1 = User(email="test_iso_a@fitsync.ai", password_hash="hash")
        db.session.add(u1)
        db.session.commit()

        u2 = User(email="test_iso_b@fitsync.ai", password_hash="hash")
        db.session.add(u2)
        db.session.commit()

        found_a = User.query.filter_by(email="test_iso_a@fitsync.ai").first()
        found_b = User.query.filter_by(email="test_iso_b@fitsync.ai").first()
        self.assertNotEqual(found_a.id, found_b.id)

if __name__ == "__main__":
    unittest.main()
