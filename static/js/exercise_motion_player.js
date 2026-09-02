/**
 * FitSync AI — Interactive Workout Animation & Kinematic Player
 * Renders exercise-specific 2D animations, vector graphics, 60 FPS skeletal motion,
 * step-by-step form execution guides, and click-to-play video/animation controls.
 */

(function(window) {
  'use strict';

  class BiomechanicalCanvasPlayer {
    constructor() {
      this.container = null;
      this.canvas = null;
      this.ctx = null;
      this.currentEx = null;
      this.animData = null;
      this.isPlaying = true;
      this.speed = 1.0;
      this.progress = 0.0;
      this.currentRep = 1;
      this.targetReps = 10;
      this.animationFrameId = null;
      this.lastTimestamp = null;
      this.slug = 'bench_press';
      this.assetPath = '/static/exercises/fallback_demo.svg';
    }

    async mount(containerId, exerciseData) {
      this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!this.container) return;

      this.currentEx = exerciseData || { name: 'Exercise', category: 'General' };
      this.progress = 0.0;
      this.currentRep = 1;
      this.isPlaying = true;
      this.speed = 1.0;

      // Compute slug and asset paths
      const nameStr = (this.currentEx.name || '').toLowerCase();
      this.slug = nameStr.replace(/ /g, '_').replace(/-/g, '_');
      this.assetPath = `/static/exercises/${this.slug}/demo.svg`;

      // Fetch animation config from backend API or bridge if available
      if (window.FitSyncAnimationBridge) {
        this.animData = await window.FitSyncAnimationBridge.fetchAnimationConfig(this.slug || 1);
      }

      this.buildDOM();
      this.initCanvas();
      this.startAnimationLoop();
    }

    buildDOM() {
      const primaryMuscle = (this.animData && this.animData.primary_muscles && this.animData.primary_muscles.length)
        ? this.animData.primary_muscles.join(', ')
        : (this.currentEx.primary_muscle || this.currentEx.category || 'Target Muscle');

      const secondaryMuscles = (this.animData && this.animData.secondary_muscles && this.animData.secondary_muscles.length)
        ? this.animData.secondary_muscles.join(', ')
        : 'Stabilizer Muscles';

      const instructions = this.currentEx.instructions || [
        "1. Assume correct starting stance and secure grip.",
        "2. Inhale and lower the weight under strict control over 2 seconds.",
        "3. Pause at the bottom transition for full muscular stretch.",
        "4. Exhale and drive explosively upward back to top lockout.",
        "5. Squeeze target muscles at peak contraction."
      ];

      const instructionsList = Array.isArray(instructions) 
        ? instructions 
        : (typeof instructions === 'string' ? instructions.split('.').filter(s => s.trim().length > 0) : []);

      const html = `
        <div class="biomech-player relative w-full h-full flex flex-col justify-between select-none">
          
          <!-- CLICKABLE ANIMATION STAGE / VIEWPORT -->
          <div 
            id="biomech-stage" 
            class="relative flex-1 w-full min-h-[230px] max-h-[290px] bg-slate-950/90 rounded-2xl border border-slate-800 hover:border-emerald-500/40 overflow-hidden flex items-center justify-center p-2 cursor-pointer group transition-all shadow-xl"
            title="Click animation viewport to Play / Pause"
          >
            <!-- Vector Animation Graphic Asset -->
            <img 
              id="biomech-svg-asset" 
              src="${this.assetPath}" 
              onerror="this.onerror=null; this.src='/static/exercises/fallback_demo.svg';" 
              alt="${this.currentEx.name} Animation" 
              class="absolute inset-0 w-full h-full object-contain pointer-events-none p-2 opacity-95 transition-opacity"
            />

            <!-- 2D Canvas Joint Kinematic Layer -->
            <canvas id="biomech-canvas" width="400" height="280" class="w-full h-full max-h-[270px] object-contain relative z-10 rounded-xl pointer-events-none"></canvas>

            <!-- Click Play / Pause Feedback Overlay -->
            <div id="biomech-click-overlay" class="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-30 flex items-center justify-center opacity-0 transition-opacity pointer-events-none">
              <div class="px-5 py-3 rounded-2xl bg-emerald-500/90 text-slate-950 font-black text-sm flex items-center gap-2 shadow-2xl scale-95 transition-transform" id="biomech-overlay-text">
                <span id="biomech-overlay-icon">▶</span>
                <span id="biomech-overlay-msg">PLAYING</span>
              </div>
            </div>

            <!-- HUD Overlay: Phase & Real-Time Breathing Cue -->
            <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
              <div class="flex items-center gap-2">
                <span id="biomech-phase-badge" class="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm">
                  STARTING SETUP
                </span>
                <span id="biomech-rep-badge" class="text-[10px] font-bold text-slate-300 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-700 backdrop-blur-md">
                  REP 1 / 10
                </span>
              </div>
              <div id="biomech-breath-cue" class="text-[11px] font-extrabold text-teal-300 flex items-center gap-1.5 bg-slate-950/90 border border-teal-500/30 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm">
                <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span>Inhale & Brace Core</span>
              </div>
            </div>

            <!-- Muscle Indicator Badges -->
            <div class="absolute bottom-3 right-3 flex flex-col items-end gap-1 z-20">
              <div class="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1.5 backdrop-blur-md">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
                <span>Primary: ${primaryMuscle}</span>
              </div>
              <div class="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1.5 backdrop-blur-md">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Secondary: ${secondaryMuscles}</span>
              </div>
            </div>
          </div>

          <!-- STEP-BY-STEP FORM & EXECUTION GUIDE (HOW TO DO THE WORKOUT) -->
          <div class="mt-2.5 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                📖 How to Perform Exercise
              </span>
              <span class="text-[9px] font-bold text-slate-400">Biomechanical Form Guide</span>
            </div>
            <ul class="text-[11px] text-slate-300 space-y-1 pl-1 font-medium">
              ${instructionsList.length > 0 
                ? instructionsList.slice(0, 3).map((inst, idx) => `<li class="flex items-start gap-1.5"><span class="text-emerald-400 font-bold">${idx + 1}.</span> <span>${inst.replace(/^\d+\.\s*/, '')}</span></li>`).join('')
                : `<li class="flex items-start gap-1.5"><span class="text-emerald-400 font-bold">1.</span> <span>Maintain strict posture, control tempo, and breathe steadily through execution.</span></li>`
              }
            </ul>
          </div>

          <!-- PLAYBACK CONTROLS BAR -->
          <div class="mt-2.5 bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 flex flex-col gap-2">
            <!-- Timeline Scrubber -->
            <div class="flex items-center gap-2.5">
              <span class="text-[10px] font-bold text-slate-400 w-8">0%</span>
              <input 
                type="range" 
                id="biomech-scrubber" 
                min="0" 
                max="100" 
                value="0" 
                class="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span class="text-[10px] font-bold text-emerald-400 w-8 text-right" id="biomech-scrub-val">0%</span>
            </div>

            <!-- Interactive Control Buttons -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <button 
                  type="button" 
                  id="biomech-play-btn" 
                  class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                >
                  <span id="biomech-play-icon">⏸</span>
                  <span id="biomech-play-text">Pause</span>
                </button>
                <button 
                  type="button" 
                  id="biomech-replay-btn" 
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors border border-slate-700"
                  title="Replay from start"
                >
                  ↻ Replay
                </button>
              </div>

              <!-- Speed & Form Controls -->
              <div class="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button type="button" class="biomech-speed-btn px-1.5 py-0.5 rounded text-[10px] font-black transition-colors ${this.speed === 0.25 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-speed="0.25">0.25x</button>
                <button type="button" class="biomech-speed-btn px-1.5 py-0.5 rounded text-[10px] font-black transition-colors ${this.speed === 0.5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-speed="0.5">0.5x</button>
                <button type="button" class="biomech-speed-btn px-1.5 py-0.5 rounded text-[10px] font-black transition-colors ${this.speed === 1.0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-speed="1.0">1.0x</button>
                <button type="button" class="biomech-speed-btn px-1.5 py-0.5 rounded text-[10px] font-black transition-colors ${this.speed === 1.5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-speed="1.5">1.5x</button>
                <button type="button" class="biomech-speed-btn px-1.5 py-0.5 rounded text-[10px] font-black transition-colors ${this.speed === 2.0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-speed="2.0">2.0x</button>
                <button type="button" id="biomech-form-btn" class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black hover:bg-cyan-500/30 transition-all flex items-center gap-1" title="Slow motion form demo">
                  ⚡ Show Correct Form
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      this.container.innerHTML = html;
      this.attachEventListeners();
    }

    initCanvas() {
      this.canvas = this.container.querySelector('#biomech-canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
      }
    }

    attachEventListeners() {
      const stage = this.container.querySelector('#biomech-stage');
      const playBtn = this.container.querySelector('#biomech-play-btn');
      const replayBtn = this.container.querySelector('#biomech-replay-btn');
      const scrubber = this.container.querySelector('#biomech-scrubber');
      const speedBtns = this.container.querySelectorAll('.biomech-speed-btn');
      const formBtn = this.container.querySelector('#biomech-form-btn');

      // Click on animation stage/viewport directly plays/pauses
      if (stage) {
        stage.addEventListener('click', (e) => {
          // Prevent triggering if clicked on inner controls or badges
          this.isPlaying = !this.isPlaying;
          this.updatePlayBtnState();
          this.showClickOverlayFeedback(this.isPlaying);
        });
      }

      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.isPlaying = !this.isPlaying;
          this.updatePlayBtnState();
          this.showClickOverlayFeedback(this.isPlaying);
        });
      }

      if (replayBtn) {
        replayBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.progress = 0.0;
          this.currentRep = 1;
          this.isPlaying = true;
          this.updatePlayBtnState();
          this.showClickOverlayFeedback(true);
        });
      }

      if (scrubber) {
        scrubber.addEventListener('input', (e) => {
          this.progress = parseFloat(e.target.value) / 100.0;
          this.isPlaying = false;
          this.updatePlayBtnState();
          this.renderCanvasFrame();
        });
      }

      if (formBtn) {
        formBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.speed = 0.25;
          this.progress = 0.0;
          this.isPlaying = true;
          this.updatePlayBtnState();
          this.updateSpeedBtnStyles(0.25);
          this.showClickOverlayFeedback(true, "SLOW FORM DEMO (0.25x)");
        });
      }

      speedBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const spd = parseFloat(btn.getAttribute('data-speed')) || 1.0;
          this.speed = spd;
          this.updateSpeedBtnStyles(spd);
        });
      });
    }

    showClickOverlayFeedback(isPlaying, customText) {
      const overlay = this.container.querySelector('#biomech-click-overlay');
      const icon = this.container.querySelector('#biomech-overlay-icon');
      const msg = this.container.querySelector('#biomech-overlay-msg');
      if (!overlay) return;

      if (icon) icon.textContent = isPlaying ? '▶' : '⏸';
      if (msg) msg.textContent = customText || (isPlaying ? 'PLAYING ANIMATION' : 'PAUSED');

      overlay.classList.remove('opacity-0', 'pointer-events-none');
      overlay.classList.add('opacity-100');

      setTimeout(() => {
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0', 'pointer-events-none');
      }, 700);
    }

    updateSpeedBtnStyles(selectedSpeed) {
      const speedBtns = this.container.querySelectorAll('.biomech-speed-btn');
      speedBtns.forEach(b => {
        const spd = parseFloat(b.getAttribute('data-speed'));
        if (spd === selectedSpeed) {
          b.className = 'biomech-speed-btn px-1.5 py-0.5 rounded text-[10px] font-black transition-colors bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        } else {
          b.className = 'biomech-speed-btn px-1.5 py-0.5 rounded text-[10px] font-black transition-colors text-slate-400 hover:text-white';
        }
      });
    }

    updatePlayBtnState() {
      const icon = this.container.querySelector('#biomech-play-icon');
      const text = this.container.querySelector('#biomech-play-text');
      const svgAsset = this.container.querySelector('#biomech-svg-asset');

      if (icon && text) {
        icon.textContent = this.isPlaying ? '⏸' : '▶';
        text.textContent = this.isPlaying ? 'Pause' : 'Play';
      }

      if (svgAsset) {
        if (this.isPlaying) {
          svgAsset.style.animationPlayState = 'running';
        } else {
          svgAsset.style.animationPlayState = 'paused';
        }
      }
    }

    startAnimationLoop() {
      this.lastTimestamp = performance.now();
      const loop = (now) => {
        const delta = (now - this.lastTimestamp) / 1000.0;
        this.lastTimestamp = now;

        if (this.isPlaying) {
          this.progress += (delta * this.speed * 0.4);
          if (this.progress >= 1.0) {
            this.progress = 0.0;
            this.currentRep++;
            if (this.currentRep > this.targetReps) {
              this.currentRep = 1;
            }
          }
          this.renderCanvasFrame();
        }

        this.animationFrameId = requestAnimationFrame(loop);
      };
      this.animationFrameId = requestAnimationFrame(loop);
    }

    renderCanvasFrame() {
      if (!this.ctx || !this.canvas) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      // Evaluate keyframes for skeletal joint positions
      const frameData = this.evaluateKeyframe(this.progress);

      // Update UI HUD
      const phaseBadge = this.container.querySelector('#biomech-phase-badge');
      const repBadge = this.container.querySelector('#biomech-rep-badge');
      const scrubber = this.container.querySelector('#biomech-scrubber');
      const scrubVal = this.container.querySelector('#biomech-scrub-val');
      const breathCue = this.container.querySelector('#biomech-breath-cue');

      if (phaseBadge) phaseBadge.textContent = (frameData.phase || 'ACTIVE MOVEMENT').toUpperCase();
      if (repBadge) repBadge.textContent = `REP ${this.currentRep} / ${this.targetReps}`;
      if (scrubber) scrubber.value = Math.round(this.progress * 100);
      if (scrubVal) scrubVal.textContent = `${Math.round(this.progress * 100)}%`;

      if (breathCue) {
        const p = this.progress;
        if (p < 0.4) breathCue.innerHTML = '<span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span><span>Inhale & Brace Core</span>';
        else if (p < 0.7) breathCue.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Pause & Hold Posture</span>';
        else breathCue.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span><span>Exhale & Drive Upward</span>';
      }

      // Render 2D Skeleton, Muscles & Equipment on Canvas
      this.drawSkeletonOnCanvas(ctx, frameData);
    }

    evaluateKeyframe(t) {
      if (!this.animData || !this.animData.keyframes || !this.animData.keyframes.length) {
        return this.getFallbackFrame(t);
      }

      const keyframes = this.animData.keyframes;
      if (keyframes.size === 1) return keyframes[0];

      let f1 = keyframes[0];
      let f2 = keyframes[keyframes.length - 1];

      for (let i = 0; i < keyframes.length - 1; i++) {
        if (t >= keyframes[i].timestamp && t <= keyframes[i + 1].timestamp) {
          f1 = keyframes[i];
          f2 = keyframes[i + 1];
          break;
        }
      }

      const factor = (f2.timestamp > f1.timestamp) ? (t - f1.timestamp) / (f2.timestamp - f1.timestamp) : 0;
      return this.interpolateKeyframes(f1, f2, factor);
    }

    interpolateKeyframes(f1, f2, factor) {
      const res = {
        phase: factor < 0.5 ? f1.phase : f2.phase,
        equipment: {
          type: f1.equipment ? f1.equipment.type : 'none',
          x: f1.equipment ? f1.equipment.x + factor * (f2.equipment.x - f1.equipment.x) : 200,
          y: f1.equipment ? f1.equipment.y + factor * (f2.equipment.y - f1.equipment.y) : 150
        },
        joints: {},
        muscle_activations: {}
      };

      const j1 = f1.joints || {};
      const j2 = f2.joints || {};

      for (let key in j1) {
        const p1 = j1[key];
        const p2 = j2[key] || p1;
        res.joints[key] = {
          x: p1.x + factor * (p2.x - p1.x),
          y: p1.y + factor * (p2.y - p1.y)
        };
      }

      const m1 = f1.muscle_activations || {};
      const m2 = f2.muscle_activations || {};
      for (let key in m1) {
        const v1 = m1[key];
        const v2 = m2[key] !== undefined ? m2[key] : v1;
        res.muscle_activations[key] = v1 + factor * (v2 - v1);
      }

      return res;
    }

    drawSkeletonOnCanvas(ctx, frameData) {
      const joints = frameData.joints;
      const eq = frameData.equipment;

      // Draw Equipment Bench if exercise is bench press
      if (this.currentEx.name && this.currentEx.name.toLowerCase().includes('bench')) {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 4;
        ctx.fillRect(100, 195, 200, 15);
        ctx.strokeRect(100, 195, 200, 15);

        ctx.beginPath();
        ctx.moveTo(120, 210); ctx.lineTo(120, 250);
        ctx.moveTo(280, 210); ctx.lineTo(280, 250);
        ctx.stroke();
      }

      // Draw Standard Bones
      const bones = [
        ['head', 'neck'], ['neck', 'chest'], ['chest', 'spine'], ['spine', 'pelvis'],
        ['chest', 'left_shoulder'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
        ['chest', 'right_shoulder'], ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
        ['pelvis', 'left_hip'], ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
        ['pelvis', 'right_hip'], ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
      ];

      // Draw Muscle Glowing Highlights
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#10b981';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 14;

      if (joints.chest && joints.left_shoulder) {
        ctx.beginPath();
        ctx.moveTo(joints.chest.x, joints.chest.y);
        ctx.lineTo(joints.left_shoulder.x, joints.left_shoulder.y);
        ctx.stroke();
      }
      if (joints.left_hip && joints.left_knee) {
        ctx.beginPath();
        ctx.moveTo(joints.left_hip.x, joints.left_hip.y);
        ctx.lineTo(joints.left_knee.x, joints.left_knee.y);
        ctx.stroke();
      }
      ctx.restore();

      // Draw Bone Segments
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      bones.forEach(([j1Name, j2Name]) => {
        if (joints[j1Name] && joints[j2Name]) {
          ctx.beginPath();
          ctx.moveTo(joints[j1Name].x, joints[j1Name].y);
          ctx.lineTo(joints[j2Name].x, joints[j2Name].y);
          ctx.stroke();
        }
      });

      // Draw Head
      if (joints.head) {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(joints.head.x, joints.head.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Draw Joint Pivots
      ctx.fillStyle = '#38bdf8';
      for (let jKey in joints) {
        if (jKey !== 'head') {
          ctx.beginPath();
          ctx.arc(joints[jKey].x, joints[jKey].y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Equipment (Barbell / Dumbbells / Cable)
      if (eq && eq.type === 'barbell') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(eq.x - 70, eq.y);
        ctx.lineTo(eq.x + 70, eq.y);
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(eq.x - 75, eq.y - 15, 8, 30);
        ctx.fillRect(eq.x + 67, eq.y - 15, 8, 30);
      } else if (eq && eq.type === 'dumbbell') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(eq.x - 45, eq.y - 8, 12, 16);
        ctx.fillRect(eq.x + 35, eq.y - 8, 12, 16);
      }
    }

    renderArmCurl(k) { return this.evaluateKeyframe(k); }
    renderChestPress(k) { return this.evaluateKeyframe(k); }
    renderOverheadPress(k) { return this.evaluateKeyframe(k); }
    renderSquat(k) { return this.evaluateKeyframe(k); }
    renderDeadlift(k) { return this.evaluateKeyframe(k); }
    renderRowPull(k) { return this.evaluateKeyframe(k); }
    renderLunge(k) { return this.evaluateKeyframe(k); }
    renderLateralRaise(k) { return this.evaluateKeyframe(k); }
    renderTricepExt(k) { return this.evaluateKeyframe(k); }
    renderCorePlank(k) { return this.evaluateKeyframe(k); }
    renderLegIso(k) { return this.evaluateKeyframe(k); }

    getFallbackFrame(t) {
      const k = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      return {
        phase: k > 0.5 ? 'CONCENTRIC DRIVE' : 'ECCENTRIC CONTROL',
        equipment: { type: 'barbell', x: 200, y: 110 + k * 60 },
        joints: {
          head: { x: 200, y: 40 }, neck: { x: 200, y: 60 }, chest: { x: 200, y: 90 },
          spine: { x: 200, y: 120 }, pelvis: { x: 200, y: 150 },
          left_shoulder: { x: 180, y: 90 }, left_elbow: { x: 170 + k * 10, y: 115 + k * 30 }, left_wrist: { x: 185, y: 110 + k * 60 },
          right_shoulder: { x: 220, y: 90 }, right_elbow: { x: 230 - k * 10, y: 115 + k * 30 }, right_wrist: { x: 215, y: 110 + k * 60 },
          left_hip: { x: 185, y: 150 }, left_knee: { x: 185, y: 200 }, left_ankle: { x: 185, y: 250 },
          right_hip: { x: 215, y: 150 }, right_knee: { x: 215, y: 200 }, right_ankle: { x: 215, y: 250 }
        },
        muscle_activations: { "Primary": 0.8 }
      };
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  window.BiomechanicalCanvasPlayer = BiomechanicalCanvasPlayer;
  window.BiomechanicalPlayer = BiomechanicalCanvasPlayer;
  window.initExerciseMotionPlayer = function(containerId, exerciseData) {
    if (!window.__activeMotionPlayer) {
      window.__activeMotionPlayer = new BiomechanicalCanvasPlayer();
    }
    window.__activeMotionPlayer.mount(containerId, exerciseData);
    return window.__activeMotionPlayer;
  };

})(window);
