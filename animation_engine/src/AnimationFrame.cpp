#include "../include/AnimationFrame.h"
#include <cmath>

namespace FitSync {

AnimationFrame::AnimationFrame()
    : timestamp(0.0f), phaseName("start") {
    equipment.type = "none";
    equipment.x = 200.0f;
    equipment.y = 140.0f;
    equipment.rotation = 0.0f;
    equipment.scaleX = 1.0f;
    equipment.scaleY = 1.0f;
}

AnimationFrame interpolateFrames(const AnimationFrame& f1, const AnimationFrame& f2, float t) {
    if (t <= 0.0f) return f1;
    if (t >= 1.0f) return f2;

    AnimationFrame result;
    result.timestamp = f1.timestamp + t * (f2.timestamp - f1.timestamp);
    result.phaseName = (t < 0.5f) ? f1.phaseName : f2.phaseName;

    // Interpolate equipment
    result.equipment.type = f1.equipment.type;
    result.equipment.x = f1.equipment.x + t * (f2.equipment.x - f1.equipment.x);
    result.equipment.y = f1.equipment.y + t * (f2.equipment.y - f1.equipment.y);
    result.equipment.rotation = f1.equipment.rotation + t * (f2.equipment.rotation - f1.equipment.rotation);
    result.equipment.scaleX = f1.equipment.scaleX + t * (f2.equipment.scaleX - f1.equipment.scaleX);
    result.equipment.scaleY = f1.equipment.scaleY + t * (f2.equipment.scaleY - f1.equipment.scaleY);

    // Interpolate joint poses
    std::map<JointId, JointPose> map1, map2;
    for (const auto& jp : f1.jointPoses) map1[jp.jointId] = jp;
    for (const auto& jp : f2.jointPoses) map2[jp.jointId] = jp;

    for (const auto& pair : map1) {
        JointId jId = pair.first;
        JointPose p1 = pair.second;
        JointPose p2 = (map2.find(jId) != map2.end()) ? map2[jId] : p1;

        JointPose res;
        res.jointId = jId;
        res.x = p1.x + t * (p2.x - p1.x);
        res.y = p1.y + t * (p2.y - p1.y);
        res.rotation = p1.rotation + t * (p2.rotation - p1.rotation);

        result.jointPoses.push_back(res);
    }

    // Interpolate muscle activations
    for (const auto& pair : f1.muscleActivations) {
        std::string mId = pair.first;
        float v1 = pair.second;
        float v2 = (f2.muscleActivations.find(mId) != f2.muscleActivations.end()) ? f2.muscleActivations.at(mId) : v1;
        result.muscleActivations[mId] = v1 + t * (v2 - v1);
    }

    return result;
}

} // namespace FitSync
