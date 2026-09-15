from app import app, db

# Initialize database tables on serverless function context start if needed
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Database initialization note: {e}")

# Vercel WSGI entry point
