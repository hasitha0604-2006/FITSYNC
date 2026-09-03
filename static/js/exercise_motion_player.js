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
     * Map any exercise to its biomechanical kinematic class
     */
    detectMotionClass(category, name, slug) {
      const s = (slug + ' ' + name + ' ' + category).toLowerCase();

      if (s.includes('curl') || s.includes('bicep')) return 'curl';
      if (s.includes('bench') || s.includes('push_up') || s.includes('push up') || s.includes('chest_press') || s.includes('fly') || s.includes('pec') || s.includes('crossover') || s.includes('svend')) return 'chest_press';
      if (s.includes('overhead') || s.includes('military') || s.includes('arnold') || s.includes('shoulder_press') || s.includes('pike')) return 'overhead_press';
      if (s.includes('squat') || s.includes('leg_press') || s.includes('wall_sit')) return 'squat';
      if (s.includes('deadlift') || s.includes('hip_thrust') || s.includes('glute_bridge') || s.includes('hyperextension')) return 'deadlift';
      if (s.includes('row') || s.includes('pull_up') || s.includes('pullup') || s.includes('chin_up') || s.includes('pulldown') || s.includes('shrug') || s.includes('hang')) return 'row_pull';
      if (s.includes('lunge') || s.includes('split_squat') || s.includes('step_up')) return 'lunge';
      if (s.includes('lateral_raise') || s.includes('front_raise') || s.includes('face_pull') || s.includes('reverse_fly') || s.includes('upright_row')) return 'lateral_raise';
      if (s.includes('tricep') || s.includes('skull_crusher') || s.includes('kickback') || s.includes('diamond_push')) return 'tricep_ext';
      if (s.includes('plank') || s.includes('crunch') || s.includes('twist') || s.includes('rollout') || s.includes('leg_raise') || s.includes('hollow') || s.includes('woodchopper')) return 'core_plank';
      if (s.includes('burpee') || s.includes('swing') || s.includes('thruster') || s.includes('jump') || s.includes('battle_rope') || s.includes('mountain_climber') || s.includes('cardio')) return 'cardio_hiit';
      if (s.includes('stretch') || s.includes('cat_cow') || s.includes('mobility') || s.includes('rotation')) return 'mobility_stretch';
      
      return 'squat';
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

      // Step 3: Validate video asset availability & motion class
      this.motionClass = this.detectMotionClass(this.currentEx.category, this.currentEx.name, this.currentEx.slug);
      const canonicalSlug = this.currentEx.slug;
      const expectedVideoPath = `/static/exercise_media/${canonicalSlug}.mp4`;
      const videoSource = this.currentEx.demo_video || (this.currentEx.media_available ? expectedVideoPath : null);

      if (this.currentEx.media_available && videoSource) {
        this.mode = 'video';
        this.renderVideoPlayer(videoSource);
      } else {
        this.mode = 'kinematic';
        this.renderKinematicPlayer();
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
        console.warn(`[FitSyncPlayer] Video playback failed for ${this.currentEx.name}. Falling back to 60fps Kinematic Animator.`);
        this.mode = 'kinematic';
        this.renderKinematicPlayer();
      };
      video.addEventListener('error', this._errorHandler);
    }

    /**
     * Render Interactive 60fps Biomechanical Motion Animation Player
     */
    renderKinematicPlayer() {
      const ex = this.currentEx;
      const primaryMuscle = ex.primary_muscle || ex.category;

      const playerHtml = `
        <div class="fitsync-motion-container relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
          <div class="p-3 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span class="font-extrabold text-white text-xs tracking-wide">${ex.name}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">${ex.category}</span>
            </div>
            <div class="flex items-center gap-2">
              <span id="biomech-phase-badge" class="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                CONCENTRIC CONTRACTION
              </span>
              <span class="text-[10px] font-bold text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Reps: <strong id="biomech-rep-counter" class="text-emerald-400">0</strong>
              </span>
            </div>
          </div>

          <div class="relative w-full aspect-video bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden group cursor-pointer" id="biomech-canvas-box">
            <svg class="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#38bdf8" stroke-width="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>

            <svg id="biomech-rig-svg" viewBox="0 0 400 280" class="w-full h-full max-w-[460px] max-h-[280px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              <defs>
                <filter id="glow-primary" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <line x1="60" y1="242" x2="340" y2="242" stroke="#334155" stroke-width="4" stroke-linecap="round" />
              <line x1="120" y1="246" x2="280" y2="246" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />

              <g id="biomech-rig-group"></g>
            </svg>

            <div class="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none z-10">
              <span id="biomech-breath-cue" class="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Exhale on concentric lift</span>
              </span>
            </div>

            <div class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex flex-col items-end pointer-events-none z-10">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Prime Mover</span>
              <span class="text-xs font-black text-emerald-400">${primaryMuscle}</span>
            </div>

            <div id="biomech-center-indicator" class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300 z-10">
              <div class="h-16 w-16 rounded-full bg-slate-950/90 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-2xl backdrop-blur-md">
                <span id="biomech-center-icon" class="text-2xl font-black">▶</span>
              </div>
            </div>
          </div>

          <div class="bg-slate-900 border-t border-slate-800/90 p-3 flex flex-col gap-2 z-20">
            <div class="w-full flex items-center gap-2">
              <span class="text-[10px] font-mono font-bold text-slate-400 shrink-0">0%</span>
              <input 
                type="range" 
                id="biomech-scrubber" 
                min="0" 
                max="100" 
                value="0" 
                class="flex-1 h-2 bg-slate-950 rounded-full appearance-none cursor-pointer accent-emerald-500 border border-slate-800"
              />
              <span id="biomech-scrub-val" class="text-[10px] font-mono font-bold text-emerald-400 shrink-0 w-8 text-right">0%</span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  id="biomech-play-btn" 
                  class="h-8 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95"
                >
                  <span id="biomech-play-icon">⏸</span>
                  <span id="biomech-play-text">Pause</span>
                </button>

                <button 
                  type="button" 
                  id="biomech-replay-btn" 
                  class="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                  title="Replay from start"
                >
                  <span>🔁 Replay</span>
                </button>

                <button 
                  type="button" 
                  id="biomech-speed-btn" 
                  class="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold font-mono transition-colors"
                  title="Cycle Playback Speed"
                >
                  <span id="biomech-speed-label">1.0x</span>
                </button>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  id="biomech-fullscreen-btn" 
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
      this.attachKinematicEvents();
      this.startKinematicLoop();
    }

    attachKinematicEvents() {
      const playBtn = this.container.querySelector('#biomech-play-btn');
      const replayBtn = this.container.querySelector('#biomech-replay-btn');
      const speedBtn = this.container.querySelector('#biomech-speed-btn');
      const speedLabel = this.container.querySelector('#biomech-speed-label');
      const scrubber = this.container.querySelector('#biomech-scrubber');
      const canvasBox = this.container.querySelector('#biomech-canvas-box');
      const fullscreenBtn = this.container.querySelector('#biomech-fullscreen-btn');

      const togglePlay = () => {
        this.isPlaying = !this.isPlaying;
        this.updateKinematicPlayBtn();
        this.flashIndicator(this.isPlaying ? '▶' : '⏸');
      };

      if (playBtn) playBtn.onclick = togglePlay;
      if (canvasBox) canvasBox.onclick = togglePlay;

      if (replayBtn) {
        replayBtn.onclick = () => {
          this.progress = 0;
          this.direction = 1;
          this.repCount = 0;
          this.isPlaying = true;
          this.updateKinematicPlayBtn();
          this.flashIndicator('🔁');
        };
      }

      const speeds = [1.0, 1.5, 0.5];
      let sIdx = 0;
      if (speedBtn) {
        speedBtn.onclick = () => {
          sIdx = (sIdx + 1) % speeds.length;
          this.speed = speeds[sIdx];
          if (speedLabel) speedLabel.innerText = `${this.speed.toFixed(1)}x`;
        };
      }

      if (scrubber) {
        scrubber.oninput = (e) => {
          this.progress = parseFloat(e.target.value) / 100;
          this.isPlaying = false;
          this.updateKinematicPlayBtn();
          this.renderKinematicFrame(this.progress);
        };
      }

      if (fullscreenBtn) {
        fullscreenBtn.onclick = () => {
          const wrapper = this.container.querySelector('.fitsync-motion-container');
          if (!document.fullscreenElement) {
            if (wrapper && wrapper.requestFullscreen) wrapper.requestFullscreen();
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
          }
        };
      }
    }

    updateKinematicPlayBtn() {
      const icon = this.container.querySelector('#biomech-play-icon');
      const text = this.container.querySelector('#biomech-play-text');
      if (icon && text) {
        icon.innerText = this.isPlaying ? '⏸' : '▶';
        text.innerText = this.isPlaying ? 'Pause' : 'Play';
      }
    }

    flashIndicator(iconText) {
      const ind = this.container.querySelector('#biomech-center-indicator');
      const icon = this.container.querySelector('#biomech-center-icon');
      if (!ind || !icon) return;
      icon.innerText = iconText;
      ind.classList.remove('opacity-0');
      ind.classList.add('opacity-100');
      setTimeout(() => {
        ind.classList.remove('opacity-100');
        ind.classList.add('opacity-0');
      }, 350);
    }

    startKinematicLoop() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      this.lastTimestamp = performance.now();
      const loop = (timestamp) => {
        const delta = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        if (this.isPlaying) {
          const step = (delta / 2.4) * this.speed;
          this.progress += step * this.direction;

          if (this.progress >= 1.0) {
            this.progress = 1.0;
            this.direction = -1;
          } else if (this.progress <= 0.0) {
            this.progress = 0.0;
            this.direction = 1;
            this.repCount = (this.repCount || 0) + 1;
            const repEl = this.container.querySelector('#biomech-rep-counter');
            if (repEl) repEl.innerText = this.repCount;
          }

          const scrubber = this.container.querySelector('#biomech-scrubber');
          const scrubVal = this.container.querySelector('#biomech-scrub-val');
          const pct = Math.round(this.progress * 100);
          if (scrubber) scrubber.value = pct;
          if (scrubVal) scrubVal.innerText = `${pct}%`;

          this.renderKinematicFrame(this.progress);
        }

        this.animationFrameId = requestAnimationFrame(loop);
      };

      this.animationFrameId = requestAnimationFrame(loop);
    }

    renderKinematicFrame(t) {
      const rig = this.container.querySelector('#biomech-rig-group');
      if (!rig) return;

      const easeT = (1 - Math.cos(t * Math.PI)) / 2;

      const phaseBadge = this.container.querySelector('#biomech-phase-badge');
      const breathCue = this.container.querySelector('#biomech-breath-cue');

      if (phaseBadge && breathCue) {
        if (t < 0.12) {
          phaseBadge.innerText = 'START POSITION';
          phaseBadge.className = 'text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded-full';
          breathCue.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-400"></span><span>Inhale & Lock Core Stability</span>`;
        } else if (t < 0.85) {
          if (this.direction === 1) {
            phaseBadge.innerText = 'CONCENTRIC CONTRACTION';
            phaseBadge.className = 'text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]';
            breathCue.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span>Exhale & Powerfully Contract</span>`;
          } else {
            phaseBadge.innerText = 'ECCENTRIC RETURN (2-3s)';
            phaseBadge.className = 'text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full';
            breathCue.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400"></span><span>Inhale & Lower Under Strict Tension</span>`;
          }
        } else {
          phaseBadge.innerText = 'PEAK CONTRACTION';
          phaseBadge.className = 'text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.3)]';
          breathCue.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>Hold 1s Peak Squeeze</span>`;
        }
      }

      let svgMarkup = '';
      switch (this.motionClass) {
        case 'curl':
          svgMarkup = this.renderArmCurl(easeT);
          break;
        case 'chest_press':
          svgMarkup = this.renderChestPress(easeT);
          break;
        case 'overhead_press':
          svgMarkup = this.renderOverheadPress(easeT);
          break;
        case 'squat':
          svgMarkup = this.renderSquat(easeT);
          break;
        case 'deadlift':
          svgMarkup = this.renderDeadlift(easeT);
          break;
        case 'row_pull':
          svgMarkup = this.renderRowPull(easeT);
          break;
        case 'lunge':
          svgMarkup = this.renderLunge(easeT);
          break;
        case 'lateral_raise':
          svgMarkup = this.renderLateralRaise(easeT);
          break;
        case 'tricep_ext':
          svgMarkup = this.renderTricepExt(easeT);
          break;
        case 'core_plank':
          svgMarkup = this.renderCorePlank(easeT);
          break;
        case 'cardio_hiit':
          svgMarkup = this.renderCardioHIIT(easeT);
          break;
        case 'mobility_stretch':
          svgMarkup = this.renderMobilityStretch(easeT);
          break;
        case 'leg_iso':
        default:
          svgMarkup = this.renderLegIso(easeT);
          break;
      }

      rig.innerHTML = svgMarkup;
    }

    renderArmCurl(k) {
      const shoulderX = 200, shoulderY = 110;
      const elbowX = 200, elbowY = 160;
      const angle = (Math.PI / 2) - (k * 1.95);
      const handX = elbowX + 48 * Math.cos(angle);
      const handY = elbowY - 48 * Math.sin(angle);
      const bicepWidth = 9 + k * 8;
      const glowOpacity = 0.3 + k * 0.7;

      return `
        <circle cx="200" cy="70" r="16" fill="#f8fafc" />
        <line x1="200" y1="88" x2="200" y2="180" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <line x1="200" y1="180" x2="185" y2="240" stroke="#334155" stroke-width="10" stroke-linecap="round" />
        <line x1="200" y1="180" x2="215" y2="240" stroke="#334155" stroke-width="10" stroke-linecap="round" />
        <line x1="${shoulderX}" y1="${shoulderY}" x2="${elbowX}" y2="${elbowY}" stroke="#64748b" stroke-width="9" stroke-linecap="round" />
        <line x1="${shoulderX}" y1="${shoulderY + 6}" x2="${elbowX}" y2="${elbowY - 8}" stroke="#10b981" stroke-width="${bicepWidth}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${glowOpacity}" />
        <line x1="${elbowX}" y1="${elbowY}" x2="${handX}" y2="${handY}" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <circle cx="${handX}" cy="${handY}" r="10" fill="#38bdf8" stroke="#0284c7" stroke-width="2" />
        <line x1="${handX - 14}" y1="${handY}" x2="${handX + 14}" y2="${handY}" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" />
      `;
    }

    renderChestPress(k) {
      const barY = 110 + (1 - k) * 35;
      const elbowY = 135 + (1 - k) * 20;

      return `
        <rect x="80" y="160" width="240" height="14" rx="4" fill="#1e293b" stroke="#334155" stroke-width="2" />
        <rect x="110" y="174" width="12" height="66" fill="#334155" />
        <rect x="278" y="174" width="12" height="66" fill="#334155" />
        <circle cx="125" cy="148" r="14" fill="#f8fafc" />
        <line x1="140" y1="152" x2="250" y2="152" stroke="#475569" stroke-width="14" stroke-linecap="round" />
        <line x1="250" y1="152" x2="280" y2="240" stroke="#334155" stroke-width="9" stroke-linecap="round" />
        <path d="M 160 144 Q 185 ${140 - k * 10} 210 144" fill="none" stroke="#10b981" stroke-width="${10 + k * 6}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <line x1="185" y1="146" x2="160" y2="${elbowY}" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
        <line x1="160" y1="${elbowY}" x2="185" y2="${barY}" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <line x1="110" y1="${barY}" x2="260" y2="${barY}" stroke="#e2e8f0" stroke-width="4" />
        <rect x="95" y="${barY - 14}" width="16" height="28" rx="3" fill="#38bdf8" />
        <rect x="259" y="${barY - 14}" width="16" height="28" rx="3" fill="#38bdf8" />
      `;
    }

    renderOverheadPress(k) {
      const barY = 115 - k * 55;
      const elbowY = 135 - k * 35;
      const shoulderX = 200, shoulderY = 110;

      return `
        <circle cx="200" cy="78" r="15" fill="#f8fafc" />
        <line x1="200" y1="95" x2="200" y2="180" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <line x1="200" y1="180" x2="185" y2="240" stroke="#334155" stroke-width="10" stroke-linecap="round" />
        <line x1="200" y1="180" x2="215" y2="240" stroke="#334155" stroke-width="10" stroke-linecap="round" />
        <circle cx="178" cy="${shoulderY}" r="${7 + k * 4}" fill="#10b981" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <circle cx="222" cy="${shoulderY}" r="${7 + k * 4}" fill="#10b981" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <path d="M 180 ${shoulderY} L 165 ${elbowY} L 175 ${barY}" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <path d="M 220 ${shoulderY} L 235 ${elbowY} L 225 ${barY}" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <line x1="140" y1="${barY}" x2="260" y2="${barY}" stroke="#e2e8f0" stroke-width="4" stroke-linecap="round" />
        <rect x="130" y="${barY - 10}" width="12" height="20" rx="3" fill="#38bdf8" />
        <rect x="258" y="${barY - 10}" width="12" height="20" rx="3" fill="#38bdf8" />
      `;
    }

    renderSquat(k) {
      const hipY = 145 + k * 45;
      const hipX = 195 - k * 18;
      const kneeY = 190 + k * 10;
      const kneeX = 220 + k * 12;
      const torsoAngle = k * 18;

      return `
        <g transform="rotate(${torsoAngle}, ${hipX}, ${hipY})">
          <circle cx="${hipX}" cy="${hipY - 70}" r="15" fill="#f8fafc" />
          <line x1="${hipX}" y1="${hipY - 55}" x2="${hipX}" y2="${hipY}" stroke="#475569" stroke-width="13" stroke-linecap="round" />
          <circle cx="${hipX}" cy="${hipY - 50}" r="10" fill="#38bdf8" />
          <line x1="${hipX - 25}" y1="${hipY - 50}" x2="${hipX + 25}" y2="${hipY - 50}" stroke="#38bdf8" stroke-width="5" />
        </g>
        <line x1="${hipX}" y1="${hipY}" x2="${kneeX}" y2="${kneeY}" stroke="#10b981" stroke-width="${10 + k * 6}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <line x1="${kneeX}" y1="${kneeY}" x2="215" y2="240" stroke="#f59e0b" stroke-width="7" stroke-linecap="round" />
        <line x1="205" y1="240" x2="230" y2="240" stroke="#f8fafc" stroke-width="6" stroke-linecap="round" />
      `;
    }

    renderDeadlift(k) {
      const hipX = 210 + k * 25;
      const hipY = 150 + k * 10;
      const shoulderX = 180 - k * 20;
      const shoulderY = 110 + k * 35;
      const barY = 220 - (1 - k) * 60;

      return `
        <circle cx="${shoulderX - 10}" cy="${shoulderY - 14}" r="14" fill="#f8fafc" />
        <line x1="${shoulderX}" y1="${shoulderY}" x2="${hipX}" y2="${hipY}" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <line x1="${hipX}" y1="${hipY}" x2="200" y2="200" stroke="#10b981" stroke-width="${9 + k * 5}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <line x1="200" y1="200" x2="195" y2="240" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
        <line x1="${shoulderX}" y1="${shoulderY}" x2="${shoulderX + 5}" y2="${barY}" stroke="#f8fafc" stroke-width="6" stroke-linecap="round" />
        <line x1="120" y1="${barY}" x2="250" y2="${barY}" stroke="#e2e8f0" stroke-width="4" />
        <circle cx="130" cy="${barY}" r="18" fill="#38bdf8" />
        <circle cx="240" cy="${barY}" r="18" fill="#38bdf8" />
      `;
    }

    renderRowPull(k) {
      const handleY = 65 + k * 55;
      const elbowX = 200 + k * 28;
      const elbowY = 120 + k * 30;

      return `
        <line x1="140" y1="40" x2="260" y2="40" stroke="#334155" stroke-width="6" />
        <circle cx="200" cy="40" r="8" fill="#38bdf8" />
        <line x1="200" y1="40" x2="200" y2="${handleY}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3,3" />
        <circle cx="200" cy="100" r="14" fill="#f8fafc" />
        <line x1="200" y1="115" x2="200" y2="185" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <path d="M 188 125 Q 175 145 190 170" fill="none" stroke="#10b981" stroke-width="${8 + k * 7}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <path d="M 212 125 Q 225 145 210 170" fill="none" stroke="#10b981" stroke-width="${8 + k * 7}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <path d="M 200 115 L ${elbowX} ${elbowY} L 200 ${handleY}" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <line x1="160" y1="${handleY}" x2="240" y2="${handleY}" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" />
      `;
    }

    renderLunge(k) {
      const hipY = 145 + k * 35;
      const frontKneeY = 190 + k * 20;

      return `
        <circle cx="190" cy="${hipY - 65}" r="14" fill="#f8fafc" />
        <line x1="190" y1="${hipY - 50}" x2="190" y2="${hipY}" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <line x1="190" y1="${hipY}" x2="235" y2="${frontKneeY}" stroke="#10b981" stroke-width="${9 + k * 5}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <line x1="235" y1="${frontKneeY}" x2="235" y2="240" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" />
        <line x1="190" y1="${hipY}" x2="145" y2="${frontKneeY}" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
        <line x1="145" y1="${frontKneeY}" x2="135" y2="240" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
      `;
    }

    renderLateralRaise(k) {
      const shoulderX = 200, shoulderY = 110;
      const armAngle = 0.25 + k * 1.35;
      const handLX = shoulderX - 65 * Math.cos(armAngle);
      const handLY = shoulderY + 65 * Math.sin(armAngle) * (1 - k * 1.3);
      const handRX = shoulderX + 65 * Math.cos(armAngle);
      const handRY = handLY;

      return `
        <circle cx="200" cy="72" r="15" fill="#f8fafc" />
        <line x1="200" y1="88" x2="200" y2="180" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <line x1="200" y1="180" x2="185" y2="240" stroke="#334155" stroke-width="10" stroke-linecap="round" />
        <line x1="200" y1="180" x2="215" y2="240" stroke="#334155" stroke-width="10" stroke-linecap="round" />
        <circle cx="180" cy="${shoulderY}" r="${8 + k * 5}" fill="#10b981" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <circle cx="220" cy="${shoulderY}" r="${8 + k * 5}" fill="#10b981" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <line x1="${shoulderX}" y1="${shoulderY}" x2="${handLX}" y2="${handLY}" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <line x1="${shoulderX}" y1="${shoulderY}" x2="${handRX}" y2="${handRY}" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <circle cx="${handLX}" cy="${handLY}" r="8" fill="#38bdf8" />
        <circle cx="${handRX}" cy="${handRY}" r="8" fill="#38bdf8" />
      `;
    }

    renderTricepExt(k) {
      const elbowX = 200, elbowY = 145;
      const handY = 145 + k * 55;

      return `
        <circle cx="200" cy="75" r="14" fill="#f8fafc" />
        <line x1="200" y1="90" x2="200" y2="180" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <line x1="200" y1="180" x2="185" y2="240" stroke="#334155" stroke-width="10" stroke-linecap="round" />
        <line x1="200" y1="180" x2="215" y2="240" stroke="#334155" stroke-width="10" stroke-linecap="round" />
        <line x1="200" y1="105" x2="${elbowX}" y2="${elbowY}" stroke="#64748b" stroke-width="9" stroke-linecap="round" />
        <line x1="206" y1="108" x2="206" y2="${elbowY}" stroke="#10b981" stroke-width="${7 + k * 6}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <line x1="${elbowX}" y1="${elbowY}" x2="${handX}" y2="${handY}" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <line x1="${elbowX - 15}" y1="${handY}" x2="${elbowX + 15}" y2="${handY}" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" />
      `;
    }

    renderCorePlank(k) {
      const spineY = 175 + Math.sin(k * Math.PI) * 6;

      return `
        <circle cx="110" cy="165" r="14" fill="#f8fafc" />
        <line x1="110" y1="175" x2="110" y2="230" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
        <line x1="110" y1="230" x2="135" y2="230" stroke="#64748b" stroke-width="6" stroke-linecap="round" />
        <line x1="125" y1="${spineY}" x2="250" y2="185" stroke="#475569" stroke-width="13" stroke-linecap="round" />
        <line x1="145" y1="${spineY + 8}" x2="225" y2="${spineY + 8}" stroke="#10b981" stroke-width="${10 + k * 6}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.5 + k * 0.5}" />
        <line x1="250" y1="185" x2="310" y2="230" stroke="#334155" stroke-width="9" stroke-linecap="round" />
        <line x1="310" y1="230" x2="320" y2="230" stroke="#f8fafc" stroke-width="6" stroke-linecap="round" />
      `;
    }

    renderCardioHIIT(k) {
      const jumpY = k * 35;
      const legSpread = k * 20;

      return `
        <circle cx="200" cy="${70 - jumpY}" r="15" fill="#f8fafc" />
        <line x1="200" y1="${85 - jumpY}" x2="200" y2="${165 - jumpY}" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <line x1="200" y1="${165 - jumpY}" x2="${180 - legSpread}" y2="${235 - jumpY}" stroke="#10b981" stroke-width="10" stroke-linecap="round" filter="url(#glow-primary)" />
        <line x1="200" y1="${165 - jumpY}" x2="${220 + legSpread}" y2="${235 - jumpY}" stroke="#10b981" stroke-width="10" stroke-linecap="round" filter="url(#glow-primary)" />
        <line x1="200" y1="${100 - jumpY}" x2="${160 - legSpread}" y2="${60 - jumpY}" stroke="#38bdf8" stroke-width="7" stroke-linecap="round" />
        <line x1="200" y1="${100 - jumpY}" x2="${240 + legSpread}" y2="${60 - jumpY}" stroke="#38bdf8" stroke-width="7" stroke-linecap="round" />
      `;
    }

    renderMobilityStretch(k) {
      const torsoCurve = Math.sin(k * Math.PI) * 20;

      return `
        <circle cx="120" cy="${130 + torsoCurve * 0.5}" r="15" fill="#f8fafc" />
        <path d="M 135 140 Q 200 ${140 + torsoCurve} 270 170" fill="none" stroke="#10b981" stroke-width="12" stroke-linecap="round" filter="url(#glow-primary)" />
        <line x1="140" y1="145" x2="140" y2="235" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
        <line x1="270" y1="170" x2="270" y2="235" stroke="#64748b" stroke-width="8" stroke-linecap="round" />
        <line x1="130" y1="235" x2="155" y2="235" stroke="#334155" stroke-width="6" stroke-linecap="round" />
        <line x1="260" y1="235" x2="285" y2="235" stroke="#334155" stroke-width="6" stroke-linecap="round" />
      `;
    }

    renderLegIso(k) {
      const calfLift = k * 18;

      return `
        <circle cx="200" cy="75" r="15" fill="#f8fafc" />
        <line x1="200" y1="90" x2="200" y2="175" stroke="#475569" stroke-width="12" stroke-linecap="round" />
        <line x1="200" y1="175" x2="200" y2="215" stroke="#64748b" stroke-width="10" stroke-linecap="round" />
        <line x1="200" y1="215" x2="200" y2="${238 - calfLift}" stroke="#10b981" stroke-width="${9 + k * 5}" stroke-linecap="round" filter="url(#glow-primary)" opacity="${0.4 + k * 0.6}" />
        <line x1="190" y1="${240 - calfLift}" x2="215" y2="${240 - calfLift}" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
      `;
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

  // Backward compatibility alias & kinematic class
  class BiomechanicalPlayer extends FitSyncExercisePlayer {}

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
