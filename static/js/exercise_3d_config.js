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
      "camera": { "preset": "side_3_4", "distance": 4.6, "fov": 45, "targetY": 0.8 },
      "primary_muscles": ["Pectoralis Major", "Chest"],
      "secondary_muscles": ["Triceps Brachii", "Anterior Deltoids"],
      "phases": ["RACK START", "DESCENT (ECCENTRIC)", "CHEST CONTACT", "PRESS (CONCENTRIC)"]
    },
    "incline_bench_press": {
      "animation": "incline_bench_press",
      "category": "Chest",
      "equipment": "incline_bench",
      "camera": { "preset": "side_3_4", "distance": 4.6, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Clavicular Pectorals (Upper Chest)"],
      "secondary_muscles": ["Anterior Deltoids", "Triceps Brachii"],
      "phases": ["START POSITION", "CONTROLLED DESCENT", "TOUCH UPPER CHEST", "DRIVE UPWARD"]
    },
    "dumbbell_bench_press": {
      "animation": "dumbbell_bench_press",
      "category": "Chest",
      "equipment": "dumbbell_bench",
      "camera": { "preset": "side_3_4", "distance": 4.5, "fov": 45, "targetY": 0.8 },
      "primary_muscles": ["Pectoralis Major", "Inner Chest"],
      "secondary_muscles": ["Triceps", "Anterior Deltoids", "Rotator Cuff"],
      "phases": ["ARMS EXTENDED", "DEEP STRETCH", "PEAK CHEST SQUEEZE", "CONTROLLED RETURN"]
    },
    "incline_dumbbell_press": {
      "animation": "incline_bench_press",
      "category": "Chest",
      "equipment": "incline_bench",
      "camera": { "preset": "side_3_4", "distance": 4.6, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Upper Chest"],
      "secondary_muscles": ["Shoulders", "Triceps"],
      "phases": ["START POSITION", "CONTROLLED DESCENT", "PEAK SQUEEZE", "CONCENTRIC PRESS"]
    },
    "push_up": {
      "animation": "push_up",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 4.2, "fov": 45, "targetY": 0.5 },
      "primary_muscles": ["Pectoralis Major", "Chest"],
      "secondary_muscles": ["Triceps Brachii", "Anterior Deltoid", "Core Stabilizers"],
      "phases": ["RIGID PLANK", "DESCENT (45° ELBOWS)", "CHEST HOVER", "EXPLOSIVE PUSH"]
    },
    "lat_pulldown": {
      "animation": "lat_pulldown",
      "category": "Back",
      "equipment": "lat_pulldown_machine",
      "camera": { "preset": "front_3_4", "distance": 4.8, "fov": 45, "targetY": 1.1 },
      "primary_muscles": ["Latissimus Dorsi", "Lats"],
      "secondary_muscles": ["Biceps Brachii", "Rhomboids", "Middle Trapezius"],
      "phases": ["FULL OVERHEAD REACH", "SCAPULAR RETRACTION", "PULL TO CLAVICLE", "CONTROLLED ECCENTRIC"]
    },
    "seated_cable_row": {
      "animation": "seated_cable_row",
      "category": "Back",
      "equipment": "cable_row_station",
      "camera": { "preset": "side_3_4", "distance": 4.8, "fov": 45, "targetY": 0.8 },
      "primary_muscles": ["Latissimus Dorsi", "Rhomboids", "Mid-Back"],
      "secondary_muscles": ["Biceps Brachii", "Posterior Deltoids", "Trapezius"],
      "phases": ["ARMS EXTENDED", "DRIVE ELBOWS BACK", "SCAPULAR PINCH", "SMOOTH EXTENSION"]
    },
    "bicep_curl": {
      "animation": "bicep_curl",
      "category": "Arms",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 4.2, "fov": 45, "targetY": 1.0 },
      "primary_muscles": ["Biceps Brachii (Short & Long Heads)"],
      "secondary_muscles": ["Brachialis", "Brachioradialis", "Forearm Flexors"],
      "phases": ["FULL EXTENSION", "SUPINATED CURL", "PEAK BICEP CONTRACTION", "3-SEC ECCENTRIC"]
    },
    "barbell_curl": {
      "animation": "bicep_curl",
      "category": "Arms",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 4.2, "fov": 45, "targetY": 1.0 },
      "primary_muscles": ["Biceps Brachii"],
      "secondary_muscles": ["Forearms", "Brachialis"],
      "phases": ["ARMS EXTENDED", "CONCENTRIC CURL", "PEAK CONTRACTION", "LOWER SLOWLY"]
    },
    "hammer_curl": {
      "animation": "bicep_curl",
      "category": "Arms",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 4.2, "fov": 45, "targetY": 1.0 },
      "primary_muscles": ["Brachioradialis", "Brachialis"],
      "secondary_muscles": ["Biceps Brachii"],
      "phases": ["NEUTRAL GRIP", "CURL UPWARD", "SQUEEZE TOP", "CONTROLLED DESCENT"]
    },
    "tricep_pushdown": {
      "animation": "tricep_pushdown",
      "category": "Arms",
      "equipment": "cable_station",
      "camera": { "preset": "side_3_4", "distance": 4.4, "fov": 45, "targetY": 1.1 },
      "primary_muscles": ["Triceps Brachii (Lateral & Medial Heads)"],
      "secondary_muscles": ["Anconeus", "Forearm Stabilizers"],
      "phases": ["90° ELBOW FLEXION", "DRIVE DOWNWARD", "FULL TRICEP LOCKOUT", "CONTROLLED RESET"]
    },
    "shoulder_press": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 4.4, "fov": 45, "targetY": 1.1 },
      "primary_muscles": ["Anterior & Lateral Deltoids"],
      "secondary_muscles": ["Triceps Brachii", "Upper Trapezius", "Clavicular Pectorals"],
      "phases": ["SHOULDER RACK", "VERTICAL PRESS", "OVERHEAD LOCKOUT", "SMOOTH LOWERING"]
    },
    "overhead_press": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "barbell",
      "camera": { "preset": "front_3_4", "distance": 4.5, "fov": 45, "targetY": 1.2 },
      "primary_muscles": ["Deltoids (Shoulders)"],
      "secondary_muscles": ["Triceps", "Upper Trapezius", "Core"],
      "phases": ["CLAVICLE STANCE", "DRIVE OVERHEAD", "HEAD THROUGH WINDOW", "RETURN TO CHEST"]
    },
    "squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 4.8, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Calves (Gastrocnemius)", "Core Stabilizers"],
      "phases": ["UPRIGHT STANCE", "HIP HINGE & DESCENT", "PARALLEL DEPTH", "DRIVE THROUGH HEELS"]
    },
    "barbell_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 4.8, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Erector Spinae", "Adductors"],
      "phases": ["BRACED STANCE", "CONTROLLED DESCENT", "BELOW PARALLEL DEPTH", "STAND & SQUEEZE GLUTES"]
    },
    "goblet_squat": {
      "animation": "squat",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 4.6, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Quadriceps", "Glutes"],
      "secondary_muscles": ["Upper Back", "Core"],
      "phases": ["CHEST HELD WEIGHT", "SIT BETWEEN HIPS", "DEEP SQUAT", "DRIVE UP"]
    },

    // ── ADDITIONAL RESISTANCE & CORE EXERCISES ──
    "deadlift": {
      "animation": "deadlift",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 4.8, "fov": 45, "targetY": 0.8 },
      "primary_muscles": ["Gluteus Maximus", "Hamstrings", "Erector Spinae"],
      "secondary_muscles": ["Latissimus Dorsi", "Trapezius", "Forearms", "Quadriceps"],
      "phases": ["LOCKED SHINS AT BAR", "LEG DRIVE OFF FLOOR", "HIP HINGE LOCKOUT", "CONTROLLED RETURN"]
    },
    "barbell_deadlift": {
      "animation": "deadlift",
      "category": "Back",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 4.8, "fov": 45, "targetY": 0.8 },
      "primary_muscles": ["Posterior Chain", "Hamstrings", "Glutes"],
      "secondary_muscles": ["Back", "Core", "Grip"],
      "phases": ["SETUP & HINGE", "PULL SLACK", "STAND TALL", "LOWER TO FLOOR"]
    },
    "romanian_deadlift": {
      "animation": "deadlift",
      "category": "Legs",
      "equipment": "barbell",
      "camera": { "preset": "side_3_4", "distance": 4.8, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Hamstrings", "Gluteus Maximus"],
      "secondary_muscles": ["Lower Back", "Forearms"],
      "phases": ["SOFT KNEES", "PUSH HIPS BACK", "HAMSTRING STRETCH", "HIP EXTENSION"]
    },
    "lunge": {
      "animation": "lunge",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 4.8, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
      "secondary_muscles": ["Hamstrings", "Calves", "Core"],
      "phases": ["FORWARD STRIDE", "90° KNEE DROP", "TORSO UPRIGHT", "PUSH BACK TO START"]
    },
    "walking_lunge": {
      "animation": "lunge",
      "category": "Legs",
      "equipment": "dumbbells",
      "camera": { "preset": "side_3_4", "distance": 4.8, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Quads", "Glutes"],
      "secondary_muscles": ["Hamstrings", "Calves"],
      "phases": ["FORWARD STEP", "LOWER BACK KNEE", "DRIVE FORWARD", "CONTINUOUS STRIDE"]
    },
    "pull_up": {
      "animation": "pull_up",
      "category": "Back",
      "equipment": "lat_pulldown_machine",
      "camera": { "preset": "front_3_4", "distance": 4.8, "fov": 45, "targetY": 1.2 },
      "primary_muscles": ["Latissimus Dorsi", "Upper Back"],
      "secondary_muscles": ["Biceps Brachii", "Core", "Posterior Deltoids"],
      "phases": ["DEAD HANG", "ENGAGE LATS", "CHIN OVER BAR", "CONTROLLED LOWERING"]
    },
    "dips": {
      "animation": "tricep_pushdown",
      "category": "Chest",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 4.5, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Triceps Brachii", "Lower Pectorals"],
      "secondary_muscles": ["Anterior Deltoids", "Core"],
      "phases": ["TOP SUPPORT", "LOWER TO 90°", "PRESS UPWARD", "LOCKOUT"]
    },
    "lateral_raise": {
      "animation": "shoulder_press",
      "category": "Shoulders",
      "equipment": "dumbbells",
      "camera": { "preset": "front_3_4", "distance": 4.2, "fov": 45, "targetY": 1.0 },
      "primary_muscles": ["Lateral Deltoid"],
      "secondary_muscles": ["Anterior Deltoid", "Trapezius"],
      "phases": ["WEIGHTS AT SIDES", "RAISE TO PARALLEL", "PAUSE AT PEAK", "SLOW LOWERING"]
    },
    "plank": {
      "animation": "plank",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 4.4, "fov": 45, "targetY": 0.4 },
      "primary_muscles": ["Rectus Abdominis", "Transverse Abdominis"],
      "secondary_muscles": ["Glutes", "Shoulders", "Quadriceps"],
      "phases": ["FOREARM ALIGNMENT", "PELVIC TUCK", "STEADY ISOMETRIC BRACE", "NEUTRAL BREATHING"]
    },
    "crunches": {
      "animation": "plank",
      "category": "Core",
      "equipment": "studio_floor",
      "camera": { "preset": "side_3_4", "distance": 4.2, "fov": 45, "targetY": 0.5 },
      "primary_muscles": ["Rectus Abdominis"],
      "secondary_muscles": ["Obliques"],
      "phases": ["SUPINE START", "RIB TO PELVIS CRUNCH", "PEAK ABDOMINAL SQUEEZE", "SLOW RETURN"]
    },

    // ── YOGA & MOBILITY ASANAS (Requested by user) ──
    "downward_dog": {
      "animation": "yoga_downward_dog",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 4.5, "fov": 45, "targetY": 0.6 },
      "primary_muscles": ["Hamstrings", "Calves", "Shoulders", "Spine"],
      "secondary_muscles": ["Lats", "Wrists", "Core"],
      "phases": ["INVERTED V-SHAPE", "PRESS HEELS DOWN", "LENGTHEN SPINE", "DEEP PRANAYAMA BREATH"]
    },
    "warrior_ii": {
      "animation": "yoga_warrior_ii",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 4.8, "fov": 45, "targetY": 0.9 },
      "primary_muscles": ["Quadriceps", "Glutes", "Hip Flexors"],
      "secondary_muscles": ["Deltoids", "Core", "Ankles"],
      "phases": ["WIDE STANCE", "90° FRONT KNEE BEND", "EXTEND ARMS HORIZONTALLY", "GAZE OVER FRONT FINGER"]
    },
    "childs_pose": {
      "animation": "yoga_childs_pose",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 4.2, "fov": 45, "targetY": 0.4 },
      "primary_muscles": ["Lower Back (Erector Spinae)", "Hips", "Glutes"],
      "secondary_muscles": ["Shoulders", "Ankles"],
      "phases": ["KNEEL & BIG TOES TOUCH", "HIPS SINK TO HEELS", "REACH ARMS FORWARD", "REST FOREHEAD TO MAT"]
    },
    "cobra_pose": {
      "animation": "yoga_cobra",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 4.3, "fov": 45, "targetY": 0.5 },
      "primary_muscles": ["Erector Spinae", "Chest (Pectorals)"],
      "secondary_muscles": ["Abdominals", "Shoulders", "Glutes"],
      "phases": ["PRONE POSITION", "PALMS UNDER SHOULDERS", "GENTLY LIFT CHEST", "OPEN HEART & BREATHE"]
    },
    "cat_cow": {
      "animation": "yoga_cat_cow",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "side_3_4", "distance": 4.4, "fov": 45, "targetY": 0.6 },
      "primary_muscles": ["Entire Spinal Column", "Core"],
      "secondary_muscles": ["Neck", "Shoulders", "Pelvis"],
      "phases": ["TABLETOP POSE", "INHALE: COW (ARCH SPINE)", "EXHALE: CAT (ROUND SPINE)", "SYNCHRONIZE FLOW"]
    },
    "tree_pose": {
      "animation": "yoga_tree",
      "category": "Yoga",
      "equipment": "yoga_mat",
      "camera": { "preset": "front_3_4", "distance": 4.4, "fov": 45, "targetY": 1.0 },
      "primary_muscles": ["Ankle Stabilizers", "Adductors", "Glutes"],
      "secondary_muscles": ["Core", "Deltoids", "Hip Rotators"],
      "phases": ["ROOT STANDING FOOT", "PLACE SOLE ON INNER THIGH", "HANDS IN ANJALI MUDRA", "FIND DRISHTI FOCUS"]
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

    // Keyword heuristics
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
    if (slug.includes('downward') || slug.includes('dog')) return { ...EXERCISE_3D_CONFIG['downward_dog'], matched_slug: 'downward_dog' };
    if (slug.includes('warrior')) return { ...EXERCISE_3D_CONFIG['warrior_ii'], matched_slug: 'warrior_ii' };
    if (slug.includes('child')) return { ...EXERCISE_3D_CONFIG['childs_pose'], matched_slug: 'childs_pose' };
    if (slug.includes('cobra')) return { ...EXERCISE_3D_CONFIG['cobra_pose'], matched_slug: 'cobra_pose' };
    if (slug.includes('cat') || slug.includes('cow')) return { ...EXERCISE_3D_CONFIG['cat_cow'], matched_slug: 'cat_cow' };
    if (slug.includes('tree')) return { ...EXERCISE_3D_CONFIG['tree_pose'], matched_slug: 'tree_pose' };

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
