/**
 * FitSync AI — 3D Exercise & Yoga Demonstration Configuration
 * Links exercise slugs, categories, equipment, camera presets, and anatomical targets.
 */
(function(window) {
  'use strict';

  const EXERCISE_3D_CONFIG = {
    // ── CORE FIRST 10 FLAGSHIP RESISTANCE MOVEMENTS ──
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
      "primary_muscles": ["Upper Chest"],
      "secondary_muscles": ["Shoulders", "Triceps"],
      "phases": ["START POSITION", "CONTROLLED DESCENT", "PEAK SQUEEZE", "CONCENTRIC PRESS"]
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
    "lat_pulldown": {
      "animation": "lat_pulldown",
      "category": "Back",
      "equipment": "lat_pulldown_machine",
      "camera": { "preset": "front_3_4", "distance": 3.1, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Latissimus Dorsi", "Lats"],
      "secondary_muscles": ["Biceps Brachii", "Rhomboids", "Middle Trapezius"],
      "phases": ["FULL OVERHEAD REACH", "SCAPULAR RETRACTION", "PULL TO CLAVICLE", "CONTROLLED ECCENTRIC"]
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
    "bicep_curl": {
      "animation": "bicep_curl",
      "category": "Arms",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Biceps Brachii (Short & Long Heads)"],
      "secondary_muscles": ["Brachialis", "Brachioradialis", "Forearm Flexors"],
      "phases": ["FULL EXTENSION", "SUPINATED CURL", "PEAK BICEP CONTRACTION", "3-SEC ECCENTRIC"]
    },
    "barbell_curl": {
      "animation": "bicep_curl",
      "category": "Arms",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Biceps Brachii"],
      "secondary_muscles": ["Forearms", "Brachialis"],
      "phases": ["ARMS EXTENDED", "CONCENTRIC CURL", "PEAK CONTRACTION", "LOWER SLOWLY"]
    },
    "hammer_curl": {
      "animation": "bicep_curl",
      "category": "Arms",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Brachioradialis", "Brachialis"],
      "secondary_muscles": ["Biceps Brachii"],
      "phases": ["NEUTRAL GRIP", "CURL UPWARD", "SQUEEZE TOP", "CONTROLLED DESCENT"]
    },
    "tricep_pushdown": {
      "animation": "tricep_pushdown",
      "category": "Arms",
      "equipment": "cable_station",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Triceps Brachii (Lateral & Medial Heads)"],
      "secondary_muscles": ["Anconeus", "Forearm Stabilizers"],
      "phases": ["90° ELBOW FLEXION", "DRIVE DOWNWARD", "FULL TRICEP LOCKOUT", "CONTROLLED RESET"]
    },
    "shoulder_press": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.95 },
      "primary_muscles": ["Anterior & Lateral Deltoids"],
      "secondary_muscles": ["Triceps Brachii", "Upper Trapezius", "Clavicular Pectorals"],
      "phases": ["SHOULDER RACK", "VERTICAL PRESS", "OVERHEAD LOCKOUT", "SMOOTH LOWERING"]
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
    "squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "barbell",
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
    "goblet_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.9, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Quadriceps", "Glutes"],
      "secondary_muscles": ["Upper Back", "Core"],
      "phases": ["CHEST HELD WEIGHT", "SIT BETWEEN HIPS", "DEEP SQUAT", "DRIVE UP"]
    },

    // ── ADDITIONAL RESISTANCE & CORE EXERCISES ──
    "deadlift": {
      "animation": "deadlift",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Gluteus Maximus", "Hamstrings", "Erector Spinae"],
      "secondary_muscles": ["Latissimus Dorsi", "Trapezius", "Forearms", "Quadriceps"],
      "phases": ["LOCKED SHINS AT BAR", "LEG DRIVE OFF FLOOR", "HIP HINGE LOCKOUT", "CONTROLLED RETURN"]
    },
    "barbell_deadlift": {
      "animation": "deadlift",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Posterior Chain", "Hamstrings", "Glutes"],
      "secondary_muscles": ["Back", "Core", "Grip"],
      "phases": ["SETUP & HINGE", "PULL SLACK", "STAND TALL", "LOWER TO FLOOR"]
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
    "lunge": {
      "animation": "lunge",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Calves", "Core"],
      "phases": ["FORWARD STRIDE", "90° KNEE DROP", "TORSO UPRIGHT", "PUSH BACK TO START"]
    },
    "walking_lunge": {
      "animation": "lunge",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 3.0, "fov": 45, "targetY": 0.75 },
      "primary_muscles": ["Quads", "Glutes"],
      "secondary_muscles": ["Hamstrings", "Calves"],
      "phases": ["FORWARD STEP", "LOWER BACK KNEE", "DRIVE FORWARD", "CONTINUOUS STRIDE"]
    },
    "pull_up": {
      "animation": "pull_up",
      "category": "Back",
      "equipment": "lat_pulldown_machine",
      "camera": { "preset": "front_3_4", "distance": 3.2, "fov": 45, "targetY": 1.1 },
      "primary_muscles": ["Latissimus Dorsi", "Upper Back"],
      "secondary_muscles": ["Biceps Brachii", "Core", "Posterior Deltoids"],
      "phases": ["DEAD HANG", "ENGAGE LATS", "CHIN OVER BAR", "CONTROLLED LOWERING"]
    },
    "dips": {
      "animation": "tricep_pushdown",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.8, "fov": 45, "targetY": 0.80 },
      "primary_muscles": ["Triceps Brachii", "Lower Pectorals"],
      "secondary_muscles": ["Anterior Deltoids", "Core"],
      "phases": ["TOP SUPPORT", "LOWER TO 90°", "PRESS UPWARD", "LOCKOUT"]
    },
    "lateral_raise": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.85 },
      "primary_muscles": ["Lateral Deltoid"],
      "secondary_muscles": ["Anterior Deltoid", "Trapezius"],
      "phases": ["WEIGHTS AT SIDES", "RAISE TO PARALLEL", "PAUSE AT PEAK", "SLOW LOWERING"]
    },
    "plank": {
      "animation": "plank",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Rectus Abdominis", "Transverse Abdominis"],
      "secondary_muscles": ["Glutes", "Shoulders", "Quadriceps"],
      "phases": ["FOREARM ALIGNMENT", "PELVIC TUCK", "STEADY ISOMETRIC BRACE", "NEUTRAL BREATHING"]
    },
    "crunches": {
      "animation": "plank",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 2.7, "fov": 45, "targetY": 0.35 },
      "primary_muscles": ["Rectus Abdominis"],
      "secondary_muscles": ["Obliques"],
      "phases": ["SUPINE START", "RIB TO PELVIS CRUNCH", "PEAK ABDOMINAL SQUEEZE", "SLOW RETURN"]
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
    "cat_cow": {
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
    "side_plank": {
      "animation": "yoga_side_plank",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 2.8, "fov": 45, "targetY": 0.45 },
      "primary_muscles": ["Obliques", "Transverse Abdominis"],
      "secondary_muscles": ["Deltoids", "Glute Medius", "Lats"],
      "phases": ["STACK FEET & HIPS", "LIFT HIPS IN STRAIGHT LINE", "REACH TOP ARM UP", "HOLD WITH FOCUS"]
    },
    "corpse_pose": {
      "animation": "yoga_corpse",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 2.6, "fov": 45, "targetY": 0.25 },
      "primary_muscles": ["Total Body Relaxation"],
      "secondary_muscles": ["Nervous System Reset"],
      "phases": ["LIE FLAT ON BACK", "ARMS RELAXED AT SIDES", "CLOSE EYES", "DEEP RESTORATIVE BREATH"]
    }
  };

  /**
   * Resolve best 3D configuration for an exercise record or slug
   */
  function getExercise3DConfig(exerciseOrSlug) {
    if (!exerciseOrSlug) return null;
    let slug = '';
    if (typeof exerciseOrSlug === 'string') {
      slug = exerciseOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    } else if (typeof exerciseOrSlug === 'object') {
      slug = (exerciseOrSlug.slug || exerciseOrSlug.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    }

    if (EXERCISE_3D_CONFIG[slug]) {
      return { ...EXERCISE_3D_CONFIG[slug], matched_slug: slug };
    }

    // Exact Yoga Matchers
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

    // Resistance movements keyword heuristics
    if (slug.includes('bench') && slug.includes('incline')) return { ...EXERCISE_3D_CONFIG['incline_bench_press'], matched_slug: 'incline_bench_press' };
    if (slug.includes('bench') && slug.includes('dumbbell')) return { ...EXERCISE_3D_CONFIG['dumbbell_bench_press'], matched_slug: 'dumbbell_bench_press' };
    if (slug.includes('bench')) return { ...EXERCISE_3D_CONFIG['bench_press'], matched_slug: 'bench_press' };
    if (slug.includes('push_up') || slug.includes('pushup')) return { ...EXERCISE_3D_CONFIG['push_up'], matched_slug: 'push_up' };
    if (slug.includes('lat') || slug.includes('pulldown')) return { ...EXERCISE_3D_CONFIG['lat_pulldown'], matched_slug: 'lat_pulldown' };
    if (slug.includes('row') && slug.includes('cable')) return { ...EXERCISE_3D_CONFIG['seated_cable_row'], matched_slug: 'seated_cable_row' };
    if (slug.includes('bicep') || (slug.includes('curl') && !slug.includes('leg'))) return { ...EXERCISE_3D_CONFIG['bicep_curl'], matched_slug: 'bicep_curl' };
    if (slug.includes('tricep') || slug.includes('pushdown')) return { ...EXERCISE_3D_CONFIG['tricep_pushdown'], matched_slug: 'tricep_pushdown' };
    if (slug.includes('shoulder') || slug.includes('overhead')) return { ...EXERCISE_3D_CONFIG['shoulder_press'], matched_slug: 'shoulder_press' };
    if (slug.includes('squat')) return { ...EXERCISE_3D_CONFIG['squat'], matched_slug: 'squat' };
    if (slug.includes('deadlift')) return { ...EXERCISE_3D_CONFIG['deadlift'], matched_slug: 'deadlift' };
    if (slug.includes('lunge')) return { ...EXERCISE_3D_CONFIG['lunge'], matched_slug: 'lunge' };
    if (slug.includes('pull_up') || slug.includes('pullup')) return { ...EXERCISE_3D_CONFIG['pull_up'], matched_slug: 'pull_up' };
    if (slug.includes('plank')) return { ...EXERCISE_3D_CONFIG['plank'], matched_slug: 'plank' };

    // Generic category fallback
    const cat = typeof exerciseOrSlug === 'object' ? (exerciseOrSlug.category || '').toLowerCase() : '';
    if (cat.includes('chest')) return { ...EXERCISE_3D_CONFIG['bench_press'], matched_slug: 'bench_press' };
    if (cat.includes('back')) return { ...EXERCISE_3D_CONFIG['lat_pulldown'], matched_slug: 'lat_pulldown' };
    if (cat.includes('arm')) return { ...EXERCISE_3D_CONFIG['bicep_curl'], matched_slug: 'bicep_curl' };
    if (cat.includes('leg')) return { ...EXERCISE_3D_CONFIG['squat'], matched_slug: 'squat' };
    if (cat.includes('shoulder')) return { ...EXERCISE_3D_CONFIG['shoulder_press'], matched_slug: 'shoulder_press' };
    if (cat.includes('yoga') || cat.includes('mobility')) return { ...EXERCISE_3D_CONFIG['downward_dog'], matched_slug: 'downward_dog' };

    return { ...EXERCISE_3D_CONFIG['squat'], matched_slug: 'squat' };
  }

  window.EXERCISE_3D_CONFIG = EXERCISE_3D_CONFIG;
  window.getExercise3DConfig = getExercise3DConfig;

})(window);
