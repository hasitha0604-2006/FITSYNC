/**
 * FitSync AI — Exercise-Specific Animation & Video Player Engine
 * 
 * Strict architectural rules:
 * 1. Every exercise is bound to its own canonical media asset (exercise_id / slug).
 * 2. Never show generic or wrong exercise video fallbacks.
 * 3. Graceful, professional fallback UI when video is unavailable.
 * 4. Strict video switching: previous video halts immediately upon exercise change.
 * 5. Full HTML5 controls: autoplay (muted), loop, playsinline, controls, speed, replay, fullscreen.
 */

(function(window) {
  'use strict';

  class FitSyncExercisePlayer {
    constructor() {
      this.container = null;
      this.currentEx = null;
      this.videoElement = null;
      this.isPlaying = false;
      this.playbackRate = 1.0;
      this.isMuted = true;
      this.containerId = null;
      this._timeUpdateHandler = null;
      this._errorHandler = null;
    }

    /**
     * Stop and cleanup any currently running video or animations
     */
    destroy() {
      if (this.videoElement) {
        try {
          this.videoElement.pause();
          this.videoElement.removeAttribute('src');
          this.videoElement.load();
        } catch (e) {
          // Ignore teardown errors
        }
        if (this._timeUpdateHandler && this.videoElement) {
          this.videoElement.removeEventListener('timeupdate', this._timeUpdateHandler);
        }
        if (this._errorHandler && this.videoElement) {
          this.videoElement.removeEventListener('error', this._errorHandler);
        }
        this.videoElement = null;
      }
      this.isPlaying = false;
      if (this.container) {
        this.container.innerHTML = '';
      }
    }

    /**
     * Normalize and validate exercise data
     */
    sanitizeExerciseData(ex) {
      if (!ex) return null;
      const id = ex.id || ex.exercise_id || null;
      const name = ex.name || 'Unknown Exercise';
      const slug = ex.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const category = ex.category || 'General';
      const primaryMuscles = Array.isArray(ex.primary_muscles) ? ex.primary_muscles : (ex.primary_muscles ? [ex.primary_muscles] : [category]);
      const secondaryMuscles = Array.isArray(ex.secondary_muscles) ? ex.secondary_muscles : [];
      const primaryMuscle = ex.primary_muscle || (primaryMuscles.length ? primaryMuscles[0] : category);
      
      const instructions = Array.isArray(ex.instructions) ? ex.instructions : (typeof ex.instructions === 'string' && ex.instructions ? ex.instructions.split('\n') : []);
      const commonMistakes = Array.isArray(ex.common_mistakes) ? ex.common_mistakes : (typeof ex.common_mistakes === 'string' && ex.common_mistakes ? ex.common_mistakes.split('\n') : []);
      const safetyNotes = ex.safety_notes || 'Maintain controlled form throughout the movement.';

      return {
        id: id,
        exercise_id: id,
        name: name,
        slug: slug,
        category: category,
        primary_muscles: primaryMuscles,
        secondary_muscles: secondaryMuscles,
        primary_muscle: primaryMuscle,
        equipment: ex.equipment || 'Gym Equipment',
        difficulty: ex.difficulty || 'Intermediate',
        instructions: instructions,
        common_mistakes: commonMistakes,
        safety_notes: safetyNotes,
        start_pos: ex.start_pos || 'Establish solid starting posture and anchor points.',
        movement: ex.movement || 'Execute concentric & eccentric motion under strict control.',
        end_pos: ex.end_pos || 'Hold contraction at peak and return to starting alignment.',
        working_location: ex.working_location || primaryMuscle,
        joint_action: ex.joint_action || 'Joint Flexion & Extension',
        demo_video: ex.demo_video || null,
        media_path: ex.media_path || null,
        media_type: ex.media_type || 'mp4',
        media_status: ex.media_status || (ex.demo_video ? 'available' : 'missing'),
        media_available: Boolean(ex.media_available || (ex.demo_video && ex.media_status === 'available'))
      };
    }

    /**
     * Mount exercise player in container element
     */
    async mount(containerId, exerciseData) {
      this.containerId = containerId;
      this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!this.container) {
        console.warn(`[FitSyncPlayer] Container element #${containerId} not found.`);
        return;
      }

      // Step 1: Tear down previous video immediately to prevent wrong video bugs
      this.destroy();

      // Step 2: If exercise data is an ID, fetch canonical metadata from API
      if (typeof exerciseData === 'number' || (typeof exerciseData === 'string' && !isNaN(exerciseData))) {
        try {
          const res = await fetch(`/api/exercises/${exerciseData}`);
          if (res.ok) {
            const json = await res.json();
            exerciseData = json.exercise || json;
          }
        } catch (err) {
          console.error('[FitSyncPlayer] Failed to fetch exercise metadata:', err);
        }
      }

      this.currentEx = this.sanitizeExerciseData(exerciseData);
      if (!this.currentEx) {
        this.renderUnavailableFallback('Exercise details not found.');
        return;
      }

      // Step 3: Validate video asset availability
      const canonicalSlug = this.currentEx.slug;
      const expectedVideoPath = `/static/exercise_media/${canonicalSlug}.mp4`;
      const videoSource = this.currentEx.demo_video || (this.currentEx.media_available ? expectedVideoPath : null);

      if (this.currentEx.media_available && videoSource) {
        this.renderVideoPlayer(videoSource);
      } else {
        this.renderUnavailableFallback();
      }
    }

    /**
     * Render responsive HTML5 video player with custom controls
     */
    renderVideoPlayer(videoSrc) {
      const ex = this.currentEx;
      const primaryMuscle = ex.primary_muscle || ex.category;

      const playerHtml = `
        <div class="fitsync-video-wrapper relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
          <!-- Video Viewport Container (16:9 Aspect Ratio) -->
          <div class="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
            <video
              id="fitsync-active-video"
              class="w-full h-full object-contain cursor-pointer"
              autoplay
              muted
              loop
              playsinline
              preload="metadata"
              aria-label="Demonstration video for ${ex.name}"
            >
              <source src="${videoSrc}" type="video/mp4" />
              Your browser does not support HTML5 video playback.
            </video>

            <!-- Video Overlay Badges -->
            <div class="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-10">
              <span class="bg-slate-950/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ${ex.name}
              </span>
              <span class="bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg">
                ${primaryMuscle}
              </span>
            </div>

            <!-- Big Center Play/Pause Indicator -->
            <div id="video-center-indicator" class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300 z-10">
              <div class="h-16 w-16 rounded-full bg-slate-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-2xl backdrop-blur-md">
                <span id="center-indicator-icon" class="text-2xl font-black">▶</span>
              </div>
            </div>
          </div>

          <!-- Interactive Control Bar -->
          <div class="bg-slate-900 border-t border-slate-800/90 p-3 flex flex-col gap-2 z-20">
            <!-- Timeline Scrubber Bar -->
            <div class="w-full flex items-center gap-2">
              <span id="video-time-current" class="text-[10px] font-mono font-bold text-slate-400 shrink-0">0:00</span>
              <div id="video-progress-track" class="relative flex-1 h-2 bg-slate-950 rounded-full overflow-hidden cursor-pointer border border-slate-800">
                <div id="video-progress-bar" class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-0 transition-all duration-100"></div>
              </div>
              <span id="video-time-total" class="text-[10px] font-mono font-bold text-slate-400 shrink-0">0:00</span>
            </div>

            <!-- Buttons Row -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <!-- Play/Pause Toggle -->
                <button
                  type="button"
                  id="btn-player-toggle"
                  class="h-8 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95"
                  title="Play / Pause"
                >
                  <span id="btn-toggle-label">⏸ Pause</span>
                </button>

                <!-- Replay Button -->
                <button
                  type="button"
                  id="btn-player-replay"
                  class="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Replay from start"
                >
                  <span>🔁 Replay</span>
                </button>

                <!-- Speed Switcher -->
                <button
                  type="button"
                  id="btn-player-speed"
                  class="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold font-mono transition-colors"
                  title="Playback Speed"
                >
                  <span id="speed-label">1.0x</span>
                </button>
              </div>

              <div class="flex items-center gap-2">
                <!-- Mute Toggle -->
                <button
                  type="button"
                  id="btn-player-mute"
                  class="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors"
                  title="Toggle Sound"
                >
                  <span id="mute-label">🔇 Muted</span>
                </button>

                <!-- Fullscreen Toggle -->
                <button
                  type="button"
                  id="btn-player-fullscreen"
                  class="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
                  title="Fullscreen"
                >
                  <span>⛶ Fullscreen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      this.container.innerHTML = playerHtml;
      this.attachVideoEvents();
    }

    /**
     * Attach control listeners to the active HTML5 video
     */
    attachVideoEvents() {
      const video = this.container.querySelector('#fitsync-active-video');
      if (!video) return;

      this.videoElement = video;
      this.isPlaying = true;
      this.playbackRate = 1.0;
      this.isMuted = true;

      const btnToggle = this.container.querySelector('#btn-player-toggle');
      const toggleLabel = this.container.querySelector('#btn-toggle-label');
      const btnReplay = this.container.querySelector('#btn-player-replay');
      const btnSpeed = this.container.querySelector('#btn-player-speed');
      const speedLabel = this.container.querySelector('#speed-label');
      const btnMute = this.container.querySelector('#btn-player-mute');
      const muteLabel = this.container.querySelector('#mute-label');
      const btnFullscreen = this.container.querySelector('#btn-player-fullscreen');
      const timeCurrent = this.container.querySelector('#video-time-current');
      const timeTotal = this.container.querySelector('#video-time-total');
      const progressBar = this.container.querySelector('#video-progress-bar');
      const progressTrack = this.container.querySelector('#video-progress-track');
      const centerIndicator = this.container.querySelector('#video-center-indicator');
      const centerIcon = this.container.querySelector('#center-indicator-icon');

      const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      };

      const flashCenterIndicator = (icon) => {
        if (!centerIndicator || !centerIcon) return;
        centerIcon.innerText = icon;
        centerIndicator.classList.remove('opacity-0');
        centerIndicator.classList.add('opacity-100');
        setTimeout(() => {
          centerIndicator.classList.remove('opacity-100');
          centerIndicator.classList.add('opacity-0');
        }, 400);
      };

      const togglePlay = () => {
        if (video.paused) {
          video.play().then(() => {
            this.isPlaying = true;
            if (toggleLabel) toggleLabel.innerText = '⏸ Pause';
            flashCenterIndicator('▶');
          }).catch(() => {});
        } else {
          video.pause();
          this.isPlaying = false;
          if (toggleLabel) toggleLabel.innerText = '▶ Play';
          flashCenterIndicator('⏸');
        }
      };

      if (btnToggle) btnToggle.onclick = togglePlay;
      video.onclick = togglePlay;

      if (btnReplay) {
        btnReplay.onclick = () => {
          video.currentTime = 0;
          video.play();
          this.isPlaying = true;
          if (toggleLabel) toggleLabel.innerText = '⏸ Pause';
          flashCenterIndicator('🔁');
        };
      }

      const speeds = [1.0, 1.5, 0.5];
      let speedIdx = 0;
      if (btnSpeed) {
        btnSpeed.onclick = () => {
          speedIdx = (speedIdx + 1) % speeds.length;
          this.playbackRate = speeds[speedIdx];
          video.playbackRate = this.playbackRate;
          if (speedLabel) speedLabel.innerText = `${this.playbackRate.toFixed(1)}x`;
        };
      }

      if (btnMute) {
        btnMute.onclick = () => {
          video.muted = !video.muted;
          this.isMuted = video.muted;
          if (muteLabel) muteLabel.innerText = video.muted ? '🔇 Muted' : '🔊 Sound';
        };
      }

      if (btnFullscreen) {
        btnFullscreen.onclick = () => {
          if (!document.fullscreenElement) {
            const wrapper = this.container.querySelector('.fitsync-video-wrapper');
            if (wrapper && wrapper.requestFullscreen) {
              wrapper.requestFullscreen();
            } else if (video.requestFullscreen) {
              video.requestFullscreen();
            }
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
          }
        };
      }

      this._timeUpdateHandler = () => {
        if (!video.duration) return;
        const pct = (video.currentTime / video.duration) * 100;
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (timeCurrent) timeCurrent.innerText = formatTime(video.currentTime);
        if (timeTotal) timeTotal.innerText = formatTime(video.duration);
      };
      video.addEventListener('timeupdate', this._timeUpdateHandler);

      video.addEventListener('loadedmetadata', () => {
        if (timeTotal) timeTotal.innerText = formatTime(video.duration);
      });

      if (progressTrack) {
        progressTrack.onclick = (e) => {
          const rect = progressTrack.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          if (video.duration) {
            video.currentTime = clickPos * video.duration;
          }
        };
      }

      this._errorHandler = () => {
        console.warn(`[FitSyncPlayer] Video playback failed for ${this.currentEx.name}. Displaying verified fallback.`);
        this.renderUnavailableFallback('Video file format or asset currently not available on server.');
      };
      video.addEventListener('error', this._errorHandler);
    }

    /**
     * Render professional, accessible fallback UI when animation video is unavailable.
     * NEVER substitutes another exercise's video.
     */
    renderUnavailableFallback(customReason) {
      const ex = this.currentEx || {
        name: 'Selected Exercise',
        category: 'Fitness',
        primary_muscles: ['Target Muscle'],
        secondary_muscles: [],
        instructions: ['Follow prescribed movement with controlled tempo.'],
        safety_notes: 'Maintain core stability and proper form.'
      };

      const primary = ex.primary_muscle || ex.category;
      const secondaries = ex.secondary_muscles || [];
      const instructionsList = ex.instructions || [];

      const fallbackHtml = `
        <div class="fitsync-fallback-card relative w-full bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 select-none">
          <!-- Unavailable Notice Banner -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 shadow-inner">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <span class="text-base">🎬</span>
              </div>
              <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-amber-400">Animation unavailable for this exercise</h4>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  ${customReason || 'Exact kinematic video asset is queued for studio capture. Verified biomechanical instructions are provided below.'}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onclick="window.initExerciseMotionPlayer('${this.containerId}', ${JSON.stringify(ex).replace(/"/g, '&quot;')})"
              class="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <span>🔄 Retry</span>
            </button>
          </div>

          <!-- Exercise Identity Header -->
          <div class="flex items-start justify-between border-b border-slate-800/80 pb-3">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded">
                ${ex.category}
              </span>
              <h3 class="text-lg font-black text-white mt-1 leading-tight">${ex.name}</h3>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-400 block">Equipment</span>
              <span class="text-xs font-bold text-slate-200">${ex.equipment || 'Gym Equipment'}</span>
            </div>
          </div>

          <!-- Muscle Involvement Chips -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Musculature</span>
            <div class="flex flex-wrap gap-1.5 items-center">
              <span class="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                Primary: ${primary}
              </span>
              ${secondaries.map(sec => `
                <span class="text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg">
                  ${sec}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Biomechanical Movement Checkpoints -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
            <div class="bg-slate-900/80 border border-slate-800/90 rounded-xl p-2.5">
              <span class="text-[9px] font-black uppercase text-primary-400 block">1. Start Position</span>
              <p class="text-slate-300 mt-0.5">${ex.start_pos || 'Position figure in starting alignment.'}</p>
            </div>
            <div class="bg-slate-900/80 border border-slate-800/90 rounded-xl p-2.5">
              <span class="text-[9px] font-black uppercase text-emerald-400 block">2. Movement Execution</span>
              <p class="text-slate-300 mt-0.5">${ex.movement || 'Execute concentric contraction under control.'}</p>
            </div>
            <div class="bg-slate-900/80 border border-slate-800/90 rounded-xl p-2.5">
              <span class="text-[9px] font-black uppercase text-cyan-400 block">3. Peak Contraction</span>
              <p class="text-slate-300 mt-0.5">${ex.end_pos || 'Squeeze target muscle and return safely.'}</p>
            </div>
          </div>

          <!-- Step-by-Step Instructions -->
          ${instructionsList.length ? `
            <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-800 space-y-1.5">
              <h5 class="text-[10px] font-bold uppercase tracking-wider text-slate-300">How to Perform:</h5>
              <ol class="list-decimal list-inside space-y-1 text-xs text-slate-300 leading-relaxed">
                ${instructionsList.map(step => `<li>${step}</li>`).join('')}
              </ol>
            </div>
          ` : ''}

          <!-- Safety Guidelines -->
          <div class="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <span class="text-base shrink-0">🛡️</span>
            <span><strong>Safety note:</strong> ${ex.safety_notes}</span>
      const togglePlay = () => {
        if (video.paused) {
          video.play().then(() => {
            this.isPlaying = true;
            if (toggleLabel) toggleLabel.innerText = '⏸ Pause';
            flashCenterIndicator('▶');
          }).catch(() => {});
        } else {
          video.pause();
          this.isPlaying = false;
          if (toggleLabel) toggleLabel.innerText = '▶ Play';
          flashCenterIndicator('⏸');
        }
      };

      if (btnToggle) btnToggle.onclick = togglePlay;
      video.onclick = togglePlay;

      if (btnReplay) {
        btnReplay.onclick = () => {
          video.currentTime = 0;
          video.play();
          this.isPlaying = true;
          if (toggleLabel) toggleLabel.innerText = '⏸ Pause';
          flashCenterIndicator('🔁');
        };
      }

      const speeds = [1.0, 1.5, 0.5];
      let speedIdx = 0;
      if (btnSpeed) {
        btnSpeed.onclick = () => {
          speedIdx = (speedIdx + 1) % speeds.length;
          this.playbackRate = speeds[speedIdx];
          video.playbackRate = this.playbackRate;
          if (speedLabel) speedLabel.innerText = `${this.playbackRate.toFixed(1)}x`;
        };
      }

      if (btnMute) {
        btnMute.onclick = () => {
          video.muted = !video.muted;
          this.isMuted = video.muted;
          if (muteLabel) muteLabel.innerText = video.muted ? '🔇 Muted' : '🔊 Sound';
        };
      }

      if (btnFullscreen) {
        btnFullscreen.onclick = () => {
          if (!document.fullscreenElement) {
            const wrapper = this.container.querySelector('.fitsync-video-wrapper');
            if (wrapper && wrapper.requestFullscreen) {
              wrapper.requestFullscreen();
            } else if (video.requestFullscreen) {
              video.requestFullscreen();
            }
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
          }
        };
      }

      this._timeUpdateHandler = () => {
        if (!video.duration) return;
        const pct = (video.currentTime / video.duration) * 100;
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (timeCurrent) timeCurrent.innerText = formatTime(video.currentTime);
        if (timeTotal) timeTotal.innerText = formatTime(video.duration);
      };
      video.addEventListener('timeupdate', this._timeUpdateHandler);

      video.addEventListener('loadedmetadata', () => {
        if (timeTotal) timeTotal.innerText = formatTime(video.duration);
      });

      if (progressTrack) {
        progressTrack.onclick = (e) => {
          const rect = progressTrack.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          if (video.duration) {
            video.currentTime = clickPos * video.duration;
          }
        };
      }

      this._errorHandler = () => {
        console.warn(`[FitSyncPlayer] Video playback failed for ${this.currentEx.name}. Displaying verified fallback.`);
        this.renderUnavailableFallback('Video file format or asset currently not available on server.');
      };
      video.addEventListener('error', this._errorHandler);
    }

    /**
     * Render professional, accessible fallback UI when animation video is unavailable.
     * NEVER substitutes another exercise's video.
     */
    renderUnavailableFallback(customReason) {
      const ex = this.currentEx || {
        name: 'Selected Exercise',
        category: 'Fitness',
        primary_muscles: ['Target Muscle'],
        secondary_muscles: [],
        instructions: ['Follow prescribed movement with controlled tempo.'],
        safety_notes: 'Maintain core stability and proper form.'
      };

      const primary = ex.primary_muscle || ex.category;
      const secondaries = ex.secondary_muscles || [];
      const instructionsList = ex.instructions || [];

      const fallbackHtml = `
        <div class="fitsync-fallback-card relative w-full bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 select-none">
          <!-- Unavailable Notice Banner -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 shadow-inner">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <span class="text-base">🎬</span>
              </div>
              <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-amber-400">Animation unavailable for this exercise</h4>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  ${customReason || 'Exact kinematic video asset is queued for studio capture. Verified biomechanical instructions are provided below.'}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onclick="window.initExerciseMotionPlayer('${this.containerId}', ${JSON.stringify(ex).replace(/"/g, '&quot;')})"
              class="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <span>🔄 Retry</span>
            </button>
          </div>

          <!-- Exercise Identity Header -->
          <div class="flex items-start justify-between border-b border-slate-800/80 pb-3">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded">
                ${ex.category}
              </span>
              <h3 class="text-lg font-black text-white mt-1 leading-tight">${ex.name}</h3>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-400 block">Equipment</span>
              <span class="text-xs font-bold text-slate-200">${ex.equipment || 'Gym Equipment'}</span>
            </div>
          </div>

          <!-- Muscle Involvement Chips -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Musculature</span>
            <div class="flex flex-wrap gap-1.5 items-center">
              <span class="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                Primary: ${primary}
              </span>
              ${secondaries.map(sec => `
                <span class="text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg">
                  ${sec}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Biomechanical Movement Checkpoints -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
            <div class="bg-slate-900/80 border border-slate-800/90 rounded-xl p-2.5">
              <span class="text-[9px] font-black uppercase text-primary-400 block">1. Start Position</span>
              <p class="text-slate-300 mt-0.5">${ex.start_pos || 'Position figure in starting alignment.'}</p>
            </div>
            <div class="bg-slate-900/80 border border-slate-800/90 rounded-xl p-2.5">
              <span class="text-[9px] font-black uppercase text-emerald-400 block">2. Movement Execution</span>
              <p class="text-slate-300 mt-0.5">${ex.movement || 'Execute concentric contraction under control.'}</p>
            </div>
            <div class="bg-slate-900/80 border border-slate-800/90 rounded-xl p-2.5">
              <span class="text-[9px] font-black uppercase text-cyan-400 block">3. Peak Contraction</span>
              <p class="text-slate-300 mt-0.5">${ex.end_pos || 'Squeeze target muscle and return safely.'}</p>
            </div>
          </div>

          <!-- Step-by-Step Instructions -->
          ${instructionsList.length ? `
            <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-800 space-y-1.5">
              <h5 class="text-[10px] font-bold uppercase tracking-wider text-slate-300">How to Perform:</h5>
              <ol class="list-decimal list-inside space-y-1 text-xs text-slate-300 leading-relaxed">
                ${instructionsList.map(step => `<li>${step}</li>`).join('')}
              </ol>
            </div>
          ` : ''}

          <!-- Safety Guidelines -->
          <div class="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <span class="text-base shrink-0">🛡️</span>
            <span><strong>Safety note:</strong> ${ex.safety_notes}</span>
          </div>
        </div>
      `;

      this.container.innerHTML = fallbackHtml;
    }
  }

  class BiomechanicalPlayer {
    constructor() {
      this.isPlaying = true;
      this.speed = 1.0;
      this.progress = 0;
      this.direction = 1;
      this.animationFrameId = null;
    }

    renderArmCurl(k) { return '<g id="arm-curl"></g>'; }
    renderChestPress(k) { return '<g id="chest-press"></g>'; }
    renderOverheadPress(k) { return '<g id="overhead-press"></g>'; }
    renderSquat(k) { return '<g id="squat"></g>'; }
    renderDeadlift(k) { return '<g id="deadlift"></g>'; }
    renderRowPull(k) { return '<g id="row-pull"></g>'; }
    renderLunge(k) { return '<g id="lunge"></g>'; }
    renderLateralRaise(k) { return '<g id="lateral-raise"></g>'; }
    renderTricepExt(k) { return '<g id="tricep-ext"></g>'; }
    renderCorePlank(k) { return '<g id="core-plank"></g>'; }
    renderLegIso(k) { return '<g id="leg-iso"></g>'; }

    mount(containerId, exerciseData) {
      if (window.initExerciseMotionPlayer) {
        return window.initExerciseMotionPlayer(containerId, exerciseData);
      }
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  // Active singleton player instance tracking
  window.__activeMotionPlayer = new FitSyncExercisePlayer();
  window.FitSyncExercisePlayer = FitSyncExercisePlayer;
  window.BiomechanicalPlayer = BiomechanicalPlayer;

  /**
   * Main entry point called by templates and exercise components
   */
  window.initExerciseMotionPlayer = function(containerId, exerciseData) {
    if (!window.__activeMotionPlayer) {
      window.__activeMotionPlayer = new FitSyncExercisePlayer();
    }
    window.__activeMotionPlayer.mount(containerId, exerciseData);
    return window.__activeMotionPlayer;
  };

  /**
   * Dedicated video player helper alias
   */
  window.mountExerciseVideoPlayer = function(containerId, exerciseData) {
    return window.initExerciseMotionPlayer(containerId, exerciseData);
  };

})(window);
