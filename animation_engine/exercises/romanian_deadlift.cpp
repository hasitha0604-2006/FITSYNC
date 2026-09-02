#include "../include/ExerciseAnimation.h"
#include "../include/Joint.h"

namespace FitSync {

ExerciseAnimation createRomanianDeadliftAnimation() {
    ExerciseAnimation anim("romanian_deadlift", "Romanian Deadlift", "hinge", "barbell");
    anim.setPrimaryMuscles({"Hamstrings", "Glutes"});
    anim.setSecondaryMuscles({"Lower Back", "Forearms"});

    // Frame 0: Standing Tall Setup
    AnimationFrame f0;
    f0.timestamp = 0.0f;
    f0.phaseName = "Standing Setup";
    f0.equipment = {"barbell", 200.0f, 150.0f, 0.0f, 1.0f, 1.0f};
    f0.jointPoses = {
        {JointId::HEAD, 200.0f, 40.0f, 0.0f},
        {JointId::NECK, 200.0f, 60.0f, 0.0f},
        {JointId::CHEST, 200.0f, 90.0f, 0.0f},
        {JointId::SPINE, 200.0f, 120.0f, 0.0f},
        {JointId::PELVIS, 200.0f, 150.0f, 0.0f},
        {JointId::LEFT_SHOULDER, 180.0f, 90.0f, 0.0f},
        {JointId::LEFT_ELBOW, 180.0f, 120.0f, 0.0f},
        {JointId::LEFT_WRIST, 185.0f, 150.0f, 0.0f},
        {JointId::RIGHT_SHOULDER, 220.0f, 90.0f, 0.0f},
        {JointId::RIGHT_ELBOW, 220.0f, 120.0f, 0.0f},
        {JointId::RIGHT_WRIST, 215.0f, 150.0f, 0.0f},
        {JointId::LEFT_HIP, 185.0f, 150.0f, 0.0f},
        {JointId::LEFT_KNEE, 185.0f, 200.0f, 0.0f},
        {JointId::LEFT_ANKLE, 185.0f, 250.0f, 0.0f},
        {JointId::RIGHT_HIP, 215.0f, 150.0f, 0.0f},
        {JointId::RIGHT_KNEE, 215.0f, 200.0f, 0.0f},
        {JointId::RIGHT_ANKLE, 215.0f, 250.0f, 0.0f}
    };
    f0.muscleActivations = {{"Hamstrings", 0.5f}, {"Glutes", 0.5f}};

    // Frame 1: Hip Hinge & Bar Passing Knees
    AnimationFrame f1;
    f1.timestamp = 0.5f;
    f1.phaseName = "Max Hamstring Stretch";
    f1.equipment = {"barbell", 200.0f, 205.0f, 0.0f, 1.0f, 1.0f};
    f1.jointPoses = {
        {JointId::HEAD, 240.0f, 90.0f, 0.0f},
        {JointId::NECK, 230.0f, 105.0f, 0.0f},
        {JointId::CHEST, 215.0f, 125.0f, 0.0f},
        {JointId::SPINE, 190.0f, 145.0f, 0.0f},
        {JointId::PELVIS, 160.0f, 155.0f, 0.0f},
        {JointId::LEFT_SHOULDER, 215.0f, 125.0f, 0.0f},
        {JointId::LEFT_ELBOW, 208.0f, 165.0f, 0.0f},
        {JointId::LEFT_WRIST, 200.0f, 205.0f, 0.0f},
        {JointId::RIGHT_SHOULDER, 215.0f, 125.0f, 0.0f},
        {JointId::RIGHT_ELBOW, 208.0f, 165.0f, 0.0f},
        {JointId::RIGHT_WRIST, 200.0f, 205.0f, 0.0f},
        {JointId::LEFT_HIP, 160.0f, 155.0f, 0.0f},
        {JointId::LEFT_KNEE, 175.0f, 205.0f, 0.0f},
        {JointId::LEFT_ANKLE, 185.0f, 250.0f, 0.0f},
        {JointId::RIGHT_HIP, 160.0f, 155.0f, 0.0f},
        {JointId::RIGHT_KNEE, 175.0f, 205.0f, 0.0f},
        {JointId::RIGHT_ANKLE, 185.0f, 250.0f, 0.0f}
    };
    f1.muscleActivations = {{"Hamstrings", 1.0f}, {"Glutes", 0.9f}};

    // Frame 2: Stand Back Up
    AnimationFrame f2 = f0;
    f2.timestamp = 1.0f;
    f2.phaseName = "Lockout & Glute Squeeze";

    anim.addKeyframe(f0);
    anim.addKeyframe(f1);
    anim.addKeyframe(f2);

    return anim;
}

} // namespace FitSync
