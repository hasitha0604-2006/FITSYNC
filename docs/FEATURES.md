# FitSync AI — Features Reference

FitSync AI is tailored to solve the real-world constraints faced by college students.

---

## 1. Budget-Aware Diet Planner
College students often have strict financial limits. FitSync AI maps foods based on five budget tiers:
* **₹80 Saver**: Focuses on rice, dal, peanuts, and roasted chana.
* **₹100 Saver**: Adds milk, curd, oats, and eggs.
* **₹150 Student**: Integrates standard paneer, tofu, soy chunks, and eggs.
* **₹200 Premium**: Adds chicken breast, seasonal fruits, and paneer.
* **₹300+ Unlimited**: Includes fish, whey, chicken breast, and nuts.

---

## 2. Dynamic Food Substitutions
If a canteen food item is unavailable or too expensive:
1. Click **Swap** on the meal card.
2. Select a reason (e.g., "Too expensive" or "Unavailable").
3. The nutrition engine searches the SQLite database (`foods.json`) for items of the same category, scales the portion size to match the target calorie target, and matches the protein requirement.
4. Updates the daily macros and updates progress values.

---

## 3. Equipment-Aware Workout Splits
Generates progressive PPL (Push-Pull-Legs) splits targeting dumbbells, resistance bands, or bodyweight exercises:
* **No Equipment**: Calisthenics (Push-ups, Bodyweight squats, Planks, Crunches).
* **Dumbbells**: Hostel-friendly routines (Dumbbell press, Rows, Goblet squats, Curls).
* **Full Gym**: Access to barbells, cable machines, and isolation exercises.

---

## 4. Exam Recovery Week Rebuilding
If a student misses a workout due to exams or labs:
* Click **Rebuild Remaining Week**.
* The adaptation engine shifts the missed workout focus and exercises to the next chronological rest day.
* Prevents overtraining by keeping rest days intact if no further rest slots exist, updating the plan cleanly.

---

## 5. Standalone & Embedded AI Form Check
Checks joints using standard Python mathematical angles (e.g., knee extension angle for squats, elbow bend for push-ups, arm angle for curls):
* **Webcam Mode**: Evaluates posture using local WebRTC captures and outputs visual directives.
* **Simulator Fallback**: If webcam permissions are denied or libraries are missing, a simulated wave generator simulates correct form tracking.
