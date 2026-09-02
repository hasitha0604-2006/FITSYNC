#include "../include/ExerciseAnimation.h"
#include "../include/Joint.h"

namespace FitSync {

ExerciseAnimation createBenchPressAnimation() {
    ExerciseAnimation anim("bench_press", "Barbell Bench Press", "push", "barbell");
    anim.setPrimaryMuscles({"chest"});
    anim.setSecondaryMuscles({"triceps", "front_deltoid"});

    // Frame 0: Start / Lockout at top
    AnimationFrame f0;
    f0.timestamp = 0.0f;
    f0.phaseName = "Starting Position";
    f0.equipment = {"barbell", 200.0f, 110.0f, 0.0f, 1.0f, 1.0f};
    f0.jointPoses = {
        {JointId::HEAD, 280.0f, 190.0f, 0.0f},
        {JointId::CHEST, 200.0f, 190.0f, 0.0f},
        {JointId::PELVIS, 140.0f, 190.0f, 0.0f},
        {JointId::LEFT_KNEE, 110.0f, 220.0f, 0.0f},
        {JointId::LEFT_ANKLE, 110.0f, 250.0f, 0.0f},
        {JointId::LEFT_SHOULDER, 210.0f, 190.0f, 0.0f},
        {JointId::LEFT_ELBOW, 210.0f, 150.0f, 0.0f},
        {JointId::LEFT_WRIST, 200.0f, 110.0f, 0.0f}
    };
    f0.muscleActivations = {{"chest", 0.6f}, {"triceps", 0.5f}};

    // Frame 1: Lowering / Eccentric
    AnimationFrame f1;
    f1.timestamp = 0.35f;
    f1.phaseName = "Lowering Weight";
    f1.equipment = {"barbell", 200.0f, 150.0f, 0.0f, 1.0f, 1.0f};
    f1.jointPoses = {
        {JointId::HEAD, 280.0f, 190.0f, 0.0f},
        {JointId::CHEST, 200.0f, 190.0f, 0.0f},
        {JointId::PELVIS, 140.0f, 190.0f, 0.0f},
        {JointId::LEFT_KNEE, 110.0f, 220.0f, 0.0f},
        {JointId::LEFT_ANKLE, 110.0f, 250.0f, 0.0f},
        {JointId::LEFT_SHOULDER, 210.0f, 190.0f, 0.0f},
        {JointId::LEFT_ELBOW, 230.0f, 175.0f, 0.0f},
        {JointId::LEFT_WRIST, 200.0f, 150.0f, 0.0f}
    };
    f1.muscleActivations = {{"chest", 0.9f}, {"triceps", 0.7f}};

    // Frame 2: Bottom Position
    AnimationFrame f2;
    f2.timestamp = 0.50f;
    f2.phaseName = "Bottom Chest Touch";
    f2.equipment = {"barbell", 200.0f, 175.0f, 0.0f, 1.0f, 1.0f};
    f2.jointPoses = {
        {JointId::HEAD, 280.0f, 190.0f, 0.0f},
        {JointId::CHEST, 200.0f, 190.0f, 0.0f},
        {JointId::PELVIS, 140.0f, 190.0f, 0.0f},
        {JointId::LEFT_KNEE, 110.0f, 220.0f, 0.0f},
        {JointId::LEFT_ANKLE, 110.0f, 250.0f, 0.0f},
        {JointId::LEFT_SHOULDER, 210.0f, 190.0f, 0.0f},
        {JointId::LEFT_ELBOW, 240.0f, 195.0f, 0.0f},
        {JointId::LEFT_WRIST, 200.0f, 175.0f, 0.0f}
    };
    f2.muscleActivations = {{"chest", 1.0f}, {"triceps", 0.8f}};

    // Frame 3: Pushing Up / Concentric
    AnimationFrame f3;
    f3.timestamp = 0.85f;
    f3.phaseName = "Pushing Upward";
    f3.equipment = {"barbell", 200.0f, 130.0f, 0.0f, 1.0f, 1.0f};
    f3.jointPoses = {
        {JointId::HEAD, 280.0f, 190.0f, 0.0f},
        {JointId::CHEST, 200.0f, 190.0f, 0.0f},
        {JointId::PELVIS, 140.0f, 190.0f, 0.0f},
        {JointId::LEFT_KNEE, 110.0f, 220.0f, 0.0f},
        {JointId::LEFT_ANKLE, 110.0f, 250.0f, 0.0f},
        {JointId::LEFT_SHOULDER, 210.0f, 190.0f, 0.0f},
        {JointId::LEFT_ELBOW, 220.0f, 160.0f, 0.0f},
        {JointId::LEFT_WRIST, 200.0f, 130.0f, 0.0f}
    };
    f3.muscleActivations = {{"chest", 0.95f}, {"triceps", 0.9f}};

    // Frame 4: Top Position / Lockout
    AnimationFrame f4 = f0;
    f4.timestamp = 1.0f;
    f4.phaseName = "Lockout & Squeeze";

    anim.addKeyframe(f0);
    anim.addKeyframe(f1);
    anim.addKeyframe(f2);
    anim.addKeyframe(f3);
    anim.addKeyframe(f4);

    return anim;
}

} // namespace FitSync
