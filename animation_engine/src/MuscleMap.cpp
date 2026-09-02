#include "../include/MuscleMap.h"
#include <algorithm>

namespace FitSync {

MuscleMap::MuscleMap() {}

void MuscleMap::setPrimaryMuscles(const std::vector<std::string>& primaries) {
    primaryMuscles = primaries;
}

void MuscleMap::setSecondaryMuscles(const std::vector<std::string>& secondaries) {
    secondaryMuscles = secondaries;
}

void MuscleMap::updateActivation(const std::map<std::string, float>& activations) {
    currentActivations = activations;
}

std::vector<MuscleInfo> MuscleMap::getActiveMuscles() const {
    std::vector<MuscleInfo> result;

    for (const auto& m : primaryMuscles) {
        MuscleInfo info;
        info.id = m;
        info.name = m;
        info.category = "Primary";
        info.isPrimary = true;
        info.currentActivation = getMuscleActivation(m);
        result.push_back(info);
    }

    for (const auto& m : secondaryMuscles) {
        MuscleInfo info;
        info.id = m;
        info.name = m;
        info.category = "Secondary";
        info.isPrimary = false;
        info.currentActivation = getMuscleActivation(m);
        result.push_back(info);
    }

    return result;
}

float MuscleMap::getMuscleActivation(const std::string& muscleId) const {
    auto it = currentActivations.find(muscleId);
    if (it != currentActivations.end()) {
        return it->second;
    }
    // Default baseline if listed as primary or secondary
    if (std::find(primaryMuscles.begin(), primaryMuscles.end(), muscleId) != primaryMuscles.end()) {
        return 0.8f;
    }
    if (std::find(secondaryMuscles.begin(), secondaryMuscles.end(), muscleId) != secondaryMuscles.end()) {
        return 0.4f;
    }
    return 0.1f;
}

} // namespace FitSync
