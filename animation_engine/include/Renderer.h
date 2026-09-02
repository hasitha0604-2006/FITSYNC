#ifndef RENDERER_H
#define RENDERER_H

#include "AnimationFrame.h"
#include "MuscleMap.h"
#include <string>
#include <vector>

namespace FitSync {

struct RenderJointData {
    int id;
    std::string name;
    float x;
    float y;
};

struct RenderBoneData {
    int startJointId;
    int endJointId;
    std::string name;
    float startX;
    float startY;
    float endX;
    float endY;
};

struct RenderState {
    std::vector<RenderJointData> joints;
    std::vector<RenderBoneData> bones;
    EquipmentPose equipment;
    std::string currentPhase;
    int currentRep;
    float progress;
    std::vector<MuscleInfo> muscles;
};

class Renderer {
public:
    Renderer();
    RenderState prepareRenderState(const AnimationFrame& frame, const MuscleMap& muscleMap, int currentRep, float progress);
};

} // namespace FitSync

#endif // RENDERER_H
