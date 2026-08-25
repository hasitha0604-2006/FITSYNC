# FitSync AI — Final Prototype Status

## Project Status Overview

* **PROJECT**: FitSync AI (SIH Prototype)
* **ARCHITECTURE**: Unified Python Flask Application (Flask, Flask-SQLAlchemy, Jinja2, Chart.js, SQLite)
* **STATUS**: **Fully Working & Complete** (Demo-Ready)
* **DATE**: August 25, 2026

---

## Completed Features

### 🏋️‍♂️ 1. VISUAL GYM LIBRARY & GRAPHICAL DEMONSTRATIONS
* **Visual Fitness Catalog**: Redesigned Exercise Library into a high-end visual fitness encyclopedia.
* **47 Supported Exercises**: Expanded catalog to 47 thoroughly documented high-quality exercises covering all major muscle groups: **Chest, Back, Shoulders, Biceps, Triceps, Forearms, Abs, Obliques, Glutes, Quadriceps, Hamstrings, Calves**.
* **Vector SVG Graphical Demonstrations**: Every supported exercise features an animated SVG demonstration (`static/exercises/<slug>/demo.svg`) showing movement path keyframes and key position posture.
* **SVG Fallback Graphic**: Graceful fallback to `static/exercises/fallback_demo.svg` for missing assets.
* **Interactive Player Modal & Detail View**: Shows movement biomechanics (`START -> MOVEMENT -> END`), step-by-step execution checkpoints, common execution mistakes, safety notes, and alternative exercise recommendations.

### 🤖 2. AI GYM SEARCH & FITSYNC KNOWLEDGE BASE
* **Natural Language AI Search (`/api/ai/search`)**: Users can search by exact keyword or ask natural language gym questions such as:
  * `"biceps workout at gym"`
  * `"shoulder exercises with dumbbells"`
  * `"what can replace bench press?"`
  * `"I only have dumbbells at home. What can I do for shoulders?"`
  * `"knee discomfort during squats"` (Triggers safety & conservative medical disclaimer)
* **Structured FitSync Gym Knowledge Base**: Curated data files under `data/gym_knowledge/`:
  * `muscles.json`
  * `equipment.json`
  * `workout_types.json`
  * `fitness_goals.json`
  * `exercise_aliases.json`
  * `common_questions.json`
* **AI Search Architecture**: Natural language query -> Intent extraction (Muscle, Equipment, Environment, Injury/Safety) -> Knowledge base retrieval -> Structured result validation -> Visual results + AI rationale.
* **AI Fallback & Reliability**: Operates reliably using structured NLP rules and local knowledge retrieval if external AI API key is unconfigured or unreachable ("Based on FitSync's exercise library").

### 🧬 3. VISUAL MUSCLE MAP
* **Interactive Anatomical Map**: Integrated human body muscle selector tab.
* **Target Muscle Filtering**: Clickable muscle regions (`Chest`, `Back`, `Shoulders`, `Arms/Biceps`, `Triceps`, `Core & Abs`, `Legs & Glutes`) that instantly filter the Visual Exercise Library.
* **Primary vs Secondary Distinction**: Clear distinction between `Primary Muscle` and `Secondary Muscles` to preserve anatomical accuracy.

### 🔐 4. Authentication & Onboarding
* Secure session-based registration, login, and logout.
* Integrated **SIH Demo Credentials** box to log in with a single click.
* 9-step onboarding wizard collecting name, age, physical stats (height/weight), fitness goal, experience level, workout frequency/duration, equipment list, dietary type, food preferences, and daily budget.

### 🤖 5. Adaptive Engines
* **Fitness split generator**: Adapts PPL plans (3-6 days, 20-90 min) according to equipment availability.
* **Nutrition planner**: Harris-Benedict BMR/TDEE calculations, serving-size portion scaling, and 5 daily meal breakdowns.
* **Diet ingredient substitutions**: Instant canteen protein food swaps (e.g. Eggs unavailable -> Roasted Chana) mapped to targets.
* **Workout substitutions**: Instantly swap exercises on the fly (e.g. Bench Press -> Push-ups) when a gym station is busy.
* **Rescheduling split recovery**: Shift missed workouts to later rest days via the adaptation engine.

### 🥗 6. Custom Food Items (`CustomFood` Model)
* **Full CRUD Management**: Dedicated API (`/api/custom-foods`) and UI modal (`+ Add Custom Food`) for users to create, edit, delete, and persist custom foods.
* **Input Validation**: Strict validation preventing blank names, negative nutrition metrics (serving size, calories, protein, carbs, fat, fiber, cost), and NaN inputs.
* **Seamless Integration**: Custom foods participate in daily meal planning, food preferences (Preferred, Available, Avoided), budget calculations, macro targets, and food swaps.

### ✨ 7. AI-Assisted Diet Plan Generation (`services/ai_diet_engine.py`)
* **AI Recommendation Layer**: Uses structured food database + custom foods to generate a 5-meal daily plan (`/api/diet/generate`).
* **Constraint Validation**: Post-proposal check verifying diet type (Vegetarian/Vegan/Eggetarian), avoided items, available items, macro targets, and daily budget.
* **"WHY THIS PLAN?" Explanation**: Displays a 2-sentence rationale highlighting protein alignment and budget efficiency.
* **Automatic Fallback**: Gracefully falls back to local nutrition engine with a banner notice if AI API key (`AI_API_KEY` / `GEMINI_API_KEY`) is unconfigured or unreachable.

### 📊 8. Dashboards & Analytics
* Real-time macro progress indicators (Calories, Protein, Carbs, Fat) vs targets.
* Completed training checklists.
* Snappy interactive progress trend line and bar graphs powered by Chart.js.

### 📹 9. Optional AI Form Checker
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

All 14 integration and unit tests pass successfully:
```bash
python -m unittest test_app.py -v
```
* **`test_ai_gym_search_api`**: Verified natural language AI query intent extraction, biceps gym search, dumbbell shoulder search, exercise alternative recommendations, injury safety disclaimers, and unsupported fallback.
* **`test_gym_knowledge_base_files`**: Confirmed existence and integrity of all structured gym knowledge JSON files.
* **`test_exercise_catalog_expansion`**: Confirmed catalog expansion to 47 exercises across all 12 target muscle groups.
* **`test_workout_graphics_assets`**: Verified 47 exercises have media paths and supported_demo flags.
* **`test_auth_flow`**: Validated secure hashing registration and session logins.
* **`test_onboarding_equations`**: Confirmed Harris-Benedict formulas output correct calories.
* **`test_fitness_generation`**: Verified PPL splits adapt to dumbbell constraints.
* **`test_exercise_substitutions`**: Verified Bench Press shifts to Push-ups and Eggs swap to Paneer.
* **`test_budget_constraints_and_preferences`**: Confirmed saver budgets prioritize affordable high-protein items.
* **`test_missed_workout_rescheduling`**: Confirmed missing workout shifts to rest days.
* **`test_custom_food_features`**: Verified custom food CRUD, validation, persistence, and preference mapping.
* **`test_exercise_search_api`**: Verified controlled search and category filtering.
* **`test_ai_diet_generation_and_fallback`**: Verified AI diet endpoint, constraint compliance, and fallback banner.
