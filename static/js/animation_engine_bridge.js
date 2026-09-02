/**
 * FitSync AI — C++ WebAssembly & Kinematic Fallback Animation Engine Bridge
 */

(function(window) {
    'use strict';

    class AnimationEngineBridge {
        constructor() {
            this.wasmModule = null;
            this.isWasmLoaded = false;
            this.activeExerciseConfig = null;
        }

        async initWasm() {
            try {
                if (window.Module && window.Module._initializeEngine) {
                    this.wasmModule = window.Module;
                    this.isWasmLoaded = true;
                    console.log("[FitSync WASM] C++ Engine initialized successfully.");
                    return true;
                }
            } catch (err) {
                console.warn("[FitSync WASM] WebAssembly notice: Using JS Kinematic Engine.", err);
            }
            this.isWasmLoaded = false;
            return false;
        }

        async fetchAnimationConfig(exerciseId) {
            try {
                const res = await fetch(`/api/exercises/${exerciseId}/animation-config`);
                const data = await res.json();
                if (data.status === 'success') {
                    this.activeExerciseConfig = data.config.animation_data;
                    return this.activeExerciseConfig;
                }
            } catch (err) {
                console.error("[AnimationBridge] Failed to fetch animation config", err);
            }
            return null;
        }
    }

    window.FitSyncAnimationBridge = new AnimationEngineBridge();
})(window);
