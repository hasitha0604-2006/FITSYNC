cmake_minimum_required(VERSION 3.10)
project(FitSyncAnimationEngine CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

file(GLOB SOURCES 
    "src/*.cpp"
    "exercises/*.cpp"
)

add_library(fitsync_animation_engine STATIC ${SOURCES})

# Test executable for local validation
add_executable(animation_engine_test main_test.cpp ${SOURCES})

# Emscripten WASM build configuration
if(EMSCRIPTEN)
    set_target_properties(fitsync_animation_engine PROPERTIES OUTPUT_NAME "animation_engine")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -s WASM=1 -s EXPORTED_RUNTIME_METHODS='[\"cwrap\",\"ccall\"]'")
endif()
