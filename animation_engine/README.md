# FitSync AI C++ Animation Engine

Modular C++ 2D skeletal animation engine for high-performance exercise demonstrations in FitSync AI.

## Structure
- `include/`: C++ header files (`AnimationEngine.h`, `ExerciseAnimation.h`, `Joint.h`, `MuscleMap.h`, `AnimationFrame.h`, `Renderer.h`)
- `src/`: Core engine implementations
- `exercises/`: Individual C++ exercise animation keyframe configurations
- `CMakeLists.txt`: Build specification for native & WASM targets
- `build_wasm.sh` / `build_wasm.bat`: Emscripten compilation scripts

## Features
- 19-joint 2D skeletal hierarchy
- Phase-based linear and cubic joint angle interpolation
- Dynamic muscle activation mapping
- Equipment position & rotation tracking
- Compiled to WebAssembly for browser execution with JS Fallback Bridge.
