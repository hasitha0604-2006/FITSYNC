#ifndef BONE_H
#define BONE_H

#include "Joint.h"
#include <string>

namespace FitSync {

class Bone {
public:
    Bone();
    Bone(JointId startJ, JointId endJ, const std::string& boneName, float lengthVal, float thicknessVal);

    JointId getStartJoint() const { return startJoint; }
    JointId getEndJoint() const { return endJoint; }
    std::string getName() const { return name; }
    float getLength() const { return length; }
    float getThickness() const { return thickness; }
    float getRotation() const { return rotation; }

    void setRotation(float rot) { rotation = rot; }
    void calculateEndPosition(float startX, float startY, float& endX, float& endY) const;

private:
    JointId startJoint;
    JointId endJoint;
    std::string name;
    float length;
    float thickness;
    float rotation; // in degrees
};

} // namespace FitSync

#endif // BONE_H
