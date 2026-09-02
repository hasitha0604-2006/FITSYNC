#!/bin/bash
# FitSync AI - WebAssembly Build Script for C++ Animation Engine
set -e

echo "Building FitSync Animation Engine with Emscripten..."
mkdir -p build_wasm
cd build_wasm

emcmake cmake .. -DCMAKE_BUILD_TYPE=Release
emmake make

echo "Copying compiled WASM output to static assets..."
mkdir -p ../../static/wasm
cp animation_engine.js ../../static/wasm/
cp animation_engine.wasm ../../static/wasm/

echo "WebAssembly compilation completed successfully!"
