# FitSync AI — Smart India Hackathon Demo Guide

Follow this step-by-step walkthrough to present the FitSync AI prototype during evaluations.

---

## Step 1: Zero-Configuration Launch
1. Open the project folder in VS Code.
2. In the terminal, execute:
   ```bash
   python app.py
   ```
3. Highlight that the SQLite database compiles automatically, seeds the default student profile, and launches the browser without needing uvicorn, npm, or multiple terminal setups.

---

## Step 2: One-Click Demo Login
1. On the landing page, click **Sign In**.
2. Click **Fill Demo** in the credentials callout box.
3. Show that the credentials (`demo@fitsync.ai` / `Demo@123`) populate instantly. Click **Sign In** to open the dashboard.

---

## Step 3: Food & Budget Swaps
1. Navigate to the **Nutrition Plan** tab.
2. Highlight the ₹150 daily budget limit and target macro progress meters.
3. Locate the **Breakfast** card showing "Boiled Eggs".
4. Click **Swap**, choose "Food unavailable", and click **Find Alternative**.
5. Show that the eggs are instantly replaced by "Paneer" or "Roasted Chana" with adjusted portions to match the macro targets without exceeding the budget.

---

## Step 4: Missed Workout Rescheduling
1. Navigate to the **Today's Workout** tab.
2. Check off one or two exercises to show real-time progress bar updates.
3. Explain that a student missed yesterday's workout due to an exam.
4. Click **Rebuild Remaining Week**.
5. Show the prompt confirmation: "Shifted missed workout from Monday to a later rest day (Wednesday)."
6. Go back to the dashboard or weekly schedule to verify that Wednesday is now active with the missed routine, and Monday is marked as Rest.

---

## Step 5: Standalone AI Form Analysis
1. Navigate to **Real-Time AI Form Analysis** via the sidebar (or click **AI Form** on an exercise card).
2. Choose **Squat** on the left.
3. If webcam access is allowed, demonstrate checking knee alignment angles.
4. If webcam is blocked, highlight the **Virtual AI Simulator Mode** showing coordinate waves assessing squats, crunches, and curls.
5. Exit the camera checker, showing that the rest of the application remains active.
