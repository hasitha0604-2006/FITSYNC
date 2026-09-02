#include "../include/AnimationEngine.h"
#include <sstream>
#include <iostream>

namespace FitSync {

AnimationEngine::AnimationEngine()
    : playing(true), speed(1.0f), currentProgress(0.0f), currentRep(1), targetReps(10), cycleDuration(3.0f), activeExerciseId("") {}

AnimationEngine::~AnimationEngine() {}

bool AnimationEngine::initialize() {
    playing = true;
    speed = 1.0f;
    currentProgress = 0.0f;
    currentRep = 1;
    return true;
}

void AnimationEngine::registerExercise(const ExerciseAnimation& anim) {
    exerciseRegistry[anim.getId()] = anim;
}

bool AnimationEngine::hasExercise(const std::string& exerciseId) const {
    return exerciseRegistry.find(exerciseId) != exerciseRegistry.end();
}

bool AnimationEngine::loadExercise(const std::string& exerciseId) {
    auto it = exerciseRegistry.find(exerciseId);
    if (it != exerciseRegistry.end()) {
        activeExerciseId = exerciseId;
        muscleMap.setPrimaryMuscles(it->second.getPrimaryMuscles());
        muscleMap.setSecondaryMuscles(it->second.getSecondaryMuscles());
        currentProgress = 0.0f;
        currentRep = 1;
        return true;
    }
    return false;
}

void AnimationEngine::update(float deltaTime) {
    if (!playing || activeExerciseId.empty()) return;

    float effectiveDelta = (deltaTime * speed) / cycleDuration;
    currentProgress += effectiveDelta;

    if (currentProgress >= 1.0f) {
        currentProgress -= 1.0f;
        currentRep++;
        if (targetReps > 0 && currentRep > targetReps) {
            currentRep = targetReps;
            currentProgress = 0.999f;
            playing = false;
        }
    }
}

void AnimationEngine::play() { playing = true; }
void AnimationEngine::pause() { playing = false; }
void AnimationEngine::restart() { currentProgress = 0.0f; currentRep = 1; playing = true; }
void AnimationEngine::setSpeed(float speedMultiplier) { speed = speedMultiplier; }
void AnimationEngine::setRepetitionCount(int count) { targetReps = count; }

std::string AnimationEngine::getCurrentPhase() const {
    if (activeExerciseId.empty() || exerciseRegistry.find(activeExerciseId) == exerciseRegistry.end()) {
        return "start";
    }
    AnimationFrame frame = exerciseRegistry.at(activeExerciseId).evaluate(currentProgress);
    return frame.phaseName;
}

RenderState AnimationEngine::getRenderState() const {
    if (activeExerciseId.empty() || exerciseRegistry.find(activeExerciseId) == exerciseRegistry.end()) {
        return RenderState();
    }
    const ExerciseAnimation& anim = exerciseRegistry.at(activeExerciseId);
    AnimationFrame frame = anim.evaluate(currentProgress);
    MuscleMap mm = muscleMap;
    mm.updateActivation(frame.muscleActivations);
    return renderer.prepareRenderState(frame, mm, currentRep, currentProgress);
}

std::string AnimationEngine::getRenderStateJson() const {
    RenderState state = getRenderState();
    std::stringstream ss;
    ss << "{";
    ss << "\"phase\":\"" << state.currentPhase << "\",";
    ss << "\"rep\":" << state.currentRep << ",";
    ss << "\"progress\":" << state.progress << ",";
    ss << "\"equipment\":{\"type\":\"" << state.equipment.type << "\",\"x\":" << state.equipment.x << ",\"y\":" << state.equipment.y << "},";
    ss << "\"joints\":[";
    for (size_t i = 0; i < state.joints.size(); ++i) {
        ss << "{\"id\":" << state.joints[i].id << ",\"name\":\"" << state.joints[i].name << "\",\"x\":" << state.joints[i].x << ",\"y\":" << state.joints[i].y << "}";
        if (i + 1 < state.joints.size()) ss << ",";
    }
    ss << "]}";
    return ss.str();
}

} // namespace FitSync
