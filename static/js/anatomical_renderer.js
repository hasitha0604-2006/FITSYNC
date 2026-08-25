/**
 * FitSync AI — Interactive 2.5D / 3D Anatomical Muscle Highlighter & Visual Demo Player
 * Highlights Primary and Secondary muscle groups for exercises dynamically.
 */

window.FitSyncAnatomicalRenderer = {
  // Muscle region SVG path mappings
  muscleMap: {
    "Chest": ["pec-left", "pec-right", "pec-upper"],
    "Back": ["lat-left", "lat-right", "traps-upper", "rhomboid"],
    "Shoulders": ["delt-front-left", "delt-front-right", "delt-side-left", "delt-side-right", "delt-rear-left", "delt-rear-right"],
    "Biceps": ["bicep-left", "bicep-right", "brachialis"],
    "Triceps": ["tricep-left", "tricep-right", "tricep-long"],
    "Forearms": ["forearm-left", "forearm-right"],
    "Core": ["abs-upper", "abs-lower", "abs-mid"],
    "Abs": ["abs-upper", "abs-lower", "abs-mid"],
    "Obliques": ["oblique-left", "oblique-right"],
    "Glutes": ["glute-left", "glute-right"],
    "Quadriceps": ["quad-rectus-left", "quad-rectus-right", "quad-vastus-left", "quad-vastus-right"],
    "Hamstrings": ["hamstring-left", "hamstring-right"],
    "Calves": ["gastro-left", "gastro-right", "soleus-left", "soleus-right"]
  },

  // Color schemes
  colors: {
    primary: { fill: "rgba(239, 68, 68, 0.85)", stroke: "#dc2626", glow: "0 0 16px rgba(239, 68, 68, 0.75)" },
    secondary: { fill: "rgba(245, 158, 11, 0.75)", stroke: "#d97706", glow: "0 0 10px rgba(245, 158, 11, 0.6)" },
    neutral: { fill: "rgba(51, 65, 85, 0.3)", stroke: "#475569", glow: "none" }
  },

  renderAnatomicalHighlight: function(containerId, primaryMuscles, secondaryMuscles) {
    const container = document.getElementById(containerId);
    if (!container) return;

    primaryMuscles = primaryMuscles || [];
    secondaryMuscles = secondaryMuscles || [];

    // Ensure array format
    if (typeof primaryMuscles === 'string') primaryMuscles = [primaryMuscles];
    if (typeof secondaryMuscles === 'string') secondaryMuscles = [secondaryMuscles];

    let html = `
      <div class="relative w-full max-w-sm mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center select-none shadow-xl">
        <div class="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 mb-3 border-b border-slate-850 pb-2">
          <span class="flex items-center gap-1.5 text-emerald-450 uppercase">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Anatomical Muscle Activation
          </span>
          <span class="text-slate-500 font-mono">2.5D Vector</span>
        </div>

        <!-- Human Anatomical Body SVG Model -->
        <div class="relative h-64 w-full flex items-center justify-center bg-slate-900/60 rounded-xl border border-slate-850 p-2 overflow-hidden">
          <svg viewBox="0 0 200 340" class="h-full w-auto drop-shadow-md">
            <!-- Body Silhouette outline -->
            <path d="M100 15 C110 15 118 23 118 35 C118 45 112 52 105 55 C125 60 145 75 145 105 L140 160 L135 220 L125 320 L105 320 L102 230 L98 230 L95 320 L75 320 L65 220 L60 160 L55 105 C55 75 75 60 95 55 C88 52 82 45 82 35 C82 23 90 15 100 15 Z" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            
            <!-- Head & Neck -->
            <circle cx="100" cy="35" r="16" fill="#334155" />
            
            <!-- Chest Region -->
            <g id="muscle-chest" class="transition-all duration-300">
              <path id="pec-left" d="M100 70 L130 75 L125 100 L100 105 Z" fill="#334155" stroke="#475569" stroke-width="1"/>
              <path id="pec-right" d="M100 70 L70 75 L75 100 L100 105 Z" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Shoulders Region -->
            <g id="muscle-shoulders" class="transition-all duration-300">
              <circle id="delt-front-left" cx="138" cy="78" r="10" fill="#334155" stroke="#475569" stroke-width="1"/>
              <circle id="delt-front-right" cx="62" cy="78" r="10" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Biceps Region -->
            <g id="muscle-biceps" class="transition-all duration-300">
              <rect id="bicep-left" x="135" y="95" width="12" height="28" rx="5" fill="#334155" stroke="#475569" stroke-width="1"/>
              <rect id="bicep-right" x="53" y="95" width="12" height="28" rx="5" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Triceps Region -->
            <g id="muscle-triceps" class="transition-all duration-300">
              <rect id="tricep-left" x="145" y="95" width="8" height="30" rx="4" fill="#334155" stroke="#475569" stroke-width="1"/>
              <rect id="tricep-right" x="47" y="95" width="8" height="30" rx="4" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Abs / Core Region -->
            <g id="muscle-core" class="transition-all duration-300">
              <rect id="abs-upper" x="88" y="110" width="24" height="15" rx="3" fill="#334155" stroke="#475569" stroke-width="1"/>
              <rect id="abs-mid" x="88" y="128" width="24" height="15" rx="3" fill="#334155" stroke="#475569" stroke-width="1"/>
              <rect id="abs-lower" x="88" y="146" width="24" height="15" rx="3" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Back / Lats Region -->
            <g id="muscle-back" class="transition-all duration-300">
              <path id="lat-left" d="M125 105 L138 115 L125 145 L112 145 Z" fill="#334155" stroke="#475569" stroke-width="1"/>
              <path id="lat-right" d="M75 105 L62 115 L75 145 L88 145 Z" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Glutes Region -->
            <g id="muscle-glutes" class="transition-all duration-300">
              <path id="glute-left" d="M100 165 L125 168 L122 205 L100 200 Z" fill="#334155" stroke="#475569" stroke-width="1"/>
              <path id="glute-right" d="M100 165 L75 168 L78 205 L100 200 Z" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Quadriceps Region -->
            <g id="muscle-quadriceps" class="transition-all duration-300">
              <path id="quad-rectus-left" d="M102 205 L122 208 L118 260 L102 255 Z" fill="#334155" stroke="#475569" stroke-width="1"/>
              <path id="quad-rectus-right" d="M98 205 L78 208 L82 260 L98 255 Z" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Hamstrings Region -->
            <g id="muscle-hamstrings" class="transition-all duration-300">
              <rect id="hamstring-left" x="104" y="210" width="16" height="48" rx="4" fill="#334155" stroke="#475569" stroke-width="1"/>
              <rect id="hamstring-right" x="80" y="210" width="16" height="48" rx="4" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>

            <!-- Calves Region -->
            <g id="muscle-calves" class="transition-all duration-300">
              <ellipse id="gastro-left" cx="112" cy="285" rx="8" ry="20" fill="#334155" stroke="#475569" stroke-width="1"/>
              <ellipse id="gastro-right" cx="88" cy="285" rx="8" ry="20" fill="#334155" stroke="#475569" stroke-width="1"/>
            </g>
          </svg>
        </div>

        <!-- Muscle Legend & Tags -->
        <div class="mt-3 space-y-2 text-left">
          <div class="flex items-center gap-2 text-[11px]">
            <span class="w-3 h-3 rounded-full bg-red-500 shadow shadow-red-500/50 inline-block"></span>
            <span class="font-bold text-slate-300">Primary:</span>
            <span class="text-white font-black capitalize">${primaryMuscles.join(', ') || 'General Body'}</span>
          </div>
          <div class="flex items-center gap-2 text-[11px]">
            <span class="w-3 h-3 rounded-full bg-amber-500 shadow shadow-amber-500/50 inline-block"></span>
            <span class="font-bold text-slate-300">Secondary:</span>
            <span class="text-slate-400 font-semibold capitalize">${secondaryMuscles.join(', ') || 'Stabilizers'}</span>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Apply Highlight Colors to SVG Elements
    const applyColor = (muscleName, colorObj) => {
      const key = Object.keys(this.muscleMap).find(k => k.toLowerCase() === muscleName.toLowerCase());
      if (key) {
        const group = container.querySelector(`#muscle-${key.toLowerCase()}`);
        if (group) {
          group.querySelectorAll('path, circle, rect, ellipse').forEach(el => {
            el.setAttribute('fill', colorObj.fill);
            el.setAttribute('stroke', colorObj.stroke);
            el.style.filter = colorObj.glow !== 'none' ? `drop-shadow(${colorObj.glow})` : 'none';
          });
        }
      }
    };

    primaryMuscles.forEach(m => applyColor(m, this.colors.primary));
    secondaryMuscles.forEach(m => applyColor(m, this.colors.secondary));
  }
};
