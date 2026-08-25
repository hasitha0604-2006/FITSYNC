# FitSync AI — Final Prototype Status

## Project Status Overview

* **PROJECT**: FitSync AI
* **ARCHITECTURE**: Unified Python Flask Application (Flask, Flask-SQLAlchemy, Jinja2, Chart.js, SQLite)
* **STATUS**: **Fully Working & Complete** (Demo-Ready)
* **DATE**: August 23, 2026

---

## Completed Features

### 🔐 1. Authentication & Onboarding (Modules A, J)
* Secure session-based registration, login, and logout.
* Integrated **SIH Demo Credentials** box to log in with a single click.
* 9-step onboarding wizard collecting name, age, physical stats (height/weight), fitness goal, experience level, workout frequency/duration, equipment list, dietary type, food preferences, and daily budget.

### 🤖 2. Adaptive Engines (Modules B, C, H)
* **Fitness split generator**: Adapts PPL plans (3-6 days, 20-90 min) according to equipment availability.
* **Nutrition planner**: Harris-Benedict BMR/TDEE calculations, serving-size portion scaling, and 5 daily meal breakdowns.
* **Diet ingredient substitutions**: Instant canteen protein food swaps (e.g. Eggs unavailable -> Roasted Chana) mapped to targets.
* **Workout substitutions**: Instantly swap exercises on the fly (e.g. Bench Press -> Push-ups) when a gym station is busy.
* **Rescheduling split recovery**: Shift missed workouts to later rest days via the adaptation engine.

### 📊 3. Dashboards & Analytics (Modules D, I, G)
* Macro progress indicators (Calories, Protein, Carbs, Fat) mapped in real-time.
* Completed training checklists.
* Snappy interactive progress trend line and bar graphs powered by Chart.js.
* Searchable and filterable reference library of 24 exercises (Module E).

### 📹 4. Optional AI Form Checker (Module F)
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

Open VS Code terminal in the root folder and run:
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

All 7 custom Flask client tests pass successfully:
```bash
python test_app.py
```
* **Auth**: Validated secure hashing registration and session logins.
* **Onboarding**: Confirmed Harris-Benedict formulas output correct calories.
* **Fitness**: Verified PPL splits adapt to dumbbell constraints.
* **Swaps**: Verified Bench Press shifts to Push-ups and Eggs swap to Paneer.
* **Budget**: Confirmed that plans for tight saver budgets (₹80) select cheaper, high-protein food options compared to premium budgets.
* **Adaptation**: Confirmed missing Monday workout shifts exercises to Wednesday's rest slot.

---

## Food Preferences & Budget Fix

### 🛠️ Key Improvements Summary
* **Food Preference Customization**: **WORKING** (Tri-state independent checkboxes/buttons for ❤️ Prefer, 📦 Available, and 🚫 Avoid states are fully active).
* **Food Availability (Canteen Tracker)**: **WORKING** (Allows marking foods as available to prioritize them over unavailable ones).
* **Avoided Foods Exclusion**: **WORKING** (Strictly filters out and excludes avoided foods from recommendations and substitutions).
* **Daily Budget Selection**: **WORKING** (Enables selecting standard thresholds of ₹80, ₹100, ₹120, ₹150, ₹200, or ₹300 per day).
* **Custom Budget Validation**: **WORKING** (Input for custom amounts like ₹135/day with numeric boundaries, negative, empty, and NaN checks).
* **Budget Persistence**: **WORKING** (Saved values write directly to SQLite db, retaining state on refresh, logout/login, and app restart).
* **Budget-Aware Meal Generation**: **WORKING** (Nutrition engine evaluates food scaled costs and penalizes targets exceeding target slot budgets, choosing cheaper ingredients for saver tiers).
* **Budget-Aware Substitutions**: **WORKING** (Substitution solver respects remaining daily allowances, recommending low-cost swaps if remaining budget is tight).
* **Database Auto-Migration**: **WORKING** (Detects table status on launch, dynamically running `ALTER TABLE` to inject new columns safely without deleting user records).
* **Warnings and Alerts**: **WORKING** (Displays a warning banner if nutritional targets are unachievable on a low budget, and highlights limited choice alerts if less than 5 foods are marked as available).
* **Tests Added/Updated**: **WORKING** (Integration test suite `test_app.py` has been updated and all tests pass with code 0).
