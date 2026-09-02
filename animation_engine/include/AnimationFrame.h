#ifndef ANIMATION_FRAME_H
#define ANIMATION_FRAME_H

#include "Joint.h"
#include <string>
#include <vector>
#include <map>

namespace FitSync {

struct JointPose {
    JointId jointId;
    float x;
    float y;
    float rotation;
};

struct EquipmentPose {
    std::string type; // barbell, dumbbell, cable, handles, bench
    float x;
    float y;
    float rotation;
    float scaleX;
    float scaleY;
};

struct AnimationFrame {
    float timestamp; // normalized 0.0 to 1.0 within phase or total duration
    std::string phaseName; // start, lower, bottom, push, top
    std::vector<JointPose> jointPoses;
    EquipmentPose equipment;
    std::map<std::string, float> muscleActivations; // muscle -> intensity [0.0 - 1.0]

    AnimationFrame();
};

AnimationFrame interpolateFrames(const AnimationFrame& f1, const AnimationFrame& f2, float t);

} // namespace FitSync

#endif // ANIMATION_FRAME_H
