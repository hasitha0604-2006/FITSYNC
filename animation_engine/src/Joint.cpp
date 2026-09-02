#include "../include/Joint.h"

namespace FitSync {

Joint::Joint()
    : id(JointId::HEAD), name("head"), x(200.0f), y(40.0f), rotation(0.0f), parentId(-1), minRotation(-180.0f), maxRotation(180.0f) {}

Joint::Joint(JointId jId, const std::string& jName, float jX, float jY, float jRot, int parent)
    : id(jId), name(jName), x(jX), y(jY), rotation(jRot), parentId(parent), minRotation(-180.0f), maxRotation(180.0f) {}

std::vector<BoneSegment> getStandardSkeletonBones() {
    return {
        {JointId::HEAD, JointId::NECK, "head_neck", 12.0f},
        {JointId::NECK, JointId::CHEST, "neck_chest", 14.0f},
        {JointId::CHEST, JointId::SPINE, "chest_spine", 16.0f},
        {JointId::SPINE, JointId::PELVIS, "spine_pelvis", 18.0f},

        {JointId::CHEST, JointId::LEFT_SHOULDER, "chest_left_shoulder", 10.0f},
        {JointId::LEFT_SHOULDER, JointId::LEFT_ELBOW, "left_upper_arm", 10.0f},
        {JointId::LEFT_ELBOW, JointId::LEFT_WRIST, "left_forearm", 8.0f},

        {JointId::CHEST, JointId::RIGHT_SHOULDER, "chest_right_shoulder", 10.0f},
        {JointId::RIGHT_SHOULDER, JointId::RIGHT_ELBOW, "right_upper_arm", 10.0f},
        {JointId::RIGHT_ELBOW, JointId::RIGHT_WRIST, "right_forearm", 8.0f},

        {JointId::PELVIS, JointId::LEFT_HIP, "pelvis_left_hip", 12.0f},
        {JointId::LEFT_HIP, JointId::LEFT_KNEE, "left_thigh", 14.0f},
        {JointId::LEFT_KNEE, JointId::LEFT_ANKLE, "left_shin", 12.0f},
        {JointId::LEFT_ANKLE, JointId::LEFT_FOOT, "left_foot", 8.0f},

        {JointId::PELVIS, JointId::RIGHT_HIP, "pelvis_right_hip", 12.0f},
        {JointId::RIGHT_HIP, JointId::RIGHT_KNEE, "right_thigh", 14.0f},
        {JointId::RIGHT_KNEE, JointId::RIGHT_ANKLE, "right_shin", 12.0f},
        {JointId::RIGHT_ANKLE, JointId::RIGHT_FOOT, "right_foot", 8.0f}
    };
}

std::string jointIdToString(JointId id) {
    switch(id) {
        case JointId::HEAD: return "head";
        case JointId::NECK: return "neck";
        case JointId::LEFT_SHOULDER: return "left_shoulder";
        case JointId::RIGHT_SHOULDER: return "right_shoulder";
        case JointId::LEFT_ELBOW: return "left_elbow";
        case JointId::RIGHT_ELBOW: return "right_elbow";
        case JointId::LEFT_WRIST: return "left_wrist";
        case JointId::RIGHT_WRIST: return "right_wrist";
        case JointId::CHEST: return "chest";
        case JointId::SPINE: return "spine";
        case JointId::PELVIS: return "pelvis";
        case JointId::LEFT_HIP: return "left_hip";
        case JointId::RIGHT_HIP: return "right_hip";
        case JointId::LEFT_KNEE: return "left_knee";
        case JointId::RIGHT_KNEE: return "right_knee";
        case JointId::LEFT_ANKLE: return "left_ankle";
        case JointId::RIGHT_ANKLE: return "right_ankle";
        case JointId::LEFT_FOOT: return "left_foot";
        case JointId::RIGHT_FOOT: return "right_foot";
        default: return "unknown";
    }
}

JointId stringToJointId(const std::string& str) {
    if (str == "head") return JointId::HEAD;
    if (str == "neck") return JointId::NECK;
    if (str == "left_shoulder") return JointId::LEFT_SHOULDER;
    if (str == "right_shoulder") return JointId::RIGHT_SHOULDER;
    if (str == "left_elbow") return JointId::LEFT_ELBOW;
    if (str == "right_elbow") return JointId::RIGHT_ELBOW;
    if (str == "left_wrist") return JointId::LEFT_WRIST;
    if (str == "right_wrist") return JointId::RIGHT_WRIST;
    if (str == "chest") return JointId::CHEST;
    if (str == "spine") return JointId::SPINE;
    if (str == "pelvis") return JointId::PELVIS;
    if (str == "left_hip") return JointId::LEFT_HIP;
    if (str == "right_hip") return JointId::RIGHT_HIP;
    if (str == "left_knee") return JointId::LEFT_KNEE;
    if (str == "right_knee") return JointId::RIGHT_KNEE;
    if (str == "left_ankle") return JointId::LEFT_ANKLE;
    if (str == "right_ankle") return JointId::RIGHT_ANKLE;
    if (str == "left_foot") return JointId::LEFT_FOOT;
    if (str == "right_foot") return JointId::RIGHT_FOOT;
    return JointId::HEAD;
}

} // namespace FitSync
