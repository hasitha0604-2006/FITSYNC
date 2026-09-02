#ifndef ANIMATION_ENGINE_H
#define ANIMATION_ENGINE_H

#include "ExerciseAnimation.h"
#include "MuscleMap.h"
#include "Renderer.h"
#include <string>
#include <memory>
#include <map>

namespace FitSync {

class AnimationEngine {
public:
    AnimationEngine();
    ~AnimationEngine();

    bool initialize();
    bool loadExercise(const std::string& exerciseId);
    void update(float deltaTime);

    void play();
    void pause();
    void restart();
    void setSpeed(float speedMultiplier);
    void setRepetitionCount(int targetReps); // 0 = continuous

    bool isPlaying() const { return playing; }
    float getSpeed() const { return speed; }
    int getCurrentRep() const { return currentRep; }
    int getTargetReps() const { return targetReps; }
    float getProgress() const { return currentProgress; }
    std::string getCurrentPhase() const;

    RenderState getRenderState() const;
    std::string getRenderStateJson() const;

    void registerExercise(const ExerciseAnimation& anim);
    bool hasExercise(const std::string& exerciseId) const;

private:
    bool playing;
    float speed;
    float currentProgress; // 0.0 to 1.0 within 1 rep cycle
    int currentRep;
    int targetReps;
    float cycleDuration;

    std::string activeExerciseId;
    std::map<std::string, ExerciseAnimation> exerciseRegistry;
    MuscleMap muscleMap;
    Renderer renderer;
};

} // namespace FitSync

#endif // ANIMATION_ENGINE_H
