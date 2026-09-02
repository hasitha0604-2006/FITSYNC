#include "../include/ExerciseAnimation.h"
#include <algorithm>

namespace FitSync {

ExerciseAnimation::ExerciseAnimation()
    : id("default"), name("Default Exercise"), movementType("push"), equipment("bodyweight") {}

ExerciseAnimation::ExerciseAnimation(const std::string& exId, const std::string& exName, const std::string& mType, const std::string& eq)
    : id(exId), name(exName), movementType(mType), equipment(eq) {}

void ExerciseAnimation::addKeyframe(const AnimationFrame& frame) {
    keyframes.push_back(frame);
}

void ExerciseAnimation::addPhase(const std::string& phaseName, float duration) {
    AnimationPhase phase;
    phase.name = phaseName;
    phase.duration = duration;
    phase.startFrameIndex = 0;
    phase.endFrameIndex = 0;
    phases.push_back(phase);
}

void ExerciseAnimation::setPrimaryMuscles(const std::vector<std::string>& primaries) {
    primaryMuscles = primaries;
}

void ExerciseAnimation::setSecondaryMuscles(const std::vector<std::string>& secondaries) {
    secondaryMuscles = secondaries;
}

AnimationFrame ExerciseAnimation::evaluate(float progress) const {
    if (keyframes.empty()) {
        return AnimationFrame();
    }
    if (keyframes.size() == 1) {
        return keyframes[0];
    }

    // Clamp progress 0.0 - 1.0
    progress = std::max(0.0f, std::min(1.0f, progress));

    // Find bounding keyframes
    size_t f1 = 0;
    size_t f2 = 0;

    for (size_t i = 0; i < keyframes.size() - 1; ++i) {
        if (progress >= keyframes[i].timestamp && progress <= keyframes[i+1].timestamp) {
            f1 = i;
            f2 = i + 1;
            break;
        }
    }

    if (f1 == f2) {
        return keyframes[keyframes.size() - 1];
    }

    float t1 = keyframes[f1].timestamp;
    float t2 = keyframes[f2].timestamp;
    float factor = (t2 > t1) ? (progress - t1) / (t2 - t1) : 0.0f;

    return interpolateFrames(keyframes[f1], keyframes[f2], factor);
}

} // namespace FitSync
