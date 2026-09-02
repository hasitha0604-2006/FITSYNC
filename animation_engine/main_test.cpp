#include "include/AnimationEngine.h"
#include "include/ExerciseAnimation.h"
#include <iostream>
#include <cassert>

namespace FitSync {
    ExerciseAnimation createBenchPressAnimation();
}

int main() {
    std::cout << "FitSync AI C++ Animation Engine Core Test" << std::endl;

    FitSync::AnimationEngine engine;
    bool initOk = engine.initialize();
    assert(initOk && "Engine initialization failed");

    FitSync::ExerciseAnimation benchPress = FitSync::createBenchPressAnimation();
    engine.registerExercise(benchPress);
    assert(engine.hasExercise("bench_press") && "Bench press registration failed");

    bool loadOk = engine.loadExercise("bench_press");
    assert(loadOk && "Bench press loading failed");

    engine.update(0.5f); // Update delta 0.5s
    FitSync::RenderState state = engine.getRenderState();
    std::cout << "Current Phase: " << state.currentPhase << std::endl;
    std::cout << "Joints Rendered: " << state.joints.size() << std::endl;
    std::cout << "Bones Rendered: " << state.bones.size() << std::endl;

    std::cout << "C++ Animation Engine verification SUCCESSFUL!" << std::endl;
    return 0;
}
