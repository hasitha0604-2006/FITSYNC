#ifndef JOINT_H
#define JOINT_H

#include <string>
#include <vector>

namespace FitSync {

enum class JointId {
    HEAD = 0,
    NECK,
    LEFT_SHOULDER,
    RIGHT_SHOULDER,
    LEFT_ELBOW,
    RIGHT_ELBOW,
    LEFT_WRIST,
    RIGHT_WRIST,
    CHEST,
    SPINE,
    PELVIS,
    LEFT_HIP,
    RIGHT_HIP,
    LEFT_KNEE,
    RIGHT_KNEE,
    LEFT_ANKLE,
    RIGHT_ANKLE,
    LEFT_FOOT,
    RIGHT_FOOT,
    COUNT
};

struct Joint {
    JointId id;
    std::string name;
    float x;
    float y;
    float rotation; // in degrees
    int parentId;   // -1 if root
    float minRotation;
    float maxRotation;

    Joint();
    Joint(JointId jId, const std::string& jName, float jX, float jY, float jRot = 0.0f, int parent = -1);
};

struct BoneSegment {
    JointId startJoint;
    JointId endJoint;
    std::string name;
    float thickness;
};

std::vector<BoneSegment> getStandardSkeletonBones();
std::string jointIdToString(JointId id);
JointId stringToJointId(const std::string& str);

} // namespace FitSync

#endif // JOINT_H
