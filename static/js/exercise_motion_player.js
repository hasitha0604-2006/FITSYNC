/**
 * FitSync AI — Interactive Biomechanical Exercise Motion Player
 * Multi-joint kinematic vector motion engine with dynamic muscle activation maps,
 * playback controls (Play/Pause/Replay/Speed/Scrubber), and synchronized breathing guidance.
 */

(function(window) {
  'use strict';

  class BiomechanicalPlayer {
    constructor() {
      this.container = null;
      this.currentEx = null;
      this.isPlaying = true;
      this.speed = 1.0;
      this.progress = 0; // 0 to 1
      this.direction = 1; // 1 = forward (eccentric/concentric), -1 = return
      this.animationFrameId = null;
      this.lastTimestamp = null;
      this.motionClass = 'curl';
    }

    /**
     * Map exercise name/category/joint action to a kinematic motion pattern
     */
    detectMotionClass(ex) {
      const name = (ex.name || '').toLowerCase();
      const cat = (ex.category || '').toLowerCase();

      if (name.includes('curl') || name.includes('bicep')) return 'curl';
      if (name.includes('bench') || name.includes('push up') || name.includes('push-up') || name.includes('chest press')) return 'chest_press';
      if (name.includes('shoulder press') || name.includes('overhead press') || name.includes('arnold press')) return 'overhead_press';
      if (name.includes('squat') || name.includes('leg press')) return 'squat';
      if (name.includes('deadlift') || name.includes('rdl') || name.includes('farmer')) return 'deadlift';
      if (name.includes('row') || name.includes('pulldown') || name.includes('pull up') || name.includes('pull-up') || name.includes('lat pull')) return 'row_pull';
      if (name.includes('lunge') || name.includes('split squat')) return 'lunge';
      if (name.includes('lateral raise') || name.includes('fly') || name.includes('reverse fly')) return 'lateral_raise';
      if (name.includes('pushdown') || name.includes('tricep') || name.includes('dip') || name.includes('skull crusher')) return 'tricep_ext';
      if (name.includes('plank') || name.includes('crunch') || name.includes('leg raise') || name.includes('russian') || name.includes('ab wheel')) return 'core_plank';
      if (name.includes('leg extension') || name.includes('leg curl') || name.includes('calf') || name.includes('wrist') || name.includes('hip thrust')) return 'leg_iso';

      if (cat.includes('chest')) return 'chest_press';
      if (cat.includes('back')) return 'row_pull';
      if (cat.includes('leg')) return 'squat';
      if (cat.includes('shoulder')) return 'overhead_press';
      if (cat.includes('arm')) return 'curl';
      if (cat.includes('core')) return 'core_plank';

      return 'curl';
    }

    /**
     * Mount and render the motion player in target DOM element
     */
    mount(containerId, exerciseData) {
      this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!this.container) return;

      this.currentEx = exerciseData || { name: 'Exercise', category: 'General', primary_muscle: 'Full Body' };
      this.motionClass = this.detectMotionClass(this.currentEx);
      this.progress = 0;
      this.isPlaying = true;
      this.speed = 1.0;

      this.buildDOM();
      this.startLoop();
    }

    buildDOM() {
      const primaryMuscle = this.currentEx.primary_muscle || this.currentEx.category || 'Target Muscle';
      const secondaryMuscles = (this.currentEx.secondary_muscles && this.currentEx.secondary_muscles.length) 
        ? this.currentEx.secondary_muscles.join(', ') 
        : 'Stabilizer Muscles';

      const html = `
        <div class="biomech-player relative w-full h-full flex flex-col justify-between select-none">
          <!-- Canvas / SVG Viewport -->
          <div class="relative flex-1 w-full min-h-[220px] max-h-[280px] bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-2">
            <!-- Background Grid Lines -->
            <svg class="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="biomech-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#334155" stroke-width="0.75"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#biomech-grid)" />
            </svg>

            <!-- Dynamic SVG Joint Kinematic Rig -->
            <svg id="biomech-svg" viewBox="0 0 400 280" class="w-full h-full max-h-[260px] object-contain relative z-10">
              <defs>
                <!-- Muscle Activation Glowing Filters -->
                <filter id="glow-primary" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-secondary" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <!-- Floor Ground Line -->
              <line x1="40" y1="240" x2="360" y2="240" stroke="#334155" stroke-width="2" stroke-dasharray="6,6" />

              <!-- Interactive Dynamic Rig Nodes Container -->
              <g id="biomech-rig-group" transform="translate(0, 0)">
                <!-- Generated dynamically by updateFrame -->
              </g>
            </svg>

            <!-- HUD Overlay: Phase & Real-Time Breathing Cue -->
            <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
              <div class="flex items-center gap-2">
                <span id="biomech-phase-badge" class="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  START POSITION
                </span>
                <span class="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800 backdrop-blur-md">
                  ${this.currentEx.category || 'Compound'}
                </span>
              </div>
              <div id="biomech-breath-cue" class="text-[11px] font-extrabold text-teal-300 flex items-center gap-1.5 bg-slate-950/90 border border-teal-500/30 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm">
                <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span>Inhale & Set Posture</span>
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

          <!-- Playback Controls Bar -->
          <div class="mt-3 bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 flex flex-col gap-2">
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

            <!-- Interactive Buttons -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <button 
                  type="button" 
                  id="biomech-play-btn" 
                  class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20"
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

              <!-- Speed Controls -->
              <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button type="button" class="biomech-speed-btn px-2 py-1 rounded text-[10px] font-black transition-colors ${this.speed === 0.5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-speed="0.5">0.5x</button>
                <button type="button" class="biomech-speed-btn px-2 py-1 rounded text-[10px] font-black transition-colors ${this.speed === 1.0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-speed="1.0">1.0x</button>
                <button type="button" class="biomech-speed-btn px-2 py-1 rounded text-[10px] font-black transition-colors ${this.speed === 1.5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}" data-speed="1.5">1.5x</button>
              </div>
            </div>
          </div>
        </div>
      `;

      this.container.innerHTML = html;
      this.attachEventListeners();
    }

    attachEventListeners() {
      const playBtn = this.container.querySelector('#biomech-play-btn');
      const replayBtn = this.container.querySelector('#biomech-replay-btn');
      const scrubber = this.container.querySelector('#biomech-scrubber');
      const speedBtns = this.container.querySelectorAll('.biomech-speed-btn');

      if (playBtn) {
        playBtn.addEventListener('click', () => {
          this.isPlaying = !this.isPlaying;
          this.updatePlayBtnState();
        });
      }

      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          this.progress = 0;
          this.direction = 1;
          this.isPlaying = true;
          this.updatePlayBtnState();
        });
      }

      if (scrubber) {
        scrubber.addEventListener('input', (e) => {
          this.progress = parseFloat(e.target.value) / 100;
          this.isPlaying = false;
          this.updatePlayBtnState();
          this.renderFrame(this.progress);
        });
      }

      speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.speed = parseFloat(btn.getAttribute('data-speed')) || 1.0;
          speedBtns.forEach(b => {
            b.className = 'biomech-speed-btn px-2 py-1 rounded text-[10px] font-black transition-colors text-slate-400 hover:text-white';
          });
          btn.className = 'biomech-speed-btn px-2 py-1 rounded text-[10px] font-black transition-colors bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        });
      });
    }

    updatePlayBtnState() {
      const icon = this.container.querySelector('#biomech-play-icon');
      const text = this.container.querySelector('#biomech-play-text');
      if (icon && text) {
        icon.innerText = this.isPlaying ? '⏸' : '▶';
        text.innerText = this.isPlaying ? 'Pause' : 'Play';
      }
    }

    startLoop() {
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
          }

          const scrubber = this.container.querySelector('#biomech-scrubber');
          const scrubVal = this.container.querySelector('#biomech-scrub-val');
          if (scrubber) scrubber.value = Math.round(this.progress * 100);
          if (scrubVal) scrubVal.innerText = `${Math.round(this.progress * 100)}%`;

          this.renderFrame(this.progress);
        }

        this.animationFrameId = requestAnimationFrame(loop);
      };

      this.animationFrameId = requestAnimationFrame(loop);
    }

    renderFrame(t) {
      const rig = this.container.querySelector('#biomech-rig-group');
      if (!rig) return;

      const easeT = (1 - Math.cos(t * Math.PI)) / 2;

      const phaseBadge = this.container.querySelector('#biomech-phase-badge');
      const breathCue = this.container.querySelector('#biomech-breath-cue');

      if (phaseBadge && breathCue) {
        if (t < 0.15) {
          phaseBadge.innerText = 'START POSITION';
          phaseBadge.className = 'text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded-full';
          breathCue.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-400"></span><span>Inhale & Set Posture</span>`;
        } else if (t < 0.75) {
          if (this.direction === 1) {
            phaseBadge.innerText = 'CONCENTRIC CONTRACTION';
            phaseBadge.className = 'text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]';
            breathCue.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span>Exhale & Drive Contraction</span>`;
          } else {
            phaseBadge.innerText = 'ECCENTRIC RETURN (2s)';
            phaseBadge.className = 'text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full';
            breathCue.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400"></span><span>Inhale & Control Lowering</span>`;
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
        <line x1="${elbowX + 4}" y1="${elbowY}" x2="${handX - 4}" y2="${handY}" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" opacity="0.8" />
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
        <line x1="185" y1="146" x2="160" y2="${elbowY}" stroke="#f59e0b" stroke-width="4" opacity="0.8" />
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
        <line x1="${elbowX}" y1="${elbowY}" x2="${elbowX}" y2="${handY}" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
        <line x1="${elbowX - 15}" y1="${handY}" x2="${elbowX + 15}" y2="${handY}" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" />
      `;
    }

    renderCorePlank(k) {
      const spineY = 175 + Math.sin(k * Math.PI) * 5;

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

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  window.BiomechanicalPlayer = BiomechanicalPlayer;
  window.initExerciseMotionPlayer = function(containerId, exerciseData) {
    if (!window.__activeMotionPlayer) {
      window.__activeMotionPlayer = new BiomechanicalPlayer();
    }
    window.__activeMotionPlayer.mount(containerId, exerciseData);
    return window.__activeMotionPlayer;
  };

})(window);
