#ifndef MUSCLE_MAP_H
#define MUSCLE_MAP_H

#include <string>
#include <vector>
#include <map>

namespace FitSync {

enum class MuscleGroup {
    CHEST,
    UPPER_BACK,
    LATS,
    FRONT_DELTOID,
    SIDE_DELTOID,
    REAR_DELTOID,
    BICEPS,
    TRICEPS,
    FOREARMS,
    QUADRICEPS,
    HAMSTRINGS,
    GLUTES,
    CALVES,
    ABS,
    OBLES,
    LOWER_BACK
};

struct MuscleInfo {
    std::string id;
    std::string name;
    std::string category;
    bool isPrimary;
    float currentActivation; // 0.0 to 1.0
};

class MuscleMap {
public:
    MuscleMap();

    void setPrimaryMuscles(const std::vector<std::string>& primaries);
    void setSecondaryMuscles(const std::vector<std::string>& secondaries);
    void updateActivation(const std::map<std::string, float>& activations);

    std::vector<MuscleInfo> getActiveMuscles() const;
    float getMuscleActivation(const std::string& muscleId) const;

private:
    std::vector<std::string> primaryMuscles;
    std::vector<std::string> secondaryMuscles;
    std::map<std::string, float> currentActivations;
};

} // namespace FitSync

#endif // MUSCLE_MAP_H
