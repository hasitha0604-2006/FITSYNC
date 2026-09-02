#ifndef EXERCISE_ANIMATION_H
#define EXERCISE_ANIMATION_H

#include "AnimationFrame.h"
#include "MuscleMap.h"
#include <string>
#include <vector>

namespace FitSync {

struct AnimationPhase {
    std::string name; // start, lower, bottom, push, top
    float duration;   // in seconds
    int startFrameIndex;
    int endFrameIndex;
};

class ExerciseAnimation {
public:
    ExerciseAnimation();
    ExerciseAnimation(const std::string& exId, const std::string& exName, const std::string& mType, const std::string& eq);

    void addKeyframe(const AnimationFrame& frame);
    void addPhase(const std::string& phaseName, float duration);

    AnimationFrame evaluate(float progress) const; // progress [0.0 - 1.0]

    std::string getId() const { return id; }
    std::string getName() const { return name; }
    std::string getMovementType() const { return movementType; }
    std::string getEquipment() const { return equipment; }

    void setPrimaryMuscles(const std::vector<std::string>& primaries);
    void setSecondaryMuscles(const std::vector<std::string>& secondaries);

    std::vector<std::string> getPrimaryMuscles() const { return primaryMuscles; }
    std::vector<std::string> getSecondaryMuscles() const { return secondaryMuscles; }
    std::vector<AnimationPhase> getPhases() const { return phases; }
    size_t getKeyframeCount() const { return keyframes.size(); }

private:
    std::string id;
    std::string name;
    std::string movementType; // push, pull, squat, hinge, lunge, iso
    std::string equipment;    // barbell, dumbbell, bodyweight, cable, machine

    std::vector<AnimationFrame> keyframes;
    std::vector<AnimationPhase> phases;
    std::vector<std::string> primaryMuscles;
    std::vector<std::string> secondaryMuscles;
};

} // namespace FitSync

#endif // EXERCISE_ANIMATION_H
