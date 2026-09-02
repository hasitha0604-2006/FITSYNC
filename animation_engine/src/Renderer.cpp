#include "../include/Renderer.h"
#include "../include/Joint.h"
#include <map>

namespace FitSync {

Renderer::Renderer() {}

RenderState Renderer::prepareRenderState(const AnimationFrame& frame, const MuscleMap& muscleMap, int currentRep, float progress) {
    RenderState state;
    state.currentPhase = frame.phaseName;
    state.currentRep = currentRep;
    state.progress = progress;
    state.equipment = frame.equipment;
    state.muscles = muscleMap.getActiveMuscles();

    // Map joint poses to RenderJointData
    std::map<JointId, JointPose> poseMap;
    for (const auto& jp : frame.jointPoses) {
        poseMap[jp.jointId] = jp;

        RenderJointData rj;
        rj.id = static_cast<int>(jp.jointId);
        rj.name = jointIdToString(jp.jointId);
        rj.x = jp.x;
        rj.y = jp.y;
        state.joints.push_back(rj);
    }

    // Connect standard skeleton bones
    std::vector<BoneSegment> standardBones = getStandardSkeletonBones();
    for (const auto& bone : standardBones) {
        if (poseMap.find(bone.startJoint) != poseMap.end() && poseMap.find(bone.endJoint) != poseMap.end()) {
            RenderBoneData rb;
            rb.startJointId = static_cast<int>(bone.startJoint);
            rb.endJointId = static_cast<int>(bone.endJoint);
            rb.name = bone.name;
            rb.startX = poseMap[bone.startJoint].x;
            rb.startY = poseMap[bone.startJoint].y;
            rb.endX = poseMap[bone.endJoint].x;
            rb.endY = poseMap[bone.endJoint].y;
            state.bones.push_back(rb);
        }
    }

    return state;
}

} // namespace FitSync
