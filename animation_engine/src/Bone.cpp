#include "../include/Bone.h"
#include <cmath>

namespace FitSync {

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

Bone::Bone()
    : startJoint(JointId::NECK), endJoint(JointId::CHEST), name("spine"), length(40.0f), thickness(12.0f), rotation(0.0f) {}

Bone::Bone(JointId startJ, JointId endJ, const std::string& boneName, float lengthVal, float thicknessVal)
    : startJoint(startJ), endJoint(endJ), name(boneName), length(lengthVal), thickness(thicknessVal), rotation(0.0f) {}

void Bone::calculateEndPosition(float startX, float startY, float& endX, float& endY) const {
    float rad = rotation * (static_cast<float>(M_PI) / 180.0f);
    endX = startX + length * std::cos(rad);
    endY = startY + length * std::sin(rad);
}

} // namespace FitSync
