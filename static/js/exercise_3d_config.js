/**
 * FitSync AI — 3D Exercise & Yoga Demonstration Configuration
 * Links exercise slugs, categories, equipment, camera presets, and anatomical targets.
 */
(function(window) {
  'use strict';

  const EXERCISE_3D_CONFIG = {
    // ── CHEST & PECTORAL MOVEMENTS ──
    "bench_press": {
      "animation": "bench_press",
      "category": "Chest",
      "equipment": "barbell_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Pectoralis Major", "Chest"],
      "secondary_muscles": ["Triceps Brachii", "Anterior Deltoids"],
      "phases": ["RACK START", "DESCENT (ECCENTRIC)", "CHEST CONTACT", "PRESS (CONCENTRIC)"]
    },
    "incline_bench_press": {
      "animation": "incline_bench_press",
      "category": "Chest",
      "equipment": "incline_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Clavicular Pectorals (Upper Chest)"],
      "secondary_muscles": ["Anterior Deltoids", "Triceps Brachii"],
      "phases": ["START POSITION", "CONTROLLED DESCENT", "TOUCH UPPER CHEST", "DRIVE UPWARD"]
    },
    "decline_barbell_bench_press": {
      "animation": "bench_press",
      "category": "Chest",
      "equipment": "barbell_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Lower Pectorals"],
      "secondary_muscles": ["Triceps Brachii", "Anterior Deltoids"],
      "phases": ["LOCKED START", "LOWER TO LOWER CHEST", "TOUCH STERNUM", "DRIVE TO LOCKOUT"]
    },
    "dumbbell_bench_press": {
      "animation": "dumbbell_bench_press",
      "category": "Chest",
      "equipment": "dumbbell_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Pectoralis Major", "Inner Chest"],
      "secondary_muscles": ["Triceps", "Anterior Deltoids", "Rotator Cuff"],
      "phases": ["ARMS EXTENDED", "DEEP STRETCH", "PEAK CHEST SQUEEZE", "CONTROLLED RETURN"]
    },
    "incline_dumbbell_press": {
      "animation": "incline_bench_press",
      "category": "Chest",
      "equipment": "incline_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Upper Chest (Clavicular Head)"],
      "secondary_muscles": ["Shoulders", "Triceps"],
      "phases": ["START POSITION", "CONTROLLED DESCENT", "PEAK SQUEEZE", "CONCENTRIC PRESS"]
    },
    "chest_fly": {
      "animation": "chest_fly",
      "category": "Chest",
      "equipment": "dumbbell_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Pectoralis Major (Sternal Head)"],
      "secondary_muscles": ["Anterior Deltoids", "Biceps Brachii"],
      "phases": ["OVERHEAD START", "WIDE ARC DESCENT", "DEEP CHEST STRETCH", "CONCENTRIC SQUEEZE"]
    },
    "pec_deck_fly": {
      "animation": "chest_fly",
      "category": "Chest",
      "equipment": "dumbbell_bench",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Pectoralis Major"],
      "secondary_muscles": ["Anterior Deltoids"],
      "phases": ["90° ARM FLIGHT", "ADDUCT TOWARD CENTER", "PEAK STERNAL SQUEEZE", "CONTROLLED RESET"]
    },
    "cable_crossover": {
      "animation": "chest_fly",
      "category": "Chest",
      "equipment": "cable_station",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Pectoralis Major", "Lower/Inner Chest"],
      "secondary_muscles": ["Anterior Deltoids", "Core"],
      "phases": ["WIDE CABLE REACH", "PULL DOWN & IN", "CROSS HANDS AT PEAK", "ECCENTRIC EXTENSION"]
    },
    "push_ups": {
      "animation": "push_up",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Pectoralis Major", "Chest"],
      "secondary_muscles": ["Triceps Brachii", "Anterior Deltoid", "Core Stabilizers"],
      "phases": ["RIGID PLANK", "DESCENT (45° ELBOWS)", "CHEST HOVER", "EXPLOSIVE PUSH"]
    },
    "push_up": {
      "animation": "push_up",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Pectoralis Major", "Chest"],
      "secondary_muscles": ["Triceps Brachii", "Anterior Deltoid", "Core Stabilizers"],
      "phases": ["RIGID PLANK", "DESCENT (45° ELBOWS)", "CHEST HOVER", "EXPLOSIVE PUSH"]
    },
    "incline_push_up": {
      "animation": "push_up",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.50 },
      "primary_muscles": ["Lower Pectorals"],
      "secondary_muscles": ["Triceps", "Core"],
      "phases": ["HANDS ELEVATED", "LOWER TO EDGE", "PRESS UPWARD", "LOCKOUT"]
    },
    "decline_push_up": {
      "animation": "push_up",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Upper Pectorals", "Deltoids"],
      "secondary_muscles": ["Triceps", "Core"],
      "phases": ["FEET ELEVATED", "NOSE TO FLOOR", "EXPLOSIVE DRIVE", "TOP PLANK"]
    },
    "diamond_push_up": {
      "animation": "push_up",
      "category": "Triceps",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Triceps Brachii (Lateral & Medial Heads)"],
      "secondary_muscles": ["Inner Chest", "Anterior Deltoids"],
      "phases": ["DIAMOND HAND FORMATION", "LOWER CHEST TO HANDS", "TRICEP PRESS", "LOCKOUT"]
    },
    "chest_dips": {
      "animation": "dips",
      "category": "Chest",
      "equipment": "dip_bars",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Lower Pectoralis Major", "Triceps"],
      "secondary_muscles": ["Anterior Deltoids", "Core"],
      "phases": ["SUPPORT LOCKOUT", "FORWARD LEAN DESCENT", "90° ELBOW DEPTH", "DRIVE UPWARD"]
    },
    "tricep_dips": {
      "animation": "dips",
      "category": "Triceps",
      "equipment": "dip_bars",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Triceps Brachii"],
      "secondary_muscles": ["Anterior Deltoids", "Chest"],
      "phases": ["VERTICAL TORSO LOCKOUT", "LOWER VERTICALLY", "90° TRICEP FLEXION", "POWERFUL PRESS"]
    },
    "machine_chest_press": {
      "animation": "bench_press",
      "category": "Chest",
      "equipment": "dumbbell_bench",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Pectoralis Major"],
      "secondary_muscles": ["Triceps", "Deltoids"],
      "phases": ["SEATED START", "CONCENTRIC DRIVE", "PEAK CHEST SQUEEZE", "CONTROLLED RETURN"]
    },
    "dumbbell_floor_press": {
      "animation": "dumbbell_bench_press",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Pectoralis Major", "Triceps"],
      "secondary_muscles": ["Anterior Deltoids"],
      "phases": ["FLOOR START", "TRICEP GROUND CONTACT", "VERTICAL PRESS", "SQUEEZE AT LOCKOUT"]
    },
    "svend_press": {
      "animation": "bench_press",
      "category": "Chest",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.7, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Inner Pectorals (Sternal Squeeze)"],
      "secondary_muscles": ["Anterior Deltoids"],
      "phases": ["PLATE PINCH AT CHEST", "EXTEND ARMS FORWARD", "HARD SQUEEZE", "RETURN TO STERNUM"]
    },
    "resistance_band_chest_press": {
      "animation": "bench_press",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Pectoralis Major"],
      "secondary_muscles": ["Triceps", "Deltoids"],
      "phases": ["BAND BEHIND BACK", "PRESS FORWARD", "PEAK TENSION", "CONTROLLED RESET"]
    },

    // ── BACK & LATISSIMUS MOVEMENTS ──
    "lat_pulldown": {
      "animation": "lat_pulldown",
      "category": "Back",
      "equipment": "lat_pulldown_machine",
      "camera": { "preset": "front_3_4", "distance": 3.1, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Latissimus Dorsi", "Lats"],
      "secondary_muscles": ["Biceps Brachii", "Rhomboids", "Middle Trapezius"],
      "phases": ["FULL OVERHEAD REACH", "SCAPULAR RETRACTION", "PULL TO CLAVICLE", "CONTROLLED ECCENTRIC"]
    },
    "pull_ups": {
      "animation": "pull_up",
      "category": "Back",
      "equipment": "pullup_tower",
      "camera": { "preset": "front_3_4", "distance": 3.2, "fov": 45, "targetY": 1.1 },
      "primary_muscles": ["Latissimus Dorsi", "Upper Back"],
      "secondary_muscles": ["Biceps Brachii", "Core", "Posterior Deltoids"],
      "phases": ["DEAD HANG", "ENGAGE LATS", "CHIN OVER BAR", "CONTROLLED LOWERING"]
    },
    "pull_up": {
      "animation": "pull_up",
      "category": "Back",
      "equipment": "pullup_tower",
      "camera": { "preset": "front_3_4", "distance": 3.2, "fov": 45, "targetY": 1.1 },
      "primary_muscles": ["Latissimus Dorsi", "Upper Back"],
      "secondary_muscles": ["Biceps Brachii", "Core", "Posterior Deltoids"],
      "phases": ["DEAD HANG", "ENGAGE LATS", "CHIN OVER BAR", "CONTROLLED LOWERING"]
    },
    "chin_up": {
      "animation": "pull_up",
      "category": "Back",
      "equipment": "pullup_tower",
      "camera": { "preset": "front_3_4", "distance": 3.2, "fov": 45, "targetY": 1.1 },
      "primary_muscles": ["Latissimus Dorsi", "Biceps Brachii"],
      "secondary_muscles": ["Rhomboids", "Core"],
      "phases": ["SUPINATED HANG", "DRIVE ELBOWS DOWN", "CHIN CLEAR OVER BAR", "SMOOTH LOWERING"]
    },
    "dead_hang": {
      "animation": "dead_hang",
      "category": "Forearms",
      "equipment": "pullup_tower",
      "camera": { "preset": "front_3_4", "distance": 3.0, "fov": 45, "targetY": 1.1 },
      "primary_muscles": ["Forearms (Grip Strength)", "Spinal Decompression"],
      "secondary_muscles": ["Latissimus Dorsi", "Shoulder Girdle"],
      "phases": ["OVERHAND BAR GRIP", "RELAX SHOULDER GIRDLE", "ISOMETRIC HANG HOLD", "CONTROLLED DISMOUNT"]
    },
    "seated_cable_row": {
      "animation": "seated_cable_row",
      "category": "Back",
      "equipment": "cable_row_station",
      "camera": { "preset": "side_3_4", "distance": 2.9, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Latissimus Dorsi", "Rhomboids", "Mid-Back"],
      "secondary_muscles": ["Biceps Brachii", "Posterior Deltoids", "Trapezius"],
      "phases": ["ARMS EXTENDED", "DRIVE ELBOWS BACK", "SCAPULAR PINCH", "SMOOTH EXTENSION"]
    },
    "bent_over_row": {
      "animation": "bent_over_row",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 2.9, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Latissimus Dorsi", "Rhomboids", "Trapezius"],
      "secondary_muscles": ["Posterior Deltoids", "Biceps", "Spinal Erectors"],
      "phases": ["45° HIP HINGE", "ROW TO LOWER RIBS", "PEAK SCAPULAR RETRACTION", "SLOW LOWERING"]
    },
    "one_arm_dumbbell_row": {
      "animation": "bent_over_row",
      "category": "Back",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Latissimus Dorsi", "Rhomboids"],
      "secondary_muscles": ["Biceps Brachii", "Rear Deltoids", "Core"],
      "phases": ["BENCH SUPPORT & HINGE", "PULL DUMBBELL TO HIP", "ELBOW SKYWARD PINCH", "DEEP LAT STRETCH"]
    },
    "t_bar_row": {
      "animation": "bent_over_row",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 2.9, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Mid-Back", "Rhomboids", "Lats"],
      "secondary_muscles": ["Biceps", "Spinal Erectors"],
      "phases": ["STRADDLE BAR", "HINGE & ROW", "SQUEEZE BLADES", "CONTROLLED DESCENT"]
    },
    "inverted_bodyweight_row": {
      "animation": "seated_cable_row",
      "category": "Back",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.50 },
      "primary_muscles": ["Rhomboids", "Mid-Trapezius", "Lats"],
      "secondary_muscles": ["Biceps", "Core"],
      "phases": ["HANG UNDER BAR", "PULL CHEST TO BAR", "SCAPULAR RETRACTION", "LOWER UNDER CONTROL"]
    },
    "straight_arm_pulldown": {
      "animation": "straight_arm_pulldown",
      "category": "Back",
      "equipment": "cable_station",
      "camera": { "preset": "side_3_4", "distance": 2.9, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Latissimus Dorsi (Isolated)"],
      "secondary_muscles": ["Teres Major", "Triceps (Long Head)", "Core"],
      "phases": ["OVERHEAD EXTENSION", "SWEEP BAR TO THIGHS", "PEAK LAT CONTRACTION", "SLOW CONTROLLED RETURN"]
    },
    "single_arm_cable_row": {
      "animation": "seated_cable_row",
      "category": "Back",
      "equipment": "cable_row_station",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Latissimus Dorsi", "Unilateral Stabilizers"],
      "secondary_muscles": ["Biceps", "Core Obliques"],
      "phases": ["ARM EXTENDED", "DRIVE ELBOW BACK", "PEAK UNILATERAL SQUEEZE", "ECCENTRIC RESET"]
    },
    "barbell_deadlift": {
      "animation": "deadlift",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Gluteus Maximus", "Hamstrings", "Erector Spinae"],
      "secondary_muscles": ["Latissimus Dorsi", "Trapezius", "Forearms", "Quadriceps"],
      "phases": ["LOCKED SHINS AT BAR", "LEG DRIVE OFF FLOOR", "HIP HINGE LOCKOUT", "CONTROLLED RETURN"]
    },
    "deadlift": {
      "animation": "deadlift",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Gluteus Maximus", "Hamstrings", "Erector Spinae"],
      "secondary_muscles": ["Latissimus Dorsi", "Trapezius", "Forearms", "Quadriceps"],
      "phases": ["LOCKED SHINS AT BAR", "LEG DRIVE OFF FLOOR", "HIP HINGE LOCKOUT", "CONTROLLED RETURN"]
    },
    "barbell_shrug": {
      "animation": "shrugs",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Upper Trapezius"],
      "secondary_muscles": ["Levator Scapulae", "Forearms"],
      "phases": ["UPRIGHT STANCE", "ELEVATE SHOULDERS TO EARS", "PEAK TRAP CONTRACTION", "SLOW CONTROLLED LOWER"]
    },
    "hyperextensions": {
      "animation": "deadlift",
      "category": "Back",
      "equipment": "flat_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Erector Spinae (Lower Back)", "Glutes"],
      "secondary_muscles": ["Hamstrings"],
      "phases": ["HINGE DOWN TO 90°", "ENGAGE POSTERIOR CHAIN", "EXTEND TO NEUTRAL ALIGNMENT", "PAUSE AT TOP"]
    },

    // ── SHOULDERS & DELTOID MOVEMENTS ──
    "shoulder_press": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Anterior & Lateral Deltoids"],
      "secondary_muscles": ["Triceps Brachii", "Upper Trapezius", "Clavicular Pectorals"],
      "phases": ["SHOULDER RACK", "VERTICAL PRESS", "OVERHEAD LOCKOUT", "SMOOTH LOWERING"]
    },
    "dumbbell_shoulder_press": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Anterior & Lateral Deltoids"],
      "secondary_muscles": ["Triceps", "Trapezius"],
      "phases": ["RACK AT SHOULDERS", "PRESS UPWARD IN ARC", "LOCK OVERHEAD", "RETURN TO EARS"]
    },
    "overhead_press": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Deltoids (Shoulders)"],
      "secondary_muscles": ["Triceps", "Upper Trapezius", "Core"],
      "phases": ["CLAVICLE STANCE", "DRIVE OVERHEAD", "HEAD THROUGH WINDOW", "RETURN TO CHEST"]
    },
    "arnold_press": {
      "animation": "arnold_press",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Anterior & Lateral Deltoids (All 3 Heads)"],
      "secondary_muscles": ["Triceps", "Rotator Cuff"],
      "phases": ["SUPINATED PALMS AT CHEST", "ROTATE OUTWARD AS YOU PRESS", "PRONATED OVERHEAD LOCKOUT", "REVERSE ROTATION ON DESCENT"]
    },
    "lateral_raise": {
      "animation": "lateral_raise",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Lateral Deltoid (Shoulder Width)"],
      "secondary_muscles": ["Anterior Deltoid", "Supraspinatus", "Upper Trapezius"],
      "phases": ["WEIGHTS AT SIDES", "LEAD WITH ELBOWS TO 90°", "PEAK ISOMETRIC HOLD", "CONTROLLED 3-SEC DESCENT"]
    },
    "cable_lateral_raise": {
      "animation": "lateral_raise",
      "category": "Shoulders",
      "equipment": "cable_station",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Lateral Deltoid"],
      "secondary_muscles": ["Trapezius"],
      "phases": ["CONSTANT CABLE TENSION", "RAISE IN SCAPULAR PLANE", "PARALLEL SHOULDER HOLD", "SMOOTH LOWERING"]
    },
    "dumbbell_front_raise": {
      "animation": "front_raise",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Anterior Deltoid (Front Shoulders)"],
      "secondary_muscles": ["Upper Pectorals", "Serratus Anterior"],
      "phases": ["THIGH RESTING START", "RAISE SAGITTALLY TO EYE LEVEL", "PAUSE AT PARALLEL", "CONTROLLED LOWERING"]
    },
    "reverse_fly": {
      "animation": "reverse_fly",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Posterior Deltoid (Rear Shoulders)"],
      "secondary_muscles": ["Rhomboids", "Infraspinatus", "Mid-Trapezius"],
      "phases": ["45° HIP HINGE", "HORIZONTAL ABDUCTION WIDE", "REAR DELT PINCH", "SLOW CONTROLLED RETURN"]
    },
    "face_pull": {
      "animation": "face_pull",
      "category": "Shoulders",
      "equipment": "cable_station",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.90 },
      "primary_muscles": ["Posterior Deltoid", "External Rotators (Infraspinatus, Teres Minor)"],
      "secondary_muscles": ["Upper Trapezius", "Rhomboids"],
      "phases": ["EYE LEVEL CABLE STANCE", "PULL ROPE TO FOREHEAD", "EXTERNAL SHOULDER ROTATION", "SLOW CONTROLLED RESET"]
    },
    "upright_row": {
      "animation": "upright_row",
      "category": "Shoulders",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Lateral Deltoid", "Upper Trapezius"],
      "secondary_muscles": ["Biceps Brachii", "Forearms"],
      "phases": ["NARROW-TO-MEDIUM GRIP", "PULL VERTICALLY ELBOWS HIGH", "BAR TO STERNUM", "SMOOTH DESCENT"]
    },
    "pike_push_up": {
      "animation": "push_up",
      "category": "Shoulders",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.50 },
      "primary_muscles": ["Anterior Deltoids", "Upper Chest"],
      "secondary_muscles": ["Triceps", "Core"],
      "phases": ["PIKE V-STANCE", "LOWER CROWN TO FLOOR", "PRESS UPWARD", "FULL LOCKOUT"]
    },
    "landmine_press": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.90 },
      "primary_muscles": ["Anterior Deltoid", "Upper Chest"],
      "secondary_muscles": ["Triceps", "Core"],
      "phases": ["BAR AT SHOULDER", "DIAGONAL PRESS", "LOCKOUT", "CONTROLLED DESCENT"]
    },

    // ── ARMS: BICEPS, TRICEPS & FOREARMS ──
    "bicep_curl": {
      "animation": "bicep_curl",
      "category": "Biceps",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Biceps Brachii (Short & Long Heads)"],
      "secondary_muscles": ["Brachialis", "Brachioradialis", "Forearm Flexors"],
      "phases": ["FULL EXTENSION", "SUPINATED CURL", "PEAK BICEP CONTRACTION", "3-SEC ECCENTRIC"]
    },
    "barbell_curl": {
      "animation": "barbell_curl",
      "category": "Biceps",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Biceps Brachii"],
      "secondary_muscles": ["Brachialis", "Forearms"],
      "phases": ["SUPINATED GRIP", "CURL IN RIGID ARC", "PEAK BICEP SQUEEZE", "CONTROLLED LOWERING"]
    },
    "hammer_curl": {
      "animation": "hammer_curl",
      "category": "Biceps",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Brachioradialis", "Brachialis"],
      "secondary_muscles": ["Biceps Brachii (Long Head)"],
      "phases": ["NEUTRAL PALMS-IN GRIP", "CURL VERTICALLY", "SQUEEZE FOREARM & BRACHIALIS", "SMOOTH DESCENT"]
    },
    "concentration_curl": {
      "animation": "concentration_curl",
      "category": "Biceps",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.7, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Biceps Brachii (Peak Hypertrophy)"],
      "secondary_muscles": ["Brachialis"],
      "phases": ["ELBOW BRACED ON INNER THIGH", "ISOLATED SUPINATED CURL", "MAXIMAL PEAK CONTRACTION", "SLOW LOWERING"]
    },
    "preacher_curl": {
      "animation": "preacher_curl",
      "category": "Biceps",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Biceps Brachii (Short Head)"],
      "secondary_muscles": ["Brachialis"],
      "phases": ["ARMS ON SLANTED PAD", "CURL FROM STRETCH", "PEAK SQUEEZE", "CONTROLLED ECCENTRIC"]
    },
    "incline_dumbbell_curl": {
      "animation": "incline_curl",
      "category": "Biceps",
      "equipment": "incline_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Biceps Brachii (Long Head Stretch)"],
      "secondary_muscles": ["Brachialis", "Forearms"],
      "phases": ["SEATED INCLINE STRETCH", "SUPINATE & CURL", "PEAK BICEP SQUEEZE", "SLOW RETURN TO STRETCH"]
    },
    "cable_curl": {
      "animation": "bicep_curl",
      "category": "Biceps",
      "equipment": "cable_station",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Biceps Brachii"],
      "secondary_muscles": ["Forearms"],
      "phases": ["CONSTANT TENSION START", "CURL TO SHOULDERS", "SQUEEZE PEAK", "ECCENTRIC LOWERING"]
    },
    "spider_curl": {
      "animation": "preacher_curl",
      "category": "Biceps",
      "equipment": "incline_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Biceps Brachii (Short Head)"],
      "secondary_muscles": ["Brachialis"],
      "phases": ["CHEST ON INCLINE BENCH", "CURL FROM VERTICAL", "PEAK ISOLATION", "CONTROLLED RESET"]
    },
    "reverse_barbell_curl": {
      "animation": "barbell_curl",
      "category": "Biceps",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Brachioradialis", "Forearm Extensors"],
      "secondary_muscles": ["Biceps Brachii"],
      "phases": ["PRONATED OVERHAND GRIP", "CURL UPWARD", "SQUEEZE FOREARMS", "SLOW DESCENT"]
    },
    "wrist_curls": {
      "animation": "wrist_curls",
      "category": "Forearms",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.5, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Forearm Flexors"],
      "secondary_muscles": ["Wrist Stabilizers"],
      "phases": ["FOREARMS ON BENCH", "ROLL TO FINGERTIPS", "CURL WRISTS UPWARD", "PEAK FLEXOR SQUEEZE"]
    },
    "reverse_wrist_curls": {
      "animation": "wrist_curls",
      "category": "Forearms",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.5, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Forearm Extensors"],
      "secondary_muscles": ["Wrist Extensors"],
      "phases": ["PALMS DOWN ON BENCH", "EXTEND WRISTS UPWARD", "SQUEEZE EXTENSORS", "LOWER CONTROLLED"]
    },
    "farmers_walk": {
      "animation": "farmers_walk",
      "category": "Forearms",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Forearms (Crushing Grip)", "Trapezius"],
      "secondary_muscles": ["Core", "Glutes", "Calves"],
      "phases": ["HEAVY DUMBBELLS AT SIDES", "TALL POSTURE & RETRACTED SCAPULAE", "CONTROLLED CADENCE STRIDE", "ISOMETRIC CORE STABILIZATION"]
    },
    "plate_pinch_hold": {
      "animation": "farmers_walk",
      "category": "Forearms",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Pinch Grip Strength", "Forearm Flexors"],
      "secondary_muscles": ["Thumb Flexors"],
      "phases": ["PINCH SMOOTH PLATES", "STAND TALL", "HOLD ISOMETRICALLY", "CONTROLLED RELEASE"]
    },
    "cable_pushdown": {
      "animation": "tricep_pushdown",
      "category": "Triceps",
      "equipment": "cable_station",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Triceps Brachii (Lateral & Medial Heads)"],
      "secondary_muscles": ["Anconeus", "Forearm Stabilizers"],
      "phases": ["90° ELBOW FLEXION", "DRIVE DOWNWARD", "FULL TRICEP LOCKOUT", "CONTROLLED RESET"]
    },
    "dumbbell_overhead_extension": {
      "animation": "overhead_tricep_extension",
      "category": "Triceps",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Triceps Brachii (Long Head)"],
      "secondary_muscles": ["Anconeus", "Shoulder Stabilizers"],
      "phases": ["OVERHEAD VERTICAL POSITION", "LOWER BEHIND HEAD TO 90°", "FULL TRICEP STRETCH", "EXTEND OVERHEAD TO LOCKOUT"]
    },
    "cable_overhead_tricep_extension": {
      "animation": "overhead_tricep_extension",
      "category": "Triceps",
      "equipment": "cable_station",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Triceps Brachii (Long Head)"],
      "secondary_muscles": ["Core"],
      "phases": ["FORWARD LUNGE STANCE", "FLEX ELBOWS TO STRETCH", "EXTEND FORWARD TO LOCKOUT", "CONTROLLED RETURN"]
    },
    "cable_rope_overhead_tricep_extension": {
      "animation": "overhead_tricep_extension",
      "category": "Triceps",
      "equipment": "cable_station",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Triceps Brachii (Long Head)"],
      "secondary_muscles": ["Core"],
      "phases": ["FORWARD LUNGE STANCE", "FLEX ELBOWS TO STRETCH", "EXTEND FORWARD TO LOCKOUT", "CONTROLLED RETURN"]
    },
    "skull_crushers": {
      "animation": "skull_crushers",
      "category": "Triceps",
      "equipment": "barbell_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Triceps Brachii (Long & Lateral Heads)"],
      "secondary_muscles": ["Anconeus", "Forearms"],
      "phases": ["VERTICAL ARMS ON BENCH", "LOWER BAR TOWARD FOREHEAD", "90° ELBOW FLEXION", "EXTEND TO LOCKOUT"]
    },
    "close_grip_bench_press": {
      "animation": "bench_press",
      "category": "Triceps",
      "equipment": "barbell_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Triceps Brachii", "Inner Pectorals"],
      "secondary_muscles": ["Anterior Deltoids"],
      "phases": ["SHOULDER-WIDTH GRIP", "LOWER TUCKED ELBOWS", "TOUCH STERNUM", "EXPLODE TO TRICEP LOCKOUT"]
    },
    "dumbbell_tricep_kickback": {
      "animation": "tricep_kickback",
      "category": "Triceps",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Triceps Brachii (Lateral & Long Heads)"],
      "secondary_muscles": ["Posterior Deltoids"],
      "phases": ["45° HIP HINGE & UPPER ARM PINNED", "EXTEND FOREARM BACKWARD", "PEAK TRICEP SQUEEZE", "SLOW RETURN TO 90°"]
    },

    // ── LEGS, GLUTES & CALVES ──
    "squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Calves (Gastrocnemius)", "Core Stabilizers"],
      "phases": ["UPRIGHT STANCE", "HIP HINGE & DESCENT", "PARALLEL DEPTH", "DRIVE THROUGH HEELS"]
    },
    "barbell_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Erector Spinae", "Adductors"],
      "phases": ["BRACED STANCE", "CONTROLLED DESCENT", "BELOW PARALLEL DEPTH", "STAND & SQUEEZE GLUTES"]
    },
    "barbell_front_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps (Targeted)", "Core"],
      "secondary_muscles": ["Glutes", "Upper Back"],
      "phases": ["CLEAN RACK POSITION", "UPRIGHT TORSO SQUAT", "FULL KNEE FLEXION", "STAND THROUGH MIDFOOT"]
    },
    "dumbbell_squats": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps", "Glutes"],
      "secondary_muscles": ["Hamstrings", "Forearms"],
      "phases": ["DUMBBELLS AT SIDES", "SINK HIPS TO PARALLEL", "DRIVE UP", "LOCKOUT"]
    },
    "goblet_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps", "Glutes"],
      "secondary_muscles": ["Upper Back", "Core"],
      "phases": ["CHEST HELD WEIGHT", "SIT BETWEEN HIPS", "DEEP SQUAT", "DRIVE UP"]
    },
    "kettlebell_goblet_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "kettlebell",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps", "Glutes"],
      "secondary_muscles": ["Core", "Upper Back"],
      "phases": ["HORNS GRIP AT CHEST", "SIT BETWEEN HIPS", "DEEP SQUAT", "STAND TALL"]
    },
    "hack_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps (Vastus Lateralis)"],
      "secondary_muscles": ["Glutes"],
      "phases": ["BACK AGAINST PAD", "CONTROLLED DESCENT", "90° KNEE BEND", "DRIVE THROUGH PLATFORM"]
    },
    "leg_press": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "flat_bench",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Adductors"],
      "phases": ["FEET SHOULDER-WIDTH ON SLED", "RELEASE SAFETY & LOWER TO 90°", "PRESS SLED WITHOUT KNEE HYPEREXTENSION", "CONTROLLED ECCENTRIC"]
    },
    "lunges": {
      "animation": "lunge",
      "category": "Legs",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Calves", "Core"],
      "phases": ["FORWARD STRIDE", "90° KNEE DROP", "TORSO UPRIGHT", "PUSH BACK TO START"]
    },
    "walking_lunges": {
      "animation": "lunge",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Quads", "Glutes"],
      "secondary_muscles": ["Hamstrings", "Calves"],
      "phases": ["FORWARD STEP", "LOWER BACK KNEE", "DRIVE FORWARD", "CONTINUOUS STRIDE"]
    },
    "bulgarian_split_squat": {
      "animation": "lunge",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus (Unilateral)"],
      "secondary_muscles": ["Hamstrings", "Adductors", "Core"],
      "phases": ["REAR FOOT ELEVATED ON BENCH", "LOWER FRONT HIP TOWARD GROUND", "90° KNEE DEPTH", "DRIVE THROUGH FRONT HEEL"]
    },
    "romanian_deadlift": {
      "animation": "deadlift",
      "category": "Legs",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Hamstrings", "Gluteus Maximus"],
      "secondary_muscles": ["Lower Back", "Forearms"],
      "phases": ["SOFT KNEES", "PUSH HIPS BACK", "HAMSTRING STRETCH", "HIP EXTENSION"]
    },
    "dumbbell_romanian_deadlift": {
      "animation": "deadlift",
      "category": "Hamstrings",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Hamstrings", "Glutes"],
      "secondary_muscles": ["Lower Back", "Grip"],
      "phases": ["SOFT KNEES", "HINGE AT HIPS", "FEEL HAMSTRING STRETCH", "DRIVE GLUTES FORWARD"]
    },
    "hip_thrust": {
      "animation": "hip_thrust",
      "category": "Glutes",
      "equipment": "flat_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Gluteus Maximus (Peak Contraction)"],
      "secondary_muscles": ["Hamstrings", "Quadriceps", "Adductor Magnus"],
      "phases": ["UPPER BACK ON BENCH", "LOWER HIPS TOWARD FLOOR", "DRIVE PELVIS TO HORIZONTAL", "PEAK 2-SEC GLUTE SQUEEZE"]
    },
    "glute_bridge": {
      "animation": "hip_thrust",
      "category": "Glutes",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Core"],
      "phases": ["SUPINE ON FLOOR", "FEET FLAT UNDER KNEES", "LIFT HIPS IN LINE WITH RIBS", "SQUEEZE GLUTES AT TOP"]
    },
    "barbell_glute_bridge": {
      "animation": "hip_thrust",
      "category": "Glutes",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.45 },
      "primary_muscles": ["Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings"],
      "phases": ["BAR OVER HIPS", "DRIVE HEELS", "HIP EXTENSION", "CONTROLLED DESCENT"]
    },
    "cable_glute_kickback": {
      "animation": "lunge",
      "category": "Glutes",
      "equipment": "cable_station",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings"],
      "phases": ["ANKLE STRAP ATTACHED", "KICK LEG BACKWARD & UP", "PEAK GLUTE CONTRACTION", "SLOW CONTROLLED RETURN"]
    },
    "leg_extension": {
      "animation": "leg_extension",
      "category": "Legs",
      "equipment": "flat_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Quadriceps (Rectus Femoris & Vasti)"],
      "secondary_muscles": ["Patellar Tendon"],
      "phases": ["90° SEATED KNEE FLEXION", "EXTEND SHINS TO HORIZONTAL", "FULL QUAD LOCKOUT & SQUEEZE", "CONTROLLED 3-SEC DESCENT"]
    },
    "leg_curl": {
      "animation": "leg_curl",
      "category": "Legs",
      "equipment": "flat_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Hamstrings (Biceps Femoris, Semitendinosus)"],
      "secondary_muscles": ["Gastrocnemius", "Gracilis"],
      "phases": ["LEGS EXTENDED", "FLEX KNEES PULLING HEELS TO GLUTES", "PEAK HAMSTRING SQUEEZE", "CONTROLLED RETURN"]
    },
    "seated_leg_curl": {
      "animation": "leg_curl",
      "category": "Hamstrings",
      "equipment": "flat_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Hamstrings"],
      "secondary_muscles": ["Calves"],
      "phases": ["SEATED UNDER PAD", "PULL HEELS UNDER SEAT", "PEAK CONTRACTION", "SLOW CONTROLLED EXTENSION"]
    },
    "calf_raises": {
      "animation": "calf_raises",
      "category": "Legs",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Gastrocnemius", "Soleus (Calves)"],
      "secondary_muscles": ["Tibialis Posterior", "Plantaris"],
      "phases": ["BALLS OF FEET GROUNDED", "MAXIMAL PLANTARFLEXION ELEVATION", "PEAK CALF SQUEEZE", "DEEP STRETCH AT BOTTOM"]
    },
    "standing_barbell_calf_raise": {
      "animation": "calf_raises",
      "category": "Calves",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Gastrocnemius"],
      "secondary_muscles": ["Soleus"],
      "phases": ["BAR ON TRAPS", "DRIVE ONTO TOES", "PEAK CALF SQUEEZE", "SLOW LOWERING"]
    },
    "seated_calf_raise": {
      "animation": "calf_raises",
      "category": "Calves",
      "equipment": "flat_bench",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Soleus (Deep Calf Muscle)"],
      "secondary_muscles": ["Achilles Tendon"],
      "phases": ["SEATED WITH PAD ON THIGHS", "ELEVATE HEELS TO MAXIMUM", "PEAK SOLEUS SQUEEZE", "FULL ECCENTRIC DROP"]
    },
    "single_leg_dumbbell_calf_raise": {
      "animation": "calf_raises",
      "category": "Calves",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Gastrocnemius", "Ankle Stabilizers"],
      "secondary_muscles": ["Soleus"],
      "phases": ["ONE FOOT BALANCED", "DRIVE TO BALL OF FOOT", "PEAK CONTRACTION", "DEEP HEEL STRETCH"]
    },
    "wall_sit": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Quadriceps (Isometric)"],
      "secondary_muscles": ["Glutes", "Calves"],
      "phases": ["BACK FLAT TO WALL", "THIGHS PARALLEL TO FLOOR", "90° KNEE HOLD", "STEADY BREATHING"]
    },
    "sissy_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Quadriceps (Rectus Femoris Isolation)"],
      "secondary_muscles": ["Core", "Calves"],
      "phases": ["LEAN TORSO BACK", "KNEES TRAVEL FORWARD ON TOES", "DEEP QUAD STRETCH", "DRIVE BACK TO STAND"]
    },

    // ── CORE & ABDOMINAL MOVEMENTS ──
    "plank": {
      "animation": "plank",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Rectus Abdominis", "Transverse Abdominis"],
      "secondary_muscles": ["Glutes", "Shoulders", "Quadriceps"],
      "phases": ["FOREARM ALIGNMENT", "PELVIC TUCK", "STEADY ISOMETRIC BRACE", "NEUTRAL BREATHING"]
    },
    "side_plank": {
      "animation": "side_plank",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "front_3_4", "distance": 2.7, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Internal & External Obliques", "Quadratus Lumborum"],
      "secondary_muscles": ["Gluteus Medius", "Deltoids", "Transverse Abdominis"],
      "phases": ["LATERAL FOREARM BASE", "ELEVATE PELVIS IN RIGID LINE", "ISOMETRIC CORE TENSION", "CONTROLLED LOWER"]
    },
    "crunches": {
      "animation": "crunches",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.6, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Rectus Abdominis (Upper Abdominals)"],
      "secondary_muscles": ["Transverse Abdominis", "Obliques"],
      "phases": ["SUPINE START & KNEES BENT", "CURL THORACIC SPINE 30°", "PEAK ABDOMINAL SQUEEZE", "SLOW RETURN WITHOUT RESTING"]
    },
    "leg_raises": {
      "animation": "leg_raises",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Lower Rectus Abdominis", "Hip Flexors (Iliopsoas)"],
      "secondary_muscles": ["Transverse Abdominis", "Quadriceps"],
      "phases": ["SUPINE POSITION & LOWER BACK FLAT", "RAISE STRAIGHT LEGS TO 90°", "LIFT PELVIS SLIGHTLY AT TOP", "LOWER TO HOVER ABOVE MAT"]
    },
    "hanging_leg_raise": {
      "animation": "leg_raises",
      "category": "Core",
      "equipment": "pullup_tower",
      "camera": { "preset": "front_3_4", "distance": 3.0, "fov": 45, "targetY": 1.0 },
      "primary_muscles": ["Lower Abdominals", "Hip Flexors"],
      "secondary_muscles": ["Forearms (Grip)", "Lats"],
      "phases": ["DEAD HANG STANCE", "RAISE LEGS TO HORIZONTAL", "POSTERIOR PELVIC TILT", "SLOW CONTROLLED LOWERING"]
    },
    "russian_twists": {
      "animation": "russian_twists",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "front_3_4", "distance": 2.7, "fov": 45, "targetY": 0.45 },
      "primary_muscles": ["Internal & External Obliques"],
      "secondary_muscles": ["Rectus Abdominis", "Hip Flexors"],
      "phases": ["45° V-SIT & FEET ELEVATED", "ROTATE TORSO DYNAMICALLY LEFT", "ROTATE TORSO DYNAMICALLY RIGHT", "MAINTAIN CORE BRACE"]
    },
    "bicycle_crunches": {
      "animation": "russian_twists",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.6, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Obliques", "Rectus Abdominis"],
      "secondary_muscles": ["Hip Flexors"],
      "phases": ["OPPOSITE ELBOW TO KNEE", "ALTERNATING ROTATION", "FULL EXTENSION OF OPPOSITE LEG", "CONTINUOUS CORE FLOW"]
    },
    "ab_wheel_rollout": {
      "animation": "ab_wheel_rollout",
      "category": "Core",
      "equipment": "ab_roller",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Rectus Abdominis", "Transverse Abdominis (Anti-Extension)"],
      "secondary_muscles": ["Latissimus Dorsi", "Shoulders", "Chest"],
      "phases": ["KNEELING AT WHEEL", "ROLL FORWARD EXTENDING TORSO", "HOVER ABOVE FLOOR", "PULL BACK WITH ABS"]
    },
    "mountain_climbers": {
      "animation": "mountain_climbers",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Rectus Abdominis", "Hip Flexors", "Cardiovascular"],
      "secondary_muscles": ["Shoulders", "Quadriceps", "Calves"],
      "phases": ["HIGH PLANK BASE", "DRIVE RIGHT KNEE TO CHEST", "DRIVE LEFT KNEE TO CHEST", "RAPID RHYTHMIC CADENCE"]
    },
    "cable_woodchopper": {
      "animation": "russian_twists",
      "category": "Core",
      "equipment": "cable_station",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Obliques (Rotational Power)"],
      "secondary_muscles": ["Shoulders", "Core Stabilizers"],
      "phases": ["HIGH CABLE STANCE", "CHOP DIAGONALLY DOWNWARD", "PIVOT BACK FOOT", "CONTROLLED RESET"]
    },
    "hollow_body_hold": {
      "animation": "plank",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Transverse Abdominis", "Rectus Abdominis"],
      "secondary_muscles": ["Hip Flexors", "Quads"],
      "phases": ["LOWER BACK GLUED TO FLOOR", "ARMS & LEGS EXTENDED HOVERING", "BANANA SHAPED ISOMETRIC HOLD", "DEEP CORE BRACE"]
    },

    // ── FUNCTIONAL, CARDIO & FULL BODY ──
    "kettlebell_swing": {
      "animation": "kettlebell_swing",
      "category": "Full Body",
      "equipment": "kettlebell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Gluteus Maximus", "Hamstrings (Posterior Chain Power)"],
      "secondary_muscles": ["Erector Spinae", "Shoulders", "Core", "Forearms"],
      "phases": ["HIP HINGE & HIKE BACK", "EXPLOSIVE GLUTE SNAP", "FLOAT KETTLEBELL TO CHEST HEIGHT", "ABSORB INTO HINGE"]
    },
    "kettlebell_sumo_deadlift": {
      "animation": "deadlift",
      "category": "Legs",
      "equipment": "kettlebell",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Adductors", "Glutes", "Hamstrings"],
      "secondary_muscles": ["Quadriceps", "Lower Back"],
      "phases": ["WIDE SUMO STANCE", "HINGE & GRASP KETTLEBELL", "DRIVE THROUGH HEELS TO STAND", "LOWER TO FLOOR"]
    },
    "dumbbell_thrusters": {
      "animation": "thrusters",
      "category": "Full Body",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 3.0, "fov": 45, "targetY": 0.90 },
      "primary_muscles": ["Quadriceps", "Anterior Deltoids", "Glutes"],
      "secondary_muscles": ["Triceps", "Core", "Cardiovascular"],
      "phases": ["RACK AT SHOULDERS", "DEEP FRONT SQUAT", "EXPLODE UP FROM SQUAT", "PRESS FLUIDLY OVERHEAD"]
    },
    "barbell_clean_and_press": {
      "animation": "thrusters",
      "category": "Full Body",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 3.1, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Total Body Power", "Deltoids", "Hamstrings"],
      "secondary_muscles": ["Glutes", "Triceps", "Traps"],
      "phases": ["PULL FROM FLOOR", "EXPLOSIVE TRIPLE EXTENSION CLEAN", "RACK AT SHOULDERS", "PUSH PRESS OVERHEAD"]
    },
    "burpees": {
      "animation": "burpees",
      "category": "Cardio",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Full Body Anaerobic", "Chest", "Quads"],
      "secondary_muscles": ["Shoulders", "Core", "Calves"],
      "phases": ["DROP TO PLANK", "CHEST TO FLOOR PUSH-UP", "JUMP FEET TO HANDS", "VERTICAL EXPLOSIVE JUMP"]
    },
    "box_jumps": {
      "animation": "squat",
      "category": "Full Body",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Fast-Twitch Quadriceps", "Glutes", "Calves"],
      "secondary_muscles": ["Hamstrings", "Core"],
      "phases": ["ATHLETIC LOADING QUARTER SQUAT", "EXPLOSIVE TRIPLE EXTENSION", "SOFT LANDING ON BOX", "STEP DOWN SAFELY"]
    },
    "jump_rope": {
      "animation": "jump_rope",
      "category": "Cardio",
      "equipment": "studio_floor",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Gastrocnemius & Soleus (Calves)", "Cardiovascular"],
      "secondary_muscles": ["Forearms", "Shoulders", "Core"],
      "phases": ["SPRING ON BALLS OF FEET", "WRIST ROTATION", "LOW CLEARANCE HOVER", "STEADY AEROBIC TEMPO"]
    },
    "battle_ropes": {
      "animation": "shoulder_press",
      "category": "Full Body",
      "equipment": "studio_floor",
      "camera": { "preset": "front_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Shoulders", "Arms", "Core Power"],
      "secondary_muscles": ["Glutes", "Quads"],
      "phases": ["QUARTER SQUAT BRACE", "ALTERNATING SLAM WAVES", "CONTINUOUS HIGH CADENCE", "CORE ROTATIONAL RESISTANCE"]
    },
    "rowing_machine_intervals": {
      "animation": "seated_cable_row",
      "category": "Cardio",
      "equipment": "cable_row_station",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.65 },
      "primary_muscles": ["Back", "Hamstrings", "Cardiovascular"],
      "secondary_muscles": ["Quads", "Biceps", "Core"],
      "phases": ["CATCH PHASE (COMPRESSED)", "DRIVE PHASE (LEG EXTENSION)", "FINISH (ROW TO STERNUM)", "RECOVERY SLIDE"]
    },

    // ── 20 YOGA & MOBILITY ASANAS (Complete System) ──
    "mountain_pose": {
      "animation": "yoga_mountain",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Spinal Erectors", "Quadriceps", "Core"],
      "secondary_muscles": ["Calves", "Glutes", "Shoulders"],
      "phases": ["FEET GROUNDED", "ENGAGE THIGHS & CORE", "ROLL SHOULDERS BACK", "STEADY PRANAYAMA"]
    },
    "childs_pose": {
      "animation": "yoga_childs_pose",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.6, "fov": 45, "targetY": 0.30 },
      "primary_muscles": ["Lower Back (Erector Spinae)", "Hips", "Glutes"],
      "secondary_muscles": ["Shoulders", "Ankles"],
      "phases": ["KNEEL & BIG TOES TOUCH", "HIPS SINK TO HEELS", "REACH ARMS FORWARD", "REST FOREHEAD TO MAT"]
    },
    "child_s_pose": {
      "animation": "yoga_childs_pose",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.6, "fov": 45, "targetY": 0.30 },
      "primary_muscles": ["Lower Back", "Hips", "Glutes"],
      "secondary_muscles": ["Shoulders", "Ankles"],
      "phases": ["KNEEL & BIG TOES TOUCH", "HIPS SINK TO HEELS", "REACH ARMS FORWARD", "REST FOREHEAD TO MAT"]
    },
    "cat_cow": {
      "animation": "yoga_cat_cow",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.45 },
      "primary_muscles": ["Entire Spinal Column", "Core"],
      "secondary_muscles": ["Neck", "Shoulders", "Pelvis"],
      "phases": ["TABLETOP POSE", "INHALE: COW (ARCH SPINE)", "EXHALE: CAT (ROUND SPINE)", "SYNCHRONIZE FLOW"]
    },
    "cat_cow_stretch": {
      "animation": "yoga_cat_cow",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.45 },
      "primary_muscles": ["Entire Spinal Column", "Core"],
      "secondary_muscles": ["Neck", "Shoulders", "Pelvis"],
      "phases": ["TABLETOP POSE", "INHALE: COW (ARCH SPINE)", "EXHALE: CAT (ROUND SPINE)", "SYNCHRONIZE FLOW"]
    },
    "downward_dog": {
      "animation": "yoga_downward_dog",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Hamstrings", "Calves", "Shoulders", "Spine"],
      "secondary_muscles": ["Lats", "Wrists", "Core"],
      "phases": ["INVERTED V-SHAPE", "PRESS HEELS DOWN", "LENGTHEN SPINE", "DEEP PRANAYAMA BREATH"]
    },
    "downward_facing_dog": {
      "animation": "yoga_downward_dog",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.55 },
      "primary_muscles": ["Hamstrings", "Calves", "Shoulders", "Spine"],
      "secondary_muscles": ["Lats", "Wrists", "Core"],
      "phases": ["INVERTED V-SHAPE", "PRESS HEELS DOWN", "LENGTHEN SPINE", "DEEP PRANAYAMA BREATH"]
    },
    "cobra_pose": {
      "animation": "yoga_cobra",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.6, "fov": 45, "targetY": 0.30 },
      "primary_muscles": ["Erector Spinae", "Chest (Pectorals)"],
      "secondary_muscles": ["Abdominals", "Shoulders", "Glutes"],
      "phases": ["PRONE POSITION", "PALMS UNDER SHOULDERS", "GENTLY LIFT CHEST", "OPEN HEART & BREATHE"]
    },
    "upward_facing_dog": {
      "animation": "yoga_upward_dog",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Erector Spinae", "Chest", "Triceps"],
      "secondary_muscles": ["Quadriceps", "Wrists", "Shoulders"],
      "phases": ["TOPS OF FEET ON MAT", "STRAIGHTEN ARMS", "THIGHS LIFTED", "COLLARBONE BROAD"]
    },
    "warrior_i": {
      "animation": "yoga_warrior_i",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 3.0, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Quadriceps", "Glutes", "Hip Flexors"],
      "secondary_muscles": ["Deltoids", "Upper Back", "Core"],
      "phases": ["SQUARE HIPS FORWARD", "90° FRONT KNEE BEND", "SWEEP ARMS OVERHEAD", "LIFT STERNUM"]
    },
    "warrior_ii": {
      "animation": "yoga_warrior_ii",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Quadriceps", "Glutes", "Hip Flexors"],
      "secondary_muscles": ["Deltoids", "Core", "Ankles"],
      "phases": ["WIDE STANCE", "90° FRONT KNEE BEND", "EXTEND ARMS HORIZONTALLY", "GAZE OVER FRONT FINGER"]
    },
    "triangle_pose": {
      "animation": "yoga_triangle",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Hamstrings", "Obliques", "Adductors"],
      "secondary_muscles": ["Deltoids", "Spine", "Ankles"],
      "phases": ["WIDE LEGS & STRAIGHT KNEES", "LATERAL HIP HINGE", "STACK SHOULDERS VERTICALLY", "GAZE UP TO TOP HAND"]
    },
    "tree_pose": {
      "animation": "yoga_tree",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Ankle Stabilizers", "Adductors", "Glutes"],
      "secondary_muscles": ["Core", "Deltoids", "Hip Rotators"],
      "phases": ["ROOT STANDING FOOT", "PLACE SOLE ON INNER THIGH", "HANDS IN ANJALI MUDRA", "FIND DRISHTI FOCUS"]
    },
    "chair_pose": {
      "animation": "yoga_chair",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Spinal Erectors", "Deltoids", "Calves"],
      "phases": ["SINK HIPS BACK", "THIGHS TOWARD PARALLEL", "REACH ARMS BICEPS BY EARS", "DRAW NAVEL TO SPINE"]
    },
    "bridge_pose": {
      "animation": "yoga_bridge",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Gluteus Maximus", "Hamstrings"],
      "secondary_muscles": ["Lower Back", "Quadriceps", "Chest"],
      "phases": ["FEET FLAT UNDER KNEES", "DRIVE THROUGH HEELS", "LIFT PELVIS TO CEILING", "INTERLACE HANDS UNDER BACK"]
    },
    "boat_pose": {
      "animation": "yoga_boat",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.45 },
      "primary_muscles": ["Rectus Abdominis", "Hip Flexors"],
      "secondary_muscles": ["Erector Spinae", "Quadriceps"],
      "phases": ["BALANCE ON SIT BONES", "LIFT SHINS PARALLEL TO FLOOR", "REACH ARMS FORWARD", "LIFT CHEST TALL"]
    },
    "seated_forward_fold": {
      "animation": "yoga_seated_forward_fold",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.6, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Hamstrings", "Erector Spinae"],
      "secondary_muscles": ["Calves", "Glutes"],
      "phases": ["LEGS EXTENDED STRAIGHT", "INHALE: LENGTHEN SPINE", "EXHALE: HINGE AT HIPS", "REACH FOR FEET"]
    },
    "butterfly_pose": {
      "animation": "yoga_butterfly",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 2.6, "fov": 45, "targetY": 0.40 },
      "primary_muscles": ["Adductors (Inner Thighs)", "Groin"],
      "secondary_muscles": ["Hips", "Lower Back"],
      "phases": ["SOLES OF FEET TOGETHER", "KNEES DROP WIDE", "TALL SPINE", "GENTLE FORWARD HINGE"]
    },
    "low_lunge": {
      "animation": "yoga_low_lunge",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Hip Flexors (Psoas)", "Quadriceps"],
      "secondary_muscles": ["Glutes", "Hamstrings", "Chest"],
      "phases": ["BACK KNEE DOWN", "FRONT KNEE OVER ANKLE", "SWEEP ARMS UPWARD", "SINK HIPS FORWARD"]
    },
    "crescent_lunge": {
      "animation": "yoga_crescent_lunge",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps", "Glutes", "Hip Flexors"],
      "secondary_muscles": ["Calves", "Deltoids", "Core"],
      "phases": ["HIGH BACK HEEL", "FRONT KNEE AT 90°", "TORSO VERTICAL", "ARMS EXTENDED OVERHEAD"]
    },
    "corpse_pose": {
      "animation": "yoga_corpse",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.6, "fov": 45, "targetY": 0.25 },
      "primary_muscles": ["Total Body Relaxation"],
      "secondary_muscles": ["Nervous System Reset"],
      "phases": ["LIE FLAT ON BACK", "ARMS RELAXED AT SIDES", "CLOSE EYES", "DEEP RESTORATIVE BREATH"]
    },
    "dynamic_chest_stretch": {
      "animation": "chest_fly",
      "category": "Mobility",
      "equipment": "studio_floor",
      "camera": { "preset": "front_3_4", "distance": 2.7, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Pectorals", "Anterior Deltoids"],
      "secondary_muscles": ["Thoracic Spine"],
      "phases": ["STAND TALL", "OPEN ARMS WIDE", "HUG CHEST", "FLUID TEMPO"]
    },
    "worlds_greatest_stretch": {
      "animation": "yoga_low_lunge",
      "category": "Mobility",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.60 },
      "primary_muscles": ["Hip Flexors", "Thoracic Spine", "Hamstrings"],
      "secondary_muscles": ["Glutes", "Shoulders"],
      "phases": ["DEEP RUNNER'S LUNGE", "INSIDE ELBOW TO MAT", "THORACIC ROTATION SKYWARD", "HAMSTRING EXTENSION"]
    },
    "hamstring_dynamic_sweep": {
      "animation": "deadlift",
      "category": "Mobility",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.70 },
      "primary_muscles": ["Hamstrings", "Calves"],
      "secondary_muscles": ["Lower Back"],
      "phases": ["HEEL OUT FRONT", "SWEEP ARMS TO FLOOR", "STAND TALL", "ALTERNATE SIDES"]
    },
    "thoracic_spine_rotations": {
      "animation": "yoga_cat_cow",
      "category": "Mobility",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.45 },
      "primary_muscles": ["Thoracic Spine (Mobility)"],
      "secondary_muscles": ["Rhomboids", "Neck"],
      "phases": ["QUADRUPED POSITION", "HAND BEHIND HEAD", "ROTATE ELBOW TO CEILING", "RETURN FLUIDLY"]
    }
  };

  /**
   * Resolve best 3D configuration for an exercise record or slug
   */
  function getExercise3DConfig(exerciseOrSlug) {
    if (!exerciseOrSlug) return null;
    let slug = '';
    if (typeof exerciseOrSlug === 'string') {
      slug = exerciseOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    } else if (typeof exerciseOrSlug === 'object') {
      slug = (exerciseOrSlug.slug || exerciseOrSlug.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }

    if (EXERCISE_3D_CONFIG[slug]) {
      return { ...EXERCISE_3D_CONFIG[slug], matched_slug: slug };
    }

    // ── Exact & Keyword Yoga Matchers ──
    if (slug.includes('mountain') || slug.includes('tadasana')) return { ...EXERCISE_3D_CONFIG['mountain_pose'], matched_slug: 'mountain_pose' };
    if (slug.includes('child') || slug.includes('balasana')) return { ...EXERCISE_3D_CONFIG['childs_pose'], matched_slug: 'childs_pose' };
    if (slug.includes('cat') || slug.includes('cow') || slug.includes('marjaryasana')) return { ...EXERCISE_3D_CONFIG['cat_cow'], matched_slug: 'cat_cow' };
    if (slug.includes('downward') || slug.includes('adho_mukha')) return { ...EXERCISE_3D_CONFIG['downward_dog'], matched_slug: 'downward_dog' };
    if (slug.includes('cobra') || slug.includes('bhujangasana')) return { ...EXERCISE_3D_CONFIG['cobra_pose'], matched_slug: 'cobra_pose' };
    if (slug.includes('upward') || slug.includes('urdhva')) return { ...EXERCISE_3D_CONFIG['upward_facing_dog'], matched_slug: 'upward_facing_dog' };
    if (slug.includes('warrior_i') || slug.includes('warrior_1')) return { ...EXERCISE_3D_CONFIG['warrior_i'], matched_slug: 'warrior_i' };
    if (slug.includes('warrior_ii') || slug.includes('warrior_2') || slug.includes('warrior')) return { ...EXERCISE_3D_CONFIG['warrior_ii'], matched_slug: 'warrior_ii' };
    if (slug.includes('triangle') || slug.includes('trikonasana')) return { ...EXERCISE_3D_CONFIG['triangle_pose'], matched_slug: 'triangle_pose' };
    if (slug.includes('tree') || slug.includes('vrikshasana') || slug.includes('vrksasana')) return { ...EXERCISE_3D_CONFIG['tree_pose'], matched_slug: 'tree_pose' };
    if (slug.includes('chair') || slug.includes('utkatasana')) return { ...EXERCISE_3D_CONFIG['chair_pose'], matched_slug: 'chair_pose' };
    if (slug.includes('bridge') || slug.includes('setu')) return { ...EXERCISE_3D_CONFIG['bridge_pose'], matched_slug: 'bridge_pose' };
    if (slug.includes('boat') || slug.includes('navasana')) return { ...EXERCISE_3D_CONFIG['boat_pose'], matched_slug: 'boat_pose' };
    if (slug.includes('seated_forward') || slug.includes('paschimottanasana')) return { ...EXERCISE_3D_CONFIG['seated_forward_fold'], matched_slug: 'seated_forward_fold' };
    if (slug.includes('butterfly') || slug.includes('baddha')) return { ...EXERCISE_3D_CONFIG['butterfly_pose'], matched_slug: 'butterfly_pose' };
    if (slug.includes('low_lunge') || slug.includes('anjaneyasana')) return { ...EXERCISE_3D_CONFIG['low_lunge'], matched_slug: 'low_lunge' };
    if (slug.includes('crescent') || slug.includes('high_lunge')) return { ...EXERCISE_3D_CONFIG['crescent_lunge'], matched_slug: 'crescent_lunge' };
    if (slug.includes('side_plank') || slug.includes('vasisthasana')) return { ...EXERCISE_3D_CONFIG['side_plank'], matched_slug: 'side_plank' };
    if (slug.includes('corpse') || slug.includes('savasana')) return { ...EXERCISE_3D_CONFIG['corpse_pose'], matched_slug: 'corpse_pose' };

    // ── Dedicated Resistance Movement Matchers ──
    // Chest
    if (slug.includes('fly') || slug.includes('pec_deck') || slug.includes('crossover')) return { ...EXERCISE_3D_CONFIG['chest_fly'], matched_slug: 'chest_fly' };
    if (slug.includes('bench') && slug.includes('incline')) return { ...EXERCISE_3D_CONFIG['incline_bench_press'], matched_slug: 'incline_bench_press' };
    if (slug.includes('bench') && slug.includes('decline')) return { ...EXERCISE_3D_CONFIG['decline_barbell_bench_press'], matched_slug: 'decline_barbell_bench_press' };
    if (slug.includes('bench') && slug.includes('dumbbell')) return { ...EXERCISE_3D_CONFIG['dumbbell_bench_press'], matched_slug: 'dumbbell_bench_press' };
    if (slug.includes('bench') && slug.includes('close')) return { ...EXERCISE_3D_CONFIG['close_grip_bench_press'], matched_slug: 'close_grip_bench_press' };
    if (slug.includes('bench') || slug.includes('chest_press') || slug.includes('floor_press')) return { ...EXERCISE_3D_CONFIG['bench_press'], matched_slug: 'bench_press' };
    if (slug.includes('push_up') || slug.includes('pushup')) return { ...EXERCISE_3D_CONFIG['push_up'], matched_slug: 'push_up' };
    if (slug.includes('dip') || slug.includes('dips')) return { ...EXERCISE_3D_CONFIG['dips'], matched_slug: 'dips' };

    // Back
    if (slug.includes('lat') || slug.includes('pulldown') || slug.includes('pull_down')) return { ...EXERCISE_3D_CONFIG['lat_pulldown'], matched_slug: 'lat_pulldown' };
    if (slug.includes('pull_up') || slug.includes('pullup') || slug.includes('chin_up') || slug.includes('chinup')) return { ...EXERCISE_3D_CONFIG['pull_up'], matched_slug: 'pull_up' };
    if (slug.includes('dead_hang') || slug.includes('hang')) return { ...EXERCISE_3D_CONFIG['dead_hang'], matched_slug: 'dead_hang' };
    if (slug.includes('seated') && slug.includes('row')) return { ...EXERCISE_3D_CONFIG['seated_cable_row'], matched_slug: 'seated_cable_row' };
    if (slug.includes('straight_arm_pull') || slug.includes('straight_arm')) return { ...EXERCISE_3D_CONFIG['straight_arm_pulldown'], matched_slug: 'straight_arm_pulldown' };
    if (slug.includes('row')) return { ...EXERCISE_3D_CONFIG['bent_over_row'], matched_slug: 'bent_over_row' };
    if (slug.includes('shrug')) return { ...EXERCISE_3D_CONFIG['barbell_shrug'], matched_slug: 'barbell_shrug' };
    if (slug.includes('deadlift')) return { ...EXERCISE_3D_CONFIG['deadlift'], matched_slug: 'deadlift' };

    // Shoulders
    if (slug.includes('arnold')) return { ...EXERCISE_3D_CONFIG['arnold_press'], matched_slug: 'arnold_press' };
    if (slug.includes('lateral_raise') || slug.includes('side_raise') || slug.includes('lat_raise')) return { ...EXERCISE_3D_CONFIG['lateral_raise'], matched_slug: 'lateral_raise' };
    if (slug.includes('front_raise')) return { ...EXERCISE_3D_CONFIG['dumbbell_front_raise'], matched_slug: 'dumbbell_front_raise' };
    if (slug.includes('reverse_fly') || slug.includes('rear_delt')) return { ...EXERCISE_3D_CONFIG['reverse_fly'], matched_slug: 'reverse_fly' };
    if (slug.includes('face_pull')) return { ...EXERCISE_3D_CONFIG['face_pull'], matched_slug: 'face_pull' };
    if (slug.includes('upright_row')) return { ...EXERCISE_3D_CONFIG['upright_row'], matched_slug: 'upright_row' };
    if (slug.includes('shoulder') || slug.includes('overhead_press') || slug.includes('military_press') || slug.includes('landmine')) return { ...EXERCISE_3D_CONFIG['shoulder_press'], matched_slug: 'shoulder_press' };

    // Biceps & Forearms
    if (slug.includes('hammer_curl') || slug.includes('hammer')) return { ...EXERCISE_3D_CONFIG['hammer_curl'], matched_slug: 'hammer_curl' };
    if (slug.includes('preacher') || slug.includes('spider')) return { ...EXERCISE_3D_CONFIG['preacher_curl'], matched_slug: 'preacher_curl' };
    if (slug.includes('concentration')) return { ...EXERCISE_3D_CONFIG['concentration_curl'], matched_slug: 'concentration_curl' };
    if (slug.includes('incline') && slug.includes('curl')) return { ...EXERCISE_3D_CONFIG['incline_dumbbell_curl'], matched_slug: 'incline_dumbbell_curl' };
    if (slug.includes('wrist_curl')) return { ...EXERCISE_3D_CONFIG['wrist_curls'], matched_slug: 'wrist_curls' };
    if (slug.includes('farmer') || slug.includes('pinch_hold')) return { ...EXERCISE_3D_CONFIG['farmers_walk'], matched_slug: 'farmers_walk' };
    if (slug.includes('curl') && !slug.includes('leg')) return { ...EXERCISE_3D_CONFIG['bicep_curl'], matched_slug: 'bicep_curl' };

    // Triceps
    if (slug.includes('skull_crusher') || slug.includes('skullcrusher')) return { ...EXERCISE_3D_CONFIG['skull_crushers'], matched_slug: 'skull_crushers' };
    if (slug.includes('kickback')) return { ...EXERCISE_3D_CONFIG['dumbbell_tricep_kickback'], matched_slug: 'dumbbell_tricep_kickback' };
    if (slug.includes('overhead') && slug.includes('tricep')) return { ...EXERCISE_3D_CONFIG['dumbbell_overhead_extension'], matched_slug: 'dumbbell_overhead_extension' };
    if (slug.includes('pushdown') || slug.includes('tricep_extension') || slug.includes('tricep')) return { ...EXERCISE_3D_CONFIG['cable_pushdown'], matched_slug: 'cable_pushdown' };

    // Legs & Glutes
    if (slug.includes('thrust') || slug.includes('glute_bridge')) return { ...EXERCISE_3D_CONFIG['hip_thrust'], matched_slug: 'hip_thrust' };
    if (slug.includes('leg_extension') || slug.includes('quad_extension')) return { ...EXERCISE_3D_CONFIG['leg_extension'], matched_slug: 'leg_extension' };
    if (slug.includes('leg_curl') || slug.includes('hamstring_curl')) return { ...EXERCISE_3D_CONFIG['leg_curl'], matched_slug: 'leg_curl' };
    if (slug.includes('calf')) return { ...EXERCISE_3D_CONFIG['calf_raises'], matched_slug: 'calf_raises' };
    if (slug.includes('lunge') || slug.includes('split_squat')) return { ...EXERCISE_3D_CONFIG['lunges'], matched_slug: 'lunges' };
    if (slug.includes('squat') || slug.includes('leg_press') || slug.includes('wall_sit')) return { ...EXERCISE_3D_CONFIG['squat'], matched_slug: 'squat' };

    // Core
    if (slug.includes('twist')) return { ...EXERCISE_3D_CONFIG['russian_twists'], matched_slug: 'russian_twists' };
    if (slug.includes('crunch') || slug.includes('situp') || slug.includes('sit_up')) return { ...EXERCISE_3D_CONFIG['crunches'], matched_slug: 'crunches' };
    if (slug.includes('leg_raise') || slug.includes('hanging_leg')) return { ...EXERCISE_3D_CONFIG['leg_raises'], matched_slug: 'leg_raises' };
    if (slug.includes('ab_wheel') || slug.includes('rollout')) return { ...EXERCISE_3D_CONFIG['ab_wheel_rollout'], matched_slug: 'ab_wheel_rollout' };
    if (slug.includes('climber')) return { ...EXERCISE_3D_CONFIG['mountain_climbers'], matched_slug: 'mountain_climbers' };
    if (slug.includes('plank')) return { ...EXERCISE_3D_CONFIG['plank'], matched_slug: 'plank' };

    // Full Body & Cardio
    if (slug.includes('swing') || slug.includes('kettlebell')) return { ...EXERCISE_3D_CONFIG['kettlebell_swing'], matched_slug: 'kettlebell_swing' };
    if (slug.includes('thruster') || slug.includes('clean_and_press')) return { ...EXERCISE_3D_CONFIG['dumbbell_thrusters'], matched_slug: 'dumbbell_thrusters' };
    if (slug.includes('burpee')) return { ...EXERCISE_3D_CONFIG['burpees'], matched_slug: 'burpees' };
    if (slug.includes('jump_rope') || slug.includes('skipping')) return { ...EXERCISE_3D_CONFIG['jump_rope'], matched_slug: 'jump_rope' };

    // Generic category fallback
    const cat = typeof exerciseOrSlug === 'object' ? (exerciseOrSlug.category || '').toLowerCase() : '';
    if (cat.includes('chest')) return { ...EXERCISE_3D_CONFIG['bench_press'], matched_slug: 'bench_press' };
    if (cat.includes('back')) return { ...EXERCISE_3D_CONFIG['lat_pulldown'], matched_slug: 'lat_pulldown' };
    if (cat.includes('bicep') || cat.includes('arm')) return { ...EXERCISE_3D_CONFIG['bicep_curl'], matched_slug: 'bicep_curl' };
    if (cat.includes('tricep')) return { ...EXERCISE_3D_CONFIG['cable_pushdown'], matched_slug: 'cable_pushdown' };
    if (cat.includes('shoulder')) return { ...EXERCISE_3D_CONFIG['shoulder_press'], matched_slug: 'shoulder_press' };
    if (cat.includes('leg') || cat.includes('glute') || cat.includes('hamstring') || cat.includes('calf')) return { ...EXERCISE_3D_CONFIG['squat'], matched_slug: 'squat' };
    if (cat.includes('core')) return { ...EXERCISE_3D_CONFIG['plank'], matched_slug: 'plank' };
    if (cat.includes('yoga') || cat.includes('mobility')) return { ...EXERCISE_3D_CONFIG['downward_dog'], matched_slug: 'downward_dog' };

    return { ...EXERCISE_3D_CONFIG['squat'], matched_slug: 'squat' };
  }

  window.EXERCISE_3D_CONFIG = EXERCISE_3D_CONFIG;
  window.getExercise3DConfig = getExercise3DConfig;

})(window);

