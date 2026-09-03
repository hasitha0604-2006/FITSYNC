/**
 * FitSync AI Form Checker Engine
 * Powered by MediaPipe Pose JS & Biomechanical Kinematic Analytics
 * Provides 100% local, real-time pose tracking, joint angle calculation,
 * exercise-specific form rules, rep counting, and form scoring.
 */

window.FitSyncAIFormChecker = (function() {
  'use strict';

  // ---------------------------------------------------------------------------
  // MediaPipe Landmark Index Mapping
  // ---------------------------------------------------------------------------
  const LANDMARKS = {
    NOSE: 0,
    LEFT_EYE: 2,
    RIGHT_EYE: 5,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28
  };

  // ---------------------------------------------------------------------------
  // Centralized Exercise Form Rule Configurations
  // ---------------------------------------------------------------------------
  const EXERCISE_CONFIGS = {
    // 1. BENCH PRESS
    bench_press: {
      name: "Bench Press",
      camera_view: "Side or diagonal angle at chest level",
      position_guidance: "Position camera to capture your side view on the bench. Ensure shoulders, elbows, and wrists are visible.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW, LANDMARKS.LEFT_WRIST, LANDMARKS.RIGHT_WRIST],
      rules: ['elbow_angle', 'wrist_alignment', 'arm_symmetry', 'range_of_motion', 'torso_position'],
      rep_thresholds: { start: 150, peak: 75 }, // Elbow angle
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";

        const leftElbowAngle = metrics.leftElbowAngle;
        const rightElbowAngle = metrics.rightElbowAngle;
        const avgElbow = (leftElbowAngle + rightElbowAngle) / 2;
        const symmetryDiff = Math.abs(leftElbowAngle - rightElbowAngle);

        if (avgElbow > 150) {
          phase = "Start / Lockout";
          feedback.push("● Arms extended. Lower bar under control toward mid-chest.");
        } else if (avgElbow < 85) {
          phase = "Peak Contraction (Chest Touch)";
          feedback.push("● Good depth! Touch chest lightly and press up explosively.");
        } else {
          phase = "Movement Phase";
          feedback.push("● Keep pressing through chest and triceps.");
        }

        if (symmetryDiff > 18) {
          score -= 15;
          feedback.push("⚠ Left and right arms moving unevenly. Drive evenly with both sides.");
        }

        if (metrics.leftElbowTuck < 35 || metrics.rightElbowTuck < 35) {
          score -= 10;
          feedback.push("⚠ Avoid flaring elbows out too wide. Keep elbows tucked at 45-70°.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(avgElbow) };
      }
    },

    // 2. INCLINE BENCH PRESS
    incline_bench_press: {
      name: "Incline Bench Press",
      camera_view: "Side or diagonal angle at upper chest level",
      position_guidance: "Position camera from side/diagonal. Ensure upper body, incline bench, and arms are in frame.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW, LANDMARKS.LEFT_WRIST, LANDMARKS.RIGHT_WRIST],
      rules: ['upper_chest_path', 'elbow_position', 'arm_symmetry', 'range_of_motion'],
      rep_thresholds: { start: 145, peak: 75 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const avgElbow = (metrics.leftElbowAngle + metrics.rightElbowAngle) / 2;
        const symmetryDiff = Math.abs(metrics.leftElbowAngle - metrics.rightElbowAngle);

        if (avgElbow > 145) {
          phase = "Lockout";
          feedback.push("● Incline lockout. Focus upper chest squeeze.");
        } else if (avgElbow < 80) {
          phase = "Peak Contraction";
          feedback.push("● Excellent upper chest depth! Drive bar vertically overhead.");
        } else {
          phase = "Incline Drive";
          feedback.push("● Maintain controlled bar path to clavicle line.");
        }

        if (symmetryDiff > 16) {
          score -= 15;
          feedback.push("⚠ Arm asymmetry detected. Balance your left and right drive.");
        }
        return { score, feedback, phase, primaryAngle: Math.round(avgElbow) };
      }
    },

    // 3. DUMBBELL BENCH PRESS
    dumbbell_bench_press: {
      name: "Dumbbell Bench Press",
      camera_view: "Front or diagonal angle showing both dumbbells",
      position_guidance: "Place camera diagonally to view your chest, shoulders, and dumbbell path.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW, LANDMARKS.LEFT_WRIST, LANDMARKS.RIGHT_WRIST],
      rules: ['dumbbell_convergence', 'elbow_stability', 'arm_symmetry', 'range_of_motion'],
      rep_thresholds: { start: 150, peak: 70 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const avgElbow = (metrics.leftElbowAngle + metrics.rightElbowAngle) / 2;
        const symmetryDiff = Math.abs(metrics.leftElbowAngle - metrics.rightElbowAngle);

        if (avgElbow > 150) {
          phase = "Top Lockout";
          feedback.push("● Squeeze chest at top without banging dumbbells together.");
        } else if (avgElbow < 75) {
          phase = "Bottom Stretch";
          feedback.push("● Great stretch! Press dumbbells inward as you rise.");
        } else {
          phase = "Pressing";
          feedback.push("● Keep wrists aligned directly over elbows.");
        }

        if (symmetryDiff > 15) {
          score -= 15;
          feedback.push("⚠ Left and right arms are uncoordinated. Match dumbbell depth.");
        }
        return { score, feedback, phase, primaryAngle: Math.round(avgElbow) };
      }
    },

    // 4. PUSH-UP
    push_up: {
      name: "Push-Up",
      camera_view: "Side view showing full body plank line",
      position_guidance: "Place camera on floor/low table so your full body from head to ankle is visible from the side.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_ANKLE, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
      rules: ['body_alignment', 'elbow_movement', 'hand_placement', 'range_of_motion', 'symmetry'],
      rep_thresholds: { start: 155, peak: 90 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Plank Hold";

        const elbowAngle = metrics.primarySideElbowAngle;
        const plankDev = metrics.plankAlignmentDev;

        if (plankDev > 22) {
          score -= 20;
          if (metrics.hipHeightVsLine > 0) {
            feedback.push("⚠ Hips sagging! Squeeze glutes and pull navel to spine.");
          } else {
            feedback.push("⚠ Hips too high! Lower hips to form a straight tabletop plank.");
          }
        } else {
          feedback.push("● Good body alignment");
        }

        if (elbowAngle > 155) {
          phase = "Top Plank";
          feedback.push("● Solid plank brace. Lower chest toward floor.");
        } else if (elbowAngle < 90) {
          phase = "Peak Depth";
          feedback.push("● Excellent chest depth! Push floor away aggressively.");
        } else {
          phase = "Descent / Ascent";
          feedback.push("● Keep elbows controlled at a 45° angle to body.");
        }

        if (metrics.armSymmetryDiff > 16) {
          score -= 15;
          feedback.push("⚠ Your left side is moving differently from your right side.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(elbowAngle) };
      }
    },

    // 5. LAT PULLDOWN
    lat_pulldown: {
      name: "Lat Pulldown",
      camera_view: "Front or side view of upper body & cable bar",
      position_guidance: "Place camera in front or slightly to the side to see your torso, shoulders, and bar path.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
      rules: ['torso_incline', 'bar_depth', 'shoulder_depression', 'arm_symmetry'],
      rep_thresholds: { start: 155, peak: 70 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const avgElbow = (metrics.leftElbowAngle + metrics.rightElbowAngle) / 2;
        const torsoLean = metrics.torsoInclineAngle;

        if (torsoLean > 35) {
          score -= 20;
          feedback.push("⚠ Leaning back too far! Stay slightly upright and drive elbows down.");
        }

        if (avgElbow > 155) {
          phase = "Full Stretch";
          feedback.push("● Full lat extension. Pull bar to upper chest.");
        } else if (avgElbow < 75) {
          phase = "Peak Contraction";
          feedback.push("● Great squeeze! Bar to upper chest, drive elbows into side pockets.");
        } else {
          phase = "Pulling Phase";
          feedback.push("● Depress shoulder blades as you pull downward.");
        }

        if (Math.abs(metrics.leftElbowAngle - metrics.rightElbowAngle) > 15) {
          score -= 15;
          feedback.push("⚠ Bar is tilting. Pull evenly with left and right lats.");
        }
        return { score, feedback, phase, primaryAngle: Math.round(avgElbow) };
      }
    },

    // 6. SEATED CABLE ROW
    seated_cable_row: {
      name: "Seated Cable Row",
      camera_view: "Side view showing torso and arm pull",
      position_guidance: "Position camera to capture your side profile on the rowing machine.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
      rules: ['torso_uprightness', 'elbow_drive', 'shoulder_retraction', 'arm_symmetry'],
      rep_thresholds: { start: 150, peak: 65 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const elbowAngle = metrics.primarySideElbowAngle;
        const torsoSwing = Math.abs(metrics.torsoInclineAngle - 90);

        if (torsoSwing > 25) {
          score -= 20;
          feedback.push("⚠ Avoid swinging your torso. Keep posture stable and use your back.");
        } else {
          feedback.push("● Good upright torso stability");
        }

        if (elbowAngle > 150) {
          phase = "Arm Extension";
          feedback.push("● Reach forward with arms, letting lats stretch fully.");
        } else if (elbowAngle < 70) {
          phase = "Peak Retraction";
          feedback.push("● Squeeze rhomboids! Pull handle into belly button area.");
        } else {
          phase = "Rowing Drive";
          feedback.push("● Drive elbows back past your ribs.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(elbowAngle) };
      }
    },

    // 7. BICEP CURL
    bicep_curl: {
      name: "Bicep Curl",
      camera_view: "Front or side view showing torso & arms",
      position_guidance: "Stand facing camera or slightly diagonal. Ensure shoulders, elbows, wrists, and hips are visible.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST, LANDMARKS.LEFT_HIP],
      rules: ['elbow_stability', 'wrist_position', 'elbow_angle', 'arm_symmetry', 'range_of_motion', 'excessive_body_swing'],
      rep_thresholds: { start: 145, peak: 55 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Start";
        const elbowAngle = metrics.primarySideElbowAngle;
        const elbowDrift = metrics.elbowDriftDistance;

        if (metrics.torsoSwing > 20) {
          score -= 20;
          feedback.push("⚠ Avoid swinging your torso. Brace core and isolate biceps.");
        } else {
          feedback.push("● Good torso control");
        }

        if (elbowDrift > 0.12) {
          score -= 15;
          feedback.push("⚠ Keep your elbow closer to your body! Don't let elbows flare forward.");
        } else {
          feedback.push("● Elbow anchored smoothly");
        }

        if (elbowAngle > 145) {
          phase = "Full Extension";
          feedback.push("● Full extension. Squeeze bicep upward.");
        } else if (elbowAngle < 55) {
          phase = "Peak Squeeze";
          feedback.push("● Peak contraction! Lower under 2-3s controlled tempo.");
        } else {
          phase = "Concentric Curl";
          feedback.push("● Curl smoothly toward shoulders.");
        }

        if (metrics.armSymmetryDiff > 16) {
          score -= 15;
          feedback.push("⚠ Left arm and right arm curling at different speeds.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(elbowAngle) };
      }
    },

    // 8. TRICEP PUSHDOWN
    tricep_pushdown: {
      name: "Tricep Pushdown",
      camera_view: "Side or front view showing upper arm pin & elbows",
      position_guidance: "Position camera to capture your upper body profile at cable station.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST, LANDMARKS.LEFT_HIP],
      rules: ['elbow_pin_stability', 'lockout_angle', 'arm_symmetry', 'range_of_motion'],
      rep_thresholds: { start: 85, peak: 155 }, // Flexed at start, extended at peak
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const elbowAngle = metrics.primarySideElbowAngle;

        if (metrics.elbowDriftDistance > 0.12) {
          score -= 20;
          feedback.push("⚠ Keep elbows pinned to your sides. Avoid letting elbows drift forward.");
        } else {
          feedback.push("● Good elbow positioning");
        }

        if (elbowAngle > 155) {
          phase = "Full Lockout";
          feedback.push("● Perfect tricep extension! Squeeze horseshoe peak.");
        } else if (elbowAngle < 85) {
          phase = "Top Return";
          feedback.push("● Allow forearms to reach 90° before pushing back down.");
        } else {
          phase = "Pushing Down";
          feedback.push("● Extend forearms downward using triceps.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(elbowAngle) };
      }
    },

    // 9. SHOULDER PRESS
    shoulder_press: {
      name: "Shoulder Press",
      camera_view: "Front or side view of head, shoulders, & overhead arms",
      position_guidance: "Place camera far enough away to see your head, shoulders, elbows, and full overhead lockout.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW, LANDMARKS.LEFT_WRIST, LANDMARKS.RIGHT_WRIST, LANDMARKS.LEFT_HIP],
      rules: ['overhead_lockout', 'forearm_verticality', 'back_arch_control', 'arm_symmetry'],
      rep_thresholds: { start: 85, peak: 155 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Rack Position";
        const avgElbow = (metrics.leftElbowAngle + metrics.rightElbowAngle) / 2;

        if (metrics.lowerBackArch > 25) {
          score -= 20;
          feedback.push("⚠ Avoid arching lower back! Brace core and glutes tightly.");
        }

        if (avgElbow > 155) {
          phase = "Full Lockout";
          feedback.push("● Full overhead lockout! Bar/dumbbells directly above shoulders.");
        } else if (avgElbow < 85) {
          phase = "Rack Position";
          feedback.push("● Hands at chin/collarbone level. Press straight up.");
        } else {
          phase = "Concentric Press";
          feedback.push("● Drive upward without leaning backward.");
        }

        if (Math.abs(metrics.leftElbowAngle - metrics.rightElbowAngle) > 16) {
          score -= 15;
          feedback.push("⚠ Arms extending unevenly. Equalize shoulder drive.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(avgElbow) };
      }
    },

    // 10. SQUAT
    squat: {
      name: "Squat",
      camera_view: "Side or diagonal view showing full body from head to feet",
      position_guidance: "Place camera far enough away to see your head, hips, knees, and feet in full view.",
      required_landmarks: [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE, LANDMARKS.LEFT_ANKLE, LANDMARKS.RIGHT_ANKLE, LANDMARKS.LEFT_SHOULDER],
      rules: ['knee_tracking', 'hip_depth', 'torso_angle', 'knee_angle', 'symmetry', 'movement_consistency'],
      rep_thresholds: { start: 155, peak: 95 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Standing";
        const kneeAngle = metrics.primarySideKneeAngle;
        const torsoLean = metrics.torsoInclineAngle;

        if (kneeAngle > 155) {
          phase = "Standing Stance";
          feedback.push("● Standing tall. Chest up, brace core, ready to squat.");
        } else if (kneeAngle < 95) {
          phase = "Peak Squat Depth";
          feedback.push("● Good squat depth! Thighs parallel to floor.");
        } else {
          phase = "Eccentric Descent";
          feedback.push("● Lowering hips... try to reach a slightly deeper position.");
        }

        if (torsoLean < 40) {
          score -= 15;
          feedback.push("⚠ Keep your chest more upright. Avoid excessive forward chest collapse.");
        } else {
          feedback.push("● Good upright torso angle");
        }

        if (metrics.legSymmetryDiff > 16) {
          score -= 15;
          feedback.push("⚠ Weight shifting to one side. Distribute force evenly through both heels.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(kneeAngle) };
      }
    },

    // 11. PLANK / CORE HOLD
    plank: {
      name: "Plank / Core Hold",
      camera_view: "Side view showing full horizontal body alignment",
      position_guidance: "Place camera at waist height from the side to capture shoulder, hip, and ankle alignment.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_ANKLE],
      rules: ['spine_alignment', 'hip_height', 'glute_brace', 'head_neck_alignment'],
      rep_thresholds: { start: 175, peak: 165 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Core Hold";
        const dev = metrics.plankAlignmentDev;

        if (dev > 20) {
          score -= 20;
          if (metrics.hipHeightVsLine > 0) {
            feedback.push("⚠ Hips sagging! Lift hips in line with shoulders and brace core.");
            phase = "Hip Sag Warning";
          } else {
            feedback.push("⚠ Hips too high! Lower hips slightly to form a tabletop line.");
            phase = "Hips Raised Warning";
          }
        } else {
          feedback.push("● Flawless plank alignment! Spine straight and glutes squeezed.");
          phase = "Solid Core Hold";
        }

        return { score, feedback, phase, primaryAngle: Math.round(180 - dev) };
      }
    },

    // 12. DEADLIFT / HIP HINGE
    deadlift: {
      name: "Deadlift / Hip Hinge",
      camera_view: "Side view showing hip hinge & neutral spine",
      position_guidance: "Place camera to capture your side profile to view bar path, hip hinge depth, and spine alignment.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['neutral_spine', 'hip_hinge', 'knee_flexion', 'lat_engagement'],
      rep_thresholds: { start: 165, peak: 85 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const hipAngle = metrics.torsoInclineAngle;

        if (hipAngle > 165) {
          phase = "Standing Lockout";
          feedback.push("● Standing tall at lockout. Squeeze glutes, keep shoulders packed.");
        } else if (hipAngle < 90) {
          phase = "Bottom Hinge";
          feedback.push("● Good hip hinge depth! Keep chest up and bar close to shins.");
        } else {
          phase = "Hinge / Drive";
          feedback.push("● Drive through mid-foot and extend hips forward.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(hipAngle) };
      }
    },

    // 13. CRUNCH (ABS)
    crunch: {
      name: "Crunch",
      camera_view: "Side view of torso and shoulders",
      position_guidance: "Lie on back with camera positioned at side profile showing head, shoulders, and hips.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP],
      rules: ['torso_flexion', 'neck_alignment', 'range_of_motion', 'controlled_return'],
      rep_thresholds: { start: 160, peak: 115 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const angle = metrics.torsoInclineAngle;

        if (angle > 160) {
          phase = "Extended Setup";
          feedback.push("● Extended setup. Curl upper torso upward.");
        } else if (angle < 115) {
          phase = "Peak Contraction";
          feedback.push("● Good controlled movement! Squeeze abs and hold briefly.");
        } else {
          phase = "Curling";
          feedback.push("● Control the return. Focus on curling through your torso.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(angle) };
      }
    },

    // 14. BICYCLE CRUNCH (ABS)
    bicycle_crunch: {
      name: "Bicycle Crunch",
      camera_view: "Side or 45-degree angle showing elbows and knees",
      position_guidance: "Position camera at 45° angle to see alternating elbow-to-knee rotation.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE],
      rules: ['rotational_twist', 'elbow_knee_proximity', 'symmetry', 'controlled_tempo'],
      rep_thresholds: { start: 140, peak: 60 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Alternating Twist";
        const angle = metrics.primarySideKneeAngle;

        if (angle < 75) {
          phase = "Peak Rotational Touch";
          feedback.push("● Great torso rotation! Touch opposite elbow to knee.");
        } else {
          phase = "Alternating Cycle";
          feedback.push("● Keep rotation controlled. Avoid pulling on your neck.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(angle) };
      }
    },

    // 15. LEG RAISE (ABS)
    leg_raise: {
      name: "Leg Raise",
      camera_view: "Side view showing legs, hips, and lower back",
      position_guidance: "Lie on back with camera positioned at side profile showing hips, knees, and ankles.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['leg_elevation_angle', 'lumbar_support', 'controlled_lowering', 'knee_extension'],
      rep_thresholds: { start: 165, peak: 100 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const angle = metrics.torsoInclineAngle;

        if (angle > 165) {
          phase = "Floor Extension";
          feedback.push("● Legs extended. Keep lower back pressed to floor.");
        } else if (angle < 100) {
          phase = "Peak Elevation";
          feedback.push("● Good leg elevation! Lower under strict control.");
        } else {
          phase = "Raising / Lowering";
          feedback.push("● Keep your legs controlled. Avoid swinging your legs.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(angle) };
      }
    },

    // 16. RUSSIAN TWIST (ABS)
    russian_twist: {
      name: "Russian Twist",
      camera_view: "Front or 45-degree angle showing torso rotation",
      position_guidance: "Sit facing camera at a 45° angle to capture shoulders, elbows, and hip rotation.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
      rules: ['oblique_rotation', 'core_flexion_hold', 'shoulder_swing_control'],
      rep_thresholds: { start: 140, peak: 70 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Rotational Sweep";
        const sym = metrics.armSymmetryDiff;

        if (sym > 20) {
          phase = "Side Peak Twist";
          feedback.push("● Deep oblique twist! Rotate shoulders fully.");
        } else {
          phase = "Center Hold";
          feedback.push("● Brace core, lean back slightly, and sweep side-to-side.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(metrics.torsoInclineAngle) };
      }
    },

    // 17. GOBLET SQUAT (QUADRICEPS)
    goblet_squat: {
      name: "Goblet Squat",
      camera_view: "Side or 45-degree view showing chest, hips, & knees",
      position_guidance: "Place camera far enough away to view head, shoulders, hips, knees, and feet.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['anterior_load_posture', 'hip_depth', 'knee_tracking', 'upright_chest'],
      rep_thresholds: { start: 155, peak: 95 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const kneeAngle = metrics.primarySideKneeAngle;

        if (kneeAngle > 155) {
          phase = "Standing Setup";
          feedback.push("● Hold weight at chest level. Brace core, ready to squat.");
        } else if (kneeAngle < 95) {
          phase = "Peak Depth";
          feedback.push("● Good squat depth! Keep chest upright and elbows inside knees.");
        } else {
          phase = "Descent / Ascent";
          feedback.push("● Control your descent. Keep your knees aligned with feet.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(kneeAngle) };
      }
    },

    // 18. LUNGES (QUADRICEPS)
    lunges: {
      name: "Lunges",
      camera_view: "Side view showing front knee, back knee, & step depth",
      position_guidance: "Place camera to capture your side profile while stepping forward into lunges.",
      required_landmarks: [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE, LANDMARKS.RIGHT_KNEE, LANDMARKS.RIGHT_ANKLE],
      rules: ['front_knee_alignment', 'knee_90_flexion', 'step_depth', 'torso_uprightness'],
      rep_thresholds: { start: 155, peak: 95 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Standing Stance";
        const kneeAngle = metrics.primarySideKneeAngle;

        if (kneeAngle > 155) {
          phase = "Standing Start";
          feedback.push("● Standing stance. Step forward into controlled lunge.");
        } else if (kneeAngle < 95) {
          phase = "Peak Lunge Depth";
          feedback.push("● Good lunge depth! Front knee at 90°, back knee hovering.");
        } else {
          phase = "Lunge Step";
          feedback.push("● Keep your front knee aligned over your ankle.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(kneeAngle) };
      }
    },

    // 19. LEG EXTENSION (QUADRICEPS)
    leg_extension: {
      name: "Leg Extension",
      camera_view: "Side view of leg extension machine",
      position_guidance: "Position camera at side profile to view knee joint, lower leg pad, and quad contraction.",
      required_landmarks: [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['quad_lockout_extension', 'knee_flexion_return', 'controlled_eccentric', 'hip_stability'],
      rep_thresholds: { start: 95, peak: 160 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const kneeAngle = metrics.primarySideKneeAngle;

        if (kneeAngle > 160) {
          phase = "Full Quad Extension";
          feedback.push("● Full quad extension! Squeeze peak at top.");
        } else if (kneeAngle < 95) {
          phase = "Flexed Return";
          feedback.push("● Control the lowering phase. Prepare to drive upward.");
        } else {
          phase = "Extension Drive";
          feedback.push("● Extend legs upward using quadriceps.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(kneeAngle) };
      }
    },

    // 20. LEG PRESS (QUADRICEPS)
    leg_press: {
      name: "Leg Press",
      camera_view: "Side view of leg press sled & knee flex angle",
      position_guidance: "Position camera at side angle to observe knee bending depth and non-lockout extension.",
      required_landmarks: [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['knee_bend_depth', 'knee_tracking', 'non_lockout_extension', 'hip_pad_contact'],
      rep_thresholds: { start: 155, peak: 90 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const kneeAngle = metrics.primarySideKneeAngle;

        if (kneeAngle > 155) {
          phase = "Sled Extended";
          feedback.push("● Legs extended. Do not hard-lock knees.");
        } else if (kneeAngle < 90) {
          phase = "Deep Flexion Depth";
          feedback.push("● Good depth! Drive sled away through mid-foot.");
        } else {
          phase = "Pressing Sled";
          feedback.push("● Keep your hips flat on pad and knees aligned.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(kneeAngle) };
      }
    },

    // 21. ROMANIAN DEADLIFT (HAMSTRINGS)
    romanian_deadlift: {
      name: "Romanian Deadlift",
      camera_view: "Side view showing hip hinge & neutral spine",
      position_guidance: "Position camera to capture your side profile to view bar path, hip hinge depth, and neutral spine.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['hip_hinge_vs_knee_bend', 'neutral_spine', 'hamstring_stretch_depth', 'controlled_ascent'],
      rep_thresholds: { start: 165, peak: 90 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const hipAngle = metrics.torsoInclineAngle;

        if (hipAngle > 165) {
          phase = "Standing Lockout";
          feedback.push("● Good hip hinge setup. Stand tall and squeeze glutes.");
        } else if (hipAngle < 90) {
          phase = "Hamstring Stretch Peak";
          feedback.push("● Excellent hamstring stretch! Push hips back with slight knee flex.");
        } else {
          phase = "Hinging Hips";
          feedback.push("● Move through your hips. Avoid simply squatting down.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(hipAngle) };
      }
    },

    // 22. LEG CURL (HAMSTRINGS)
    leg_curl: {
      name: "Leg Curl",
      camera_view: "Side view of leg curl machine & knee flexion",
      position_guidance: "Position camera at side profile to capture hip pad contact, knee joint, and ankle pad movement.",
      required_landmarks: [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['hamstring_flexion_contraction', 'controlled_extension_eccentric', 'hip_stability'],
      rep_thresholds: { start: 155, peak: 70 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const kneeAngle = metrics.primarySideKneeAngle;

        if (kneeAngle < 70) {
          phase = "Peak Flexion Squeeze";
          feedback.push("● Peak contraction! Squeeze hamstrings tight.");
        } else if (kneeAngle > 155) {
          phase = "Full Leg Extension";
          feedback.push("● Full extension. Prepare to curl heel to glutes.");
        } else {
          phase = "Curling Hamstrings";
          feedback.push("● Keep your hips stable on pad. Control the lowering phase.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(kneeAngle) };
      }
    },

    // 23. HIP THRUST / GLUTE BRIDGE (GLUTES)
    hip_thrust: {
      name: "Hip Thrust / Glute Bridge",
      camera_view: "Side view showing bench, hips, & knees",
      position_guidance: "Place camera at waist height from the side to capture hip elevation and 90° shin verticality at top.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['full_hip_extension_lockout', 'vertical_shin_angle', 'controlled_descent', 'knee_stability'],
      rep_thresholds: { start: 110, peak: 170 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const hipAngle = metrics.torsoInclineAngle;

        if (hipAngle > 165) {
          phase = "Peak Hip Extension";
          feedback.push("● Good hip extension! Squeeze glutes hard at top.");
        } else if (hipAngle < 120) {
          phase = "Bottom Setup";
          feedback.push("● Lowered position. Drive through heels to extend hips.");
        } else {
          phase = "Thrusting Hips";
          feedback.push("● Drive hips upward while keeping knees stable.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(hipAngle) };
      }
    },

    // 24. CALF RAISE (CALVES)
    calf_raise: {
      name: "Calf Raise",
      camera_view: "Side or rear view showing lower legs & feet",
      position_guidance: "Position camera so your knees, ankles, and heels are in clear view.",
      required_landmarks: [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
      rules: ['heel_elevation_range', 'ankle_dorsiflexion_stretch', 'knee_stability', 'bilateral_symmetry'],
      rep_thresholds: { start: 170, peak: 135 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const ankleAngle = metrics.primarySideKneeAngle;

        if (ankleAngle < 140) {
          phase = "Peak Heel Elevation";
          feedback.push("● Good range of motion! Raise your heels fully onto toes.");
        } else {
          phase = "Heel Stretch / Flat";
          feedback.push("● Control the lowering phase. Stretch calves at bottom.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(ankleAngle) };
      }
    },

    // 25. WRIST CURL (FOREARMS)
    wrist_curl: {
      name: "Wrist Curl",
      camera_view: "Side or front view of forearm & wrist flex",
      position_guidance: "Place camera close to forearm to capture wrist flexion and extension with stationary elbows.",
      required_landmarks: [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
      rules: ['wrist_flexion_rom', 'stationary_elbow_isolation', 'controlled_tempo'],
      rep_thresholds: { start: 170, peak: 130 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Setup";
        const elbowAngle = metrics.leftElbowAngle;

        feedback.push("● Keep your forearm stable. Use controlled wrist movement.");

        return { score, feedback, phase: "Wrist Flexion", primaryAngle: Math.round(elbowAngle) };
      }
    },

    // 26. REVERSE WRIST CURL (FOREARMS)
    reverse_wrist_curl: {
      name: "Reverse Wrist Curl",
      camera_view: "Side or front view of forearm & wrist extensor",
      position_guidance: "Place camera close to forearm to capture pronated wrist extension.",
      required_landmarks: [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
      rules: ['wrist_extension_rom', 'stationary_forearm_isolation', 'controlled_tempo'],
      rep_thresholds: { start: 170, peak: 130 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        feedback.push("● Control pronated wrist extension. Avoid moving elbows.");
        return { score, feedback, phase: "Wrist Extension", primaryAngle: Math.round(metrics.leftElbowAngle) };
      }
    },

    // 27. FARMER'S WALK (FOREARMS / FULL BODY HOLD)
    farmers_walk: {
      name: "Farmer's Walk",
      camera_view: "Front or side view of standing carry",
      position_guidance: "Position camera to view upright posture, shoulders, and walking gait.",
      required_landmarks: [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
      rules: ['upright_postural_hold', 'shoulder_symmetry', 'torso_sway_control'],
      is_hold_exercise: true,
      rep_thresholds: { start: 175, peak: 165 },
      analyze: function(lm, metrics) {
        let feedback = [];
        let score = 100;
        let phase = "Upright Carry";
        
        if (metrics.armSymmetryDiff > 15) {
          score -= 15;
          feedback.push("⚠ Torso leaning to side. Keep shoulders level and posture upright.");
        } else {
          feedback.push("● Solid upright postural hold. Walk with controlled gait.");
        }

        return { score, feedback, phase, primaryAngle: Math.round(metrics.torsoInclineAngle) };
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Category Fallback Configuration Engine
  // ---------------------------------------------------------------------------
  function getCategoryFallback(categoryStr, exerciseName) {
    const cat = (categoryStr || '').toLowerCase();
    const name = (exerciseName || '').toLowerCase();

    if (name.includes('crunch') || name.includes('twist') || name.includes('leg_raise') || cat.includes('abs')) {
      if (name.includes('bicycle')) return EXERCISE_CONFIGS.bicycle_crunch;
      if (name.includes('twist')) return EXERCISE_CONFIGS.russian_twist;
      if (name.includes('raise')) return EXERCISE_CONFIGS.leg_raise;
      return EXERCISE_CONFIGS.crunch;
    }
    if (cat.includes('core') || name.includes('plank')) {
      return EXERCISE_CONFIGS.plank;
    }
    if (name.includes('rdl') || name.includes('romanian')) {
      return EXERCISE_CONFIGS.romanian_deadlift;
    }
    if (name.includes('deadlift') || name.includes('hinge') || name.includes('good_morning')) {
      return EXERCISE_CONFIGS.deadlift;
    }
    if (name.includes('thrust') || name.includes('bridge') || cat.includes('glute')) {
      return EXERCISE_CONFIGS.hip_thrust;
    }
    if (name.includes('calf') || cat.includes('calf') || cat.includes('calves')) {
      return EXERCISE_CONFIGS.calf_raise;
    }
    if (name.includes('wrist') || name.includes('farmer') || cat.includes('forearm')) {
      if (name.includes('farmer')) return EXERCISE_CONFIGS.farmers_walk;
      if (name.includes('reverse')) return EXERCISE_CONFIGS.reverse_wrist_curl;
      return EXERCISE_CONFIGS.wrist_curl;
    }
    if (cat.includes('hamstring') || name.includes('leg_curl') || name.includes('curl_leg')) {
      return EXERCISE_CONFIGS.leg_curl;
    }
    if (name.includes('goblet')) return EXERCISE_CONFIGS.goblet_squat;
    if (name.includes('lunge')) return EXERCISE_CONFIGS.lunges;
    if (name.includes('extension') && (cat.includes('leg') || name.includes('leg'))) return EXERCISE_CONFIGS.leg_extension;
    if (name.includes('press') && (cat.includes('leg') || name.includes('leg'))) return EXERCISE_CONFIGS.leg_press;
    if (cat.includes('chest') || name.includes('push') || name.includes('chest') || name.includes('fly') || name.includes('press')) {
      return EXERCISE_CONFIGS.bench_press;
    }
    if (cat.includes('back') || name.includes('pull') || name.includes('row') || name.includes('lat') || name.includes('chin')) {
      return EXERCISE_CONFIGS.lat_pulldown;
    }
    if (cat.includes('bicep') || name.includes('curl')) {
      return EXERCISE_CONFIGS.bicep_curl;
    }
    if (cat.includes('tricep') || name.includes('dip') || name.includes('extension')) {
      return EXERCISE_CONFIGS.tricep_pushdown;
    }
    if (cat.includes('shoulder') || cat.includes('deltoid') || name.includes('press') || name.includes('raise')) {
      return EXERCISE_CONFIGS.shoulder_press;
    }
    if (cat.includes('leg') || cat.includes('quad') || name.includes('squat')) {
      return EXERCISE_CONFIGS.squat;
    }
    return EXERCISE_CONFIGS.squat;
  }

  // ---------------------------------------------------------------------------
  // Biomechanical Angle & Landmark Math Utilities
  // ---------------------------------------------------------------------------
  function calculateAngle(a, b, c) {
    if (!a || !b || !c) return 180;
    try {
      const ab = { x: a.x - b.x, y: a.y - b.y };
      const cb = { x: c.x - b.x, y: c.y - b.y };
      const dot = ab.x * cb.x + ab.y * cb.y;
      const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
      const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
      if (magAB === 0 || magCB === 0) return 180;
      let cosAngle = dot / (magAB * magCB);
      cosAngle = Math.max(-1.0, Math.min(1.0, cosAngle));
      return Math.acos(cosAngle) * (180 / Math.PI);
    } catch (e) {
      return 180;
    }
  }

  function calculatePointLineDistance(point, lineStart, lineEnd) {
    if (!point || !lineStart || !lineEnd) return 0;
    const num = Math.abs((lineEnd.y - lineStart.y) * point.x - (lineEnd.x - lineStart.x) * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
    const den = Math.sqrt(Math.pow(lineEnd.y - lineStart.y, 2) + Math.pow(lineEnd.x - lineStart.x, 2));
    return den === 0 ? 0 : num / den;
  }

  // Normalize exercise slug key
  function normalizeSlug(str) {
    if (!str) return 'squat';
    let s = str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    if (EXERCISE_CONFIGS[s]) return s;
    // Common aliases
    if (s.includes('bench_press') || s.includes('chest_press')) return 'bench_press';
    if (s.includes('incline')) return 'incline_bench_press';
    if (s.includes('dumbbell_bench') || s.includes('db_bench')) return 'dumbbell_bench_press';
    if (s.includes('push_up') || s.includes('pushup')) return 'push_up';
    if (s.includes('lat_pull') || s.includes('pulldown')) return 'lat_pulldown';
    if (s.includes('row')) return 'seated_cable_row';
    if (s.includes('curl')) return 'bicep_curl';
    if (s.includes('tricep')) return 'tricep_pushdown';
    if (s.includes('shoulder_press') || s.includes('overhead_press') || s.includes('military')) return 'shoulder_press';
    if (s.includes('squat')) return 'squat';
    return s;
  }

  // ---------------------------------------------------------------------------
  // Main Engine Class
  // ---------------------------------------------------------------------------
  class AIFormCheckerEngine {
    constructor() {
      this.activeExerciseSlug = 'squat';
      this.activeConfig = EXERCISE_CONFIGS.squat;
      this.isCameraRunning = false;
      this.isSimulating = false;
      this.mpPose = null;
      this.mpCamera = null;
      this.videoElement = null;
      this.canvasElement = null;
      this.canvasCtx = null;
      this.repCount = 0;
      this.repState = 'START';
      this.lastPhase = 'Setup';
      this.onTelemetryUpdate = null;
      this.simAngle = 180;
      this.simDir = -1;
      this.simInterval = null;
    }

    setExercise(exerciseName, category) {
      const slug = normalizeSlug(exerciseName);
      if (EXERCISE_CONFIGS[slug]) {
        this.activeExerciseSlug = slug;
        this.activeConfig = EXERCISE_CONFIGS[slug];
      } else {
        this.activeConfig = getCategoryFallback(category, exerciseName);
        this.activeExerciseSlug = normalizeSlug(this.activeConfig.name);
      }
      this.repCount = 0;
      this.repState = 'START';
      return this.activeConfig;
    }

    getExerciseConfig() {
      return this.activeConfig;
    }

    // -------------------------------------------------------------------------
    // MediaPipe Pose Initialization & Camera Stream
    // -------------------------------------------------------------------------
    async startCamera(videoEl, canvasEl, telemetryCb) {
      this.stop();
      this.videoElement = videoEl;
      this.canvasElement = canvasEl;
      this.canvasCtx = canvasEl ? canvasEl.getContext('2d') : null;
      this.onTelemetryUpdate = telemetryCb;
      this.isSimulating = false;

      // Check MediaPipe JS global availability
      if (typeof window.Pose === 'undefined' || typeof window.Camera === 'undefined') {
        console.warn("[FitSync AI] MediaPipe Pose JS script not found. Falling back to AI Simulator.");
        return this.startSimulation(telemetryCb);
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
        });
        this.videoElement.srcObject = stream;
        await this.videoElement.play();

        this.mpPose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        this.mpPose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        this.mpPose.onResults((results) => this.processPoseResults(results));

        this.mpCamera = new window.Camera(this.videoElement, {
          onFrame: async () => {
            if (this.isCameraRunning && this.videoElement && this.mpPose) {
              await this.mpPose.send({ image: this.videoElement });
            }
          },
          width: 640,
          height: 480
        });

        await this.mpCamera.start();
        this.isCameraRunning = true;
        return true;
      } catch (err) {
        console.warn("[FitSync AI] Camera access denied or locked. Launching AI Simulator.", err);
        return this.startSimulation(telemetryCb);
      }
    }

    startSimulation(telemetryCb) {
      this.stop();
      this.isSimulating = true;
      this.onTelemetryUpdate = telemetryCb;
      this.simAngle = 175;
      this.simDir = -1.5;

      this.simInterval = setInterval(() => {
        this.simAngle += this.simDir;
        if (this.simAngle <= 65) {
          this.simAngle = 65;
          this.simDir = 1.5;
        } else if (this.simAngle >= 175) {
          this.simAngle = 175;
          this.simDir = -1.5;
        }

        const config = this.activeConfig;
        let phase = "Eccentric";
        let score = 94;
        let feedback = ["● Simulated kinematic posture wave active."];

        if (this.simAngle > 150) {
          phase = "Start Position";
          score = 100;
          feedback = ["● Position set. Ready to lower under control."];
        } else if (this.simAngle < 85) {
          phase = "Peak Contraction";
          score = 98;
          feedback = ["● Excellent range of motion depth reached!"];
          if (this.lastPhase !== 'Peak Contraction') {
            this.repCount++;
          }
        }

        this.lastPhase = phase;

        if (this.onTelemetryUpdate) {
          this.onTelemetryUpdate({
            status: "success",
            exercise: config.name,
            score: score,
            angle: Math.round(this.simAngle),
            phase: phase,
            reps: this.repCount,
            feedback: feedback,
            simulated: true,
            landmarkWarning: null
          });
        }
      }, 100);

      return false; // Indicating simulation active
    }

    stop() {
      this.isCameraRunning = false;
      this.isSimulating = false;

      if (this.simInterval) {
        clearInterval(this.simInterval);
        this.simInterval = null;
      }

      if (this.mpCamera) {
        try { this.mpCamera.stop(); } catch(e){}
        this.mpCamera = null;
      }

      if (this.mpPose) {
        try { this.mpPose.close(); } catch(e){}
        this.mpPose = null;
      }

      if (this.videoElement && this.videoElement.srcObject) {
        const tracks = this.videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        this.videoElement.srcObject = null;
      }

      if (this.canvasCtx && this.canvasElement) {
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      }
    }

    // -------------------------------------------------------------------------
    // Processing Real-Time Landmarks
    // -------------------------------------------------------------------------
    processPoseResults(results) {
      if (!this.isCameraRunning || !results) return;

      const canvas = this.canvasElement;
      const ctx = this.canvasCtx;

      if (canvas && ctx) {
        canvas.width = this.videoElement.videoWidth || 640;
        canvas.height = this.videoElement.videoHeight || 480;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (!results.poseLandmarks) {
        if (this.onTelemetryUpdate) {
          this.onTelemetryUpdate({
            status: "warning",
            exercise: this.activeConfig.name,
            score: 0,
            angle: 0,
            phase: "Searching",
            reps: this.repCount,
            feedback: ["Please adjust your position so your full body / required joints are visible."],
            simulated: false,
            landmarkWarning: "No body detected. Step back into full camera view."
          });
        }
        if (ctx) ctx.restore();
        return;
      }

      const lm = results.poseLandmarks;

      // Visibility Confidence Check
      const required = this.activeConfig.required_landmarks || [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE];
      let lowVisibilityCount = 0;
      let missingLandmarkName = null;

      required.forEach(idx => {
        if (!lm[idx] || (lm[idx].visibility !== undefined && lm[idx].visibility < 0.45)) {
          lowVisibilityCount++;
          if (idx === LANDMARKS.LEFT_ANKLE || idx === LANDMARKS.RIGHT_ANKLE) missingLandmarkName = "Your ankle is not clearly visible. Move camera so your lower legs and feet are in view.";
          else if (idx === LANDMARKS.LEFT_WRIST || idx === LANDMARKS.RIGHT_WRIST) missingLandmarkName = "Your wrist/hand is not clearly visible. Move camera to capture arm movement.";
          else if (idx === LANDMARKS.LEFT_KNEE || idx === LANDMARKS.RIGHT_KNEE) missingLandmarkName = "Your knee is not clearly visible. Step back into full camera view.";
          else if (idx === LANDMARKS.LEFT_HIP || idx === LANDMARKS.RIGHT_HIP) missingLandmarkName = "Your hip is not clearly visible. Step back into full camera view.";
        }
      });

      if (lowVisibilityCount > 0) {
        const warnMsg = missingLandmarkName || "Unable to clearly detect the required body position. Please adjust your camera.";
        if (this.onTelemetryUpdate) {
          this.onTelemetryUpdate({
            status: "warning",
            exercise: this.activeConfig.name,
            score: 50,
            angle: 0,
            phase: "Occlusion / Adjust Camera",
            reps: this.activeConfig.is_hold_exercise ? `Hold: ${Math.round(this.holdSeconds || 0)}s` : this.repCount,
            feedback: [warnMsg],
            simulated: false,
            landmarkWarning: warnMsg
          });
        }
        this.drawSkeleton(ctx, lm, canvas.width, canvas.height, "#f59e0b");
        if (ctx) ctx.restore();
        return;
      }

      // Compute Biomechanical Joint Angles & Metrics
      const leftElbowAngle = calculateAngle(lm[LANDMARKS.LEFT_SHOULDER], lm[LANDMARKS.LEFT_ELBOW], lm[LANDMARKS.LEFT_WRIST]);
      const rightElbowAngle = calculateAngle(lm[LANDMARKS.RIGHT_SHOULDER], lm[LANDMARKS.RIGHT_ELBOW], lm[LANDMARKS.RIGHT_WRIST]);
      const leftKneeAngle = calculateAngle(lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.LEFT_KNEE], lm[LANDMARKS.LEFT_ANKLE]);
      const rightKneeAngle = calculateAngle(lm[LANDMARKS.RIGHT_HIP], lm[LANDMARKS.RIGHT_KNEE], lm[LANDMARKS.RIGHT_ANKLE]);
      const torsoInclineAngle = calculateAngle(lm[LANDMARKS.LEFT_SHOULDER], lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.LEFT_KNEE]);

      const plankDev = calculatePointLineDistance(lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.LEFT_SHOULDER], lm[LANDMARKS.LEFT_ANKLE]) * 100;
      const hipVsLine = (lm[LANDMARKS.LEFT_HIP].y - (lm[LANDMARKS.LEFT_SHOULDER].y + lm[LANDMARKS.LEFT_ANKLE].y)/2);

      const metrics = {
        leftElbowAngle,
        rightElbowAngle,
        primarySideElbowAngle: leftElbowAngle,
        leftKneeAngle,
        rightKneeAngle,
        primarySideKneeAngle: leftKneeAngle,
        torsoInclineAngle,
        plankAlignmentDev: plankDev,
        hipHeightVsLine: hipVsLine,
        armSymmetryDiff: Math.abs(leftElbowAngle - rightElbowAngle),
        legSymmetryDiff: Math.abs(leftKneeAngle - rightKneeAngle),
        elbowDriftDistance: Math.abs(lm[LANDMARKS.LEFT_ELBOW].x - lm[LANDMARKS.LEFT_SHOULDER].x),
        lowerBackArch: Math.abs(torsoInclineAngle - 180),
        leftElbowTuck: calculateAngle(lm[LANDMARKS.LEFT_WRIST], lm[LANDMARKS.LEFT_ELBOW], lm[LANDMARKS.LEFT_HIP])
      };

      // Analyze against exercise rules
      const analysis = this.activeConfig.analyze(lm, metrics);

      // Repetition / Hold Tracking
      let displayReps = this.repCount;
      if (this.activeConfig.is_hold_exercise) {
        if (!this.holdStartTime) this.holdStartTime = Date.now();
        this.holdSeconds = (Date.now() - this.holdStartTime) / 1000;
        displayReps = `Hold: ${Math.round(this.holdSeconds)}s`;
      } else {
        const repThresholds = this.activeConfig.rep_thresholds || { start: 150, peak: 85 };
        const currentAngle = analysis.primaryAngle;

        if (this.repState === 'START' && currentAngle <= repThresholds.peak) {
          this.repState = 'PEAK';
        } else if (this.repState === 'PEAK' && currentAngle >= repThresholds.start) {
          this.repCount++;
          this.repState = 'START';
        }
        displayReps = this.repCount;
      }

      // Draw Color-Coded Pose Skeleton
      const skeletonColor = analysis.score >= 85 ? "#10b981" : (analysis.score >= 70 ? "#f59e0b" : "#ef4444");
      this.drawSkeleton(ctx, lm, canvas.width, canvas.height, skeletonColor);

      if (ctx) ctx.restore();

      // Emit Telemetry
      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({
          status: "success",
          exercise: this.activeConfig.name,
          score: Math.max(50, Math.min(100, Math.round(analysis.score))),
          angle: analysis.primaryAngle,
          phase: analysis.phase,
          reps: displayReps,
          feedback: analysis.feedback,
          simulated: false,
          landmarkWarning: null
        });
      }
    }

    // Render skeleton joints & connections on video overlay
    drawSkeleton(ctx, lm, width, height, color) {
      if (!ctx) return;
      const connections = [
        [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],
        [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW],
        [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
        [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_ELBOW],
        [LANDMARKS.RIGHT_ELBOW, LANDMARKS.RIGHT_WRIST],
        [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP],
        [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_HIP],
        [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
        [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
        [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
        [LANDMARKS.RIGHT_HIP, LANDMARKS.RIGHT_KNEE],
        [LANDMARKS.RIGHT_KNEE, LANDMARKS.RIGHT_ANKLE]
      ];

      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.fillStyle = "#ffffff";

      connections.forEach(([start, end]) => {
        const p1 = lm[start];
        const p2 = lm[end];
        if (p1 && p2 && (p1.visibility === undefined || p1.visibility > 0.4) && (p2.visibility === undefined || p2.visibility > 0.4)) {
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        }
      });

      Object.values(LANDMARKS).forEach(idx => {
        const point = lm[idx];
        if (point && (point.visibility === undefined || point.visibility > 0.4)) {
          ctx.beginPath();
          ctx.arc(point.x * width, point.y * height, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      });
    }
  }

  // Singleton instance
  const instance = new AIFormCheckerEngine();
  return instance;
})();
