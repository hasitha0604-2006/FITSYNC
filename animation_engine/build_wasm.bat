@echo off
REM FitSync AI - WebAssembly Build Script for Windows Emscripten
echo Building FitSync Animation Engine with Emscripten...
if not exist build_wasm mkdir build_wasm
cd build_wasm

call emcmake cmake .. -DCMAKE_BUILD_TYPE=Release
call emmake make

if not exist ..\..\static\wasm mkdir ..\..\static\wasm
copy animation_engine.js ..\..\static\wasm\
copy animation_engine.wasm ..\..\static\wasm\

echo WebAssembly build complete!
cd ..
