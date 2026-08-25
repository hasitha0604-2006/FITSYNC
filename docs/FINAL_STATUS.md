# FitSync AI — Final Prototype Status

## Project Status Overview

* **PROJECT**: FitSync AI (SIH Prototype)
* **ARCHITECTURE**: Unified Python Flask Application (Flask, Flask-SQLAlchemy, Jinja2, Chart.js, SQLite)
* **STATUS**: **Fully Working & Complete** (Demo-Ready)
* **DATE**: August 25, 2026

---

## Completed Features

### 🔐 1. Authentication & Onboarding
* Secure session-based registration, login, and logout.
* Integrated **SIH Demo Credentials** box to log in with a single click.
* 9-step onboarding wizard collecting name, age, physical stats (height/weight), fitness goal, experience level, workout frequency/duration, equipment list, dietary type, food preferences, and daily budget.

### 🤖 2. Adaptive Engines
* **Fitness split generator**: Adapts PPL plans (3-6 days, 20-90 min) according to equipment availability.
* **Nutrition planner**: Harris-Benedict BMR/TDEE calculations, serving-size portion scaling, and 5 daily meal breakdowns.
* **Diet ingredient substitutions**: Instant canteen protein food swaps (e.g. Eggs unavailable -> Roasted Chana) mapped to targets.
* **Workout substitutions**: Instantly swap exercises on the fly (e.g. Bench Press -> Push-ups) when a gym station is busy.
* **Rescheduling split recovery**: Shift missed workouts to later rest days via the adaptation engine.

### 🖼️ 3. Workout Graphics & Demonstrations
* **Visual Asset System**: 32 supported exercises featuring vector animated demonstrations located in `static/exercises/<slug>/demo.svg`.
* **Interactive Player Modal**: Exercise details and Today's Workout feature `[▶ Demonstration]` modals with visual animations, start/movement/end biomechanics, and safety notes.
* **Fallback Safety**: Graceful fallback displaying `"Demonstration coming soon"` card if no media asset is present.

### 🔍 4. Controlled Exercise Search & Catalog (30+ Exercises)
* **Search & Filter Bar**: Instant search supporting exact name, partial name, muscle group, equipment, and difficulty filters.
* **Catalog Counter**: Badge displaying `Supported Exercises: 30+`.
* **Controlled Empty State**: Friendly fallback message (`"We don't currently have a guided demonstration for this exercise"`) with quick-search recommendations (`Squat`, `Push-up`, `Bench Press`, `Bicep Curl`) and a button to browse supported exercises.

### 🥗 5. Custom Food Items (`CustomFood` Model)
* **Full CRUD Management**: Dedicated API (`/api/custom-foods`) and UI modal (`+ Add Custom Food`) for users to create, edit, delete, and persist custom foods.
* **Input Validation**: Strict validation preventing blank names, negative nutrition metrics (serving size, calories, protein, carbs, fat, fiber, cost), and NaN inputs.
* **Seamless Integration**: Custom foods participate in daily meal planning, food preferences (Preferred, Available, Avoided), budget calculations, macro targets, and food swaps.

### ✨ 6. AI-Assisted Diet Plan Generation (`services/ai_diet_engine.py`)
* **AI Recommendation Layer**: Uses structured food database + custom foods to generate a 5-meal daily plan (`/api/diet/generate`).
* **Constraint Validation**: Post-proposal check verifying diet type (Vegetarian/Vegan/Eggetarian), avoided items, available items, macro targets, and daily budget.
* **"WHY THIS PLAN?" Explanation**: Displays a 2-sentence rationale highlighting protein alignment and budget efficiency.
* **Automatic Fallback**: Gracefully falls back to local nutrition engine with a banner notice if AI API key (`AI_API_KEY` / `GEMINI_API_KEY`) is unconfigured or unreachable.

### 📊 7. Dashboards & Analytics
* Real-time macro progress indicators (Calories, Protein, Carbs, Fat) vs targets.
* Completed training checklists.
* Snappy interactive progress trend line and bar graphs powered by Chart.js.

### 📹 8. Optional AI Form Checker
* Standalone and card-embedded camera overlay checkers.
* Pure Python joint angle algorithms checking coordinates for Squats, Push-ups, and Bicep Curls.
* Seamless **Virtual AI Simulator** fallback loop when camera permissions are denied or OpenCV/MediaPipe libraries are absent.

---

## Demo Account Credentials

Use this account to run the demonstration immediately:
* **Email**: `demo@fitsync.ai`
* **Password**: `Demo@123`

---

## Installation & Running Instructions

Open terminal in the root folder and run:
```bash
# 1. Setup environment
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Run app
python app.py
```
Or simply double-click the **`run.bat`** script.

---

## Testing Performed

All 11 integration and unit tests pass successfully:
```bash
py test_app.py -v
```
* **`test_auth_flow`**: Validated secure hashing registration and session logins.
* **`test_onboarding_equations`**: Confirmed Harris-Benedict formulas output correct calories.
* **`test_fitness_generation`**: Verified PPL splits adapt to dumbbell constraints.
* **`test_exercise_substitutions`**: Verified Bench Press shifts to Push-ups and Eggs swap to Paneer.
* **`test_budget_constraints_and_preferences`**: Confirmed saver budgets prioritize affordable high-protein items.
* **`test_missed_workout_rescheduling`**: Confirmed missing workout shifts to rest days.
* **`test_custom_food_features`**: Verified custom food CRUD, validation, persistence, and preference mapping.
* **`test_exercise_search_api`**: Verified controlled search, muscle category filtering, and unsupported query fallback.
* **`test_ai_diet_generation_and_fallback`**: Verified AI diet endpoint, constraint compliance, and fallback banner.
* **`test_workout_graphics_assets`**: Verified 30+ exercises have media paths and supported_demo flags.
