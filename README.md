# FitSync AI — "Your lifestyle. Your fitness plan."

FitSync AI is an adaptive fitness and nutrition planning web platform designed specifically around the constraints of college students. Built as a unified platform presentation, it launches with a single command and includes a 5–7 minute interactive demonstration.

---

## 💡 The Core Innovation

> **"Unlike generic fitness applications that provide fixed workout and diet plans, FitSync AI generates and continuously adapts a student's fitness and nutrition plan according to personal goals, lifestyle, food availability, nutritional targets, budget, workout constraints, and progress."**

---

## 🚀 Key Adaptive Features

1. **Equipment Aware**: If a student changes constraints (e.g. selecting "No Equipment" or "Dumbbells only"), the fitness engine alters their weekly routine to only recommend suitable bodyweight or free weight movements.
2. **Hostel & Budget Friendly**: Meals are composed using common Indian college food staples. If a primary ingredient is too expensive or unavailable (e.g., eggs or paneer), the user can click **Swap** to find cheap, macro-similar alternatives like roasted chana, milk, or lentils.
3. **Missed Workout Shifting**: Exam or laboratory commitments can disrupt workouts. Instead of marking days as permanently missed, clicking **Rebuild Remaining Week** moves the incomplete workout to the upcoming chronological rest days, preventing overload.
4. **AI Pose Checker**: Built-in computer vision utilizing webcam feeds calculates posture joint angles for squats, push-ups, and bicep curls, with zero video data storage for maximum student privacy. Has a built-in virtual simulator fallback in case cameras are denied.

---

## 📂 Project Structure

```
FitSync-AI/
│
├── app.py                     # Flask Application, SQLite config, and browser opener
├── requirements.txt           # Python dependencies (Flask, Flask-SQLAlchemy, etc.)
├── run.bat                    # One-click Windows setup launcher script
├── test_app.py                # Unified automated testing suite
│
├── templates/                 # Jinja2 HTML templates
│   ├── base.html              # Layout shell (CDNs for Tailwind/Lucide/Chart.js)
│   ├── index.html             # Landing page
│   ├── login.html             # Login
│   ├── register.html          # Registration
│   ├── onboarding.html        # 9-step onboarding wizard
│   ├── dashboard.html         # User dashboard
│   ├── today_workout.html     # Exercise checklists & webcam overlays
│   ├── workout_plan.html      # Weekly schedule
│   ├── exercise_library.html  # Search & filters
│   ├── exercise_detail.html   # Biomechanics guides
│   ├── form_check.html        # Standalone CV analyzer page
│   ├── nutrition.html         # Daily food schedules & macro overrides
│   ├── meal_detail.html       # Portion macro splits
│   ├── progress.html          # Chart.js graphs & weight logging
│   ├── profile.html           # BMI stats
│   └── settings.html          # Config links
│
├── static/                    # Frontend static assets
│   ├── css/
│   │   └── style.css          # UI scrollbars and animations
│   └── js/                    # Client page fetch triggers
│
├── data/                      # Global seed assets
│   ├── exercises.json         # 24 muscular movements
│   └── foods.json             # 22 Indian student staples
│
├── instance/                  # Generated database folder
│   └── fitsync.db             # Local SQLite database file
│
├── services/                  # Calculation business logic
│   ├── fitness_engine.py      # Workout splits generator
│   ├── nutrition_engine.py    # Caloric models & food substitutions
│   ├── adaptation_engine.py   # Rescheduling engines
│   └── form_analysis.py       # CV angle analytics & mock coordinate generator
│
└── docs/                      # Documentation
    ├── ARCHITECTURE.md
    ├── SETUP.md
    ├── FEATURES.md
    ├── DEMO_GUIDE.md
    └── FINAL_STATUS.md
```

---

## 🛠️ Setup Instructions (Windows PowerShell)

Ensure you have **Python 3.10+** installed on your Windows laptop.

### Easy Setup: One-Click Launcher
Double-click **`run.bat`** in the project root folder. The script automatically sets up the python virtual environment, installs dependencies, seeds the database, starts the server, and launches the browser.

### Manual Command Line Setup
Open a PowerShell terminal window in the project root:

```powershell
# 1. Create python virtual environment
python -m venv venv

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the application
python app.py
```
Open `http://127.0.0.1:5000` in Google Chrome or Microsoft Edge (it opens automatically on boot).

---

## 🎥 Recommended 5-Minute Demo Flow

1. **Access Portal**: Run `python app.py`. The browser will automatically open `http://127.0.0.1:5000`.
2. **One-Click Demo Login**: Click **Sign In**. Click the **Fill Demo** button to pre-fill the form with credentials:
   - **Email:** `demo@fitsync.ai`
   - **Password:** `Demo@123`
   Click **Sign In** to log in instantly.
3. **Inspect Dashboard**: Verify that the daily checklist contains calories, protein bars, active workout days (e.g. Chest + Triceps), and today's meal summaries.
4. **Test Food Substitution**: Navigate to the **Nutrition Plan** tab. Select **Boiled Eggs** -> click **Swap** -> choose reason "Food unavailable" -> witness the engine replace it with a cheap protein source (like roasted chana) while preserving the macro budget!
5. **Test Exercise Substitution**: Navigate to **Today's Workout** tab. Select **Bench Press** -> click **Swap** -> choose "No equipment" -> check the replacement to **Push-ups** targeting the same chest muscle group.
6. **Test AI Form Check**: Click **AI Form** next to Squat or Push-up. Agree to the privacy explanation. If webcam is available, perform the exercise and see angles check. If webcam is blocked/absent, the UI falls back to the **Virtual AI Simulator** showing real-time coordinate waves without crashing.
7. **Reschedule Missed Routines**: Click **Rebuild Remaining Week** on the Workout page. The engine will shift incomplete routines to rest days.
8. **Check Progress Analytics**: Go to **Progress Tracking** -> log weight -> check the Chart.js graphs rendering your weekly calorie compliance and weight loss/gain curve.
