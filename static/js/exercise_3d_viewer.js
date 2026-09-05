/**
 * FitSync AI — Premium 3D Exercise & Yoga Demonstration Engine
 * Powered by Three.js with Articulated Athletic Mannequin, Dynamic Grip Sockets,
 * Anatomically Locked Equipment Tracking, Dynamic Muscle Shaders, and Phase Telemetry.
 */
(function(window) {
  'use strict';

  class FitSync3DViewer {
    constructor(containerId, options = {}) {
      this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!this.container) {
        console.error(`[FitSync 3D Viewer] Container element #${containerId} not found.`);
        return;
      }

      this.options = Object.assign({
        speed: 1.0,
        autoPlay: true,
        showControls: true,
        showPhases: true,
        enableOrbit: true
      }, options);

      this.isPlaying = true;
      this.playbackSpeed = this.options.speed || 1.0;
      this.animationProgress = 0.0; // 0.0 -> 1.0
      this.currentPhaseIndex = 0;
      this.activeExercise = null;
      this.activeConfig = null;
      this.clock = null;
      this.rafId = null;

      // Three.js instances
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;

      // Rigged Meshes & Groups
      this.mannequinRoot = null;
      this.joints = {};
      this.muscleMeshes = {};
      this.equipmentRoot = null;
      this.equipmentParts = {};

      this.init();
    }

    /**
     * Build Three.js scene, lighting, studio environment and control overlay
     */
    init() {
      this.container.innerHTML = '';
      this.container.style.position = 'relative';
      this.container.style.overflow = 'hidden';
      this.container.style.userSelect = 'none';

      const width = this.container.clientWidth || 640;
      const height = this.container.clientHeight || 360;

      // 1. Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x020617); // Slate-950
      this.scene.fog = new THREE.FogExp2(0x020617, 0.06);

      // 2. Camera
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(2.8, 2.0, 3.8);

      // 3. WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (this.renderer.outputColorSpace) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      this.container.appendChild(this.renderer.domElement);

      // 4. OrbitControls
      if (typeof THREE.OrbitControls === 'function') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // don't go below floor
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 9.0;
        this.controls.target.set(0, 0.9, 0);
      }

      // 5. Studio Lighting
      this.setupStudioLighting();

      // 6. Studio Floor Grid
      this.setupStudioFloor();

      // 7. Rig Mannequin & Equipment
      this.buildAthleticMannequin();
      this.buildEquipmentRig();

      // 8. Build UI Overlay (Controls, Phase HUD, Speed, Fullscreen)
      this.buildUIOverlay();

      // 9. Clock & Resize Listener
      this.clock = new THREE.Clock();
      this.onWindowResize = this.handleResize.bind(this);
      window.addEventListener('resize', this.onWindowResize);

      // 10. Start Animation Loop
      this.animate = this.animate.bind(this);
      this.rafId = requestAnimationFrame(this.animate);
    }

    /**
     * Professional Studio Lighting Setup
     */
    setupStudioLighting() {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
      this.scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.55);
      this.scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
      keyLight.position.set(3.5, 7.0, 4.5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 20;
      keyLight.shadow.bias = -0.0005;
      const d = 3.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      this.scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x10b981, 0.95);
      rimLight.position.set(-4.0, 4.0, -3.5);
      this.scene.add(rimLight);

      const fillLight = new THREE.PointLight(0x06b6d4, 0.8, 10);
      fillLight.position.set(0, 1.2, 3.0);
      this.scene.add(fillLight);
    }

    /**
     * Studio Floor with Radial Vignette & Grid
     */
    setupStudioFloor() {
      const floorGeo = new THREE.PlaneGeometry(16, 16);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x090e17,
        roughness: 0.85,
        metalness: 0.2
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      this.scene.add(floor);

      const grid = new THREE.GridHelper(10, 20, 0x10b981, 0x1e293b);
      grid.position.y = 0.002;
      this.scene.add(grid);
    }

    /**
     * Procedural Rigged Humanoid Athletic Mannequin with Anatomical Hands and Grip Sockets
     */
    buildAthleticMannequin() {
      this.mannequinRoot = new THREE.Group();
      this.mannequinRoot.name = 'MannequinRoot';
      this.scene.add(this.mannequinRoot);

      // Material Palettes
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0x222a38,
        roughness: 0.45,
        metalness: 0.2
      });
      const jointMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.5
      });
      const gloveMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
        metalness: 0.4
      });

      // ── HIPS / PELVIS ──
      const hipsGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.16, 16);
      const hipsMesh = new THREE.Mesh(hipsGeo, skinMat);
      hipsMesh.castShadow = true;
      const hips = new THREE.Group();
      hips.position.set(0, 0.95, 0);
      hips.add(hipsMesh);
      this.mannequinRoot.add(hips);
      this.joints['hips'] = hips;

      // ── SPINE & CHEST / TORSO ──
      const spine = new THREE.Group();
      spine.position.set(0, 0.08, 0);
      hips.add(spine);
      this.joints['spine'] = spine;

      const torsoGeo = new THREE.CylinderGeometry(0.20, 0.15, 0.28, 16);
      const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
      torsoMesh.position.set(0, 0.14, 0);
      torsoMesh.castShadow = true;
      spine.add(torsoMesh);

      // ── CHEST / PECS (Active Muscle Mesh) ──
      const chestGeo = new THREE.BoxGeometry(0.36, 0.16, 0.14);
      const chestMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.4,
        metalness: 0.3
      });
      const chestMesh = new THREE.Mesh(chestGeo, chestMat);
      chestMesh.position.set(0, 0.22, 0.07);
      chestMesh.castShadow = true;
      spine.add(chestMesh);
      this.muscleMeshes['chest'] = chestMesh;

      // ── LATS / BACK (Active Muscle Mesh) ──
      const latsGeo = new THREE.BoxGeometry(0.38, 0.20, 0.10);
      const latsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const latsMesh = new THREE.Mesh(latsGeo, latsMat);
      latsMesh.position.set(0, 0.18, -0.06);
      spine.add(latsMesh);
      this.muscleMeshes['lats'] = latsMesh;

      // ── NECK & HEAD ──
      const neckGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.08, 12);
      const neck = new THREE.Mesh(neckGeo, jointMat);
      neck.position.set(0, 0.32, 0);
      spine.add(neck);

      const head = new THREE.Group();
      head.position.set(0, 0.12, 0);
      neck.add(head);
      this.joints['head'] = head;

      // Athletic Helmet Head with Glowing Visor
      const headGeo = new THREE.SphereGeometry(0.12, 20, 20);
      headGeo.scale(0.9, 1.15, 1.0);
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headMesh.castShadow = true;
      head.add(headMesh);

      const visorGeo = new THREE.BoxGeometry(0.16, 0.04, 0.08);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8
      });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.02, 0.09);
      head.add(visor);

      // ── ARMS & ANATOMICAL GRIP HANDS ──
      const buildArm = (side) => {
        const sign = side === 'left' ? 1 : -1;
        const shoulderJoint = new THREE.Group();
        shoulderJoint.position.set(sign * 0.23, 0.24, 0);
        spine.add(shoulderJoint);
        this.joints[`shoulder_${side}`] = shoulderJoint;

        // Deltoid muscle mesh
        const deltGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const deltMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const deltMesh = new THREE.Mesh(deltGeo, deltMat);
        shoulderJoint.add(deltMesh);
        this.muscleMeshes[`deltoid_${side}`] = deltMesh;

        // Upper Arm
        const upperArm = new THREE.Group();
        upperArm.position.set(0, 0, 0);
        shoulderJoint.add(upperArm);
        this.joints[`upper_arm_${side}`] = upperArm;

        const bicepGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.26, 12);
        const bicepMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const bicepMesh = new THREE.Mesh(bicepGeo, bicepMat);
        bicepMesh.position.set(0, -0.13, 0);
        bicepMesh.castShadow = true;
        upperArm.add(bicepMesh);
        this.muscleMeshes[`bicep_${side}`] = bicepMesh;
        this.muscleMeshes[`tricep_${side}`] = bicepMesh;

        // Elbow Joint
        const elbow = new THREE.Group();
        elbow.position.set(0, -0.26, 0);
        upperArm.add(elbow);
        this.joints[`elbow_${side}`] = elbow;

        const elbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), jointMat);
        elbow.add(elbowCap);

        // Forearm
        const forearm = new THREE.Group();
        elbow.add(forearm);
        this.joints[`forearm_${side}`] = forearm;

        const forearmGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.24, 12);
        const forearmMesh = new THREE.Mesh(forearmGeo, skinMat);
        forearmMesh.position.set(0, -0.12, 0);
        forearmMesh.castShadow = true;
        forearm.add(forearmMesh);

        // Hand Wrist & Palm
        const hand = new THREE.Group();
        hand.position.set(0, -0.24, 0);
        forearm.add(hand);
        this.joints[`hand_${side}`] = hand;

        // Palm Mesh (Gloved Athletic Palm)
        const palmGeo = new THREE.BoxGeometry(0.045, 0.065, 0.038);
        const palmMesh = new THREE.Mesh(palmGeo, gloveMat);
        palmMesh.position.set(0, -0.03, 0);
        hand.add(palmMesh);

        // Curved Gripping Fingers (wrapping securely around bar/handle)
        const fingerCuffGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.045, 12, 1, false, 0, Math.PI * 1.3);
        const fingerCuffMesh = new THREE.Mesh(fingerCuffGeo, gloveMat);
        fingerCuffMesh.rotation.z = Math.PI / 2;
        fingerCuffMesh.position.set(0, -0.035, 0.015);
        hand.add(fingerCuffMesh);

        // Thumb wrapping counter-opposed
        const thumbGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.035, 8);
        const thumbMesh = new THREE.Mesh(thumbGeo, gloveMat);
        thumbMesh.position.set(sign * -0.025, -0.02, 0.012);
        thumbMesh.rotation.z = sign * -0.6;
        hand.add(thumbMesh);

        // Grip reference socket (exact geometric center where bar/handle passes through palm)
        const gripSocket = new THREE.Group();
        gripSocket.name = `grip_${side}`;
        gripSocket.position.set(0, -0.035, 0.015);
        hand.add(gripSocket);
        this.joints[`grip_${side}`] = gripSocket;
      };

      buildArm('left');
      buildArm('right');

      // ── LEGS (LEFT & RIGHT) ──
      const buildLeg = (side) => {
        const sign = side === 'left' ? 1 : -1;
        const hipJoint = new THREE.Group();
        hipJoint.position.set(sign * 0.11, -0.06, 0);
        hips.add(hipJoint);
        this.joints[`hip_${side}`] = hipJoint;

        // Glute mesh
        const gluteGeo = new THREE.SphereGeometry(0.09, 12, 12);
        const gluteMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const gluteMesh = new THREE.Mesh(gluteGeo, gluteMat);
        gluteMesh.position.set(0, -0.04, -0.06);
        hipJoint.add(gluteMesh);
        this.muscleMeshes[`glute_${side}`] = gluteMesh;

        // Thigh
        const thigh = new THREE.Group();
        hipJoint.add(thigh);
        this.joints[`thigh_${side}`] = thigh;

        const quadGeo = new THREE.CylinderGeometry(0.09, 0.065, 0.40, 14);
        const quadMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const quadMesh = new THREE.Mesh(quadGeo, quadMat);
        quadMesh.position.set(0, -0.20, 0);
        quadMesh.castShadow = true;
        thigh.add(quadMesh);
        this.muscleMeshes[`quad_${side}`] = quadMesh;
        this.muscleMeshes[`hamstring_${side}`] = quadMesh;

        // Knee Joint
        const knee = new THREE.Group();
        knee.position.set(0, -0.40, 0);
        thigh.add(knee);
        this.joints[`knee_${side}`] = knee;

        const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), jointMat);
        knee.add(kneeCap);

        // Shin / Calf
        const shin = new THREE.Group();
        knee.add(shin);
        this.joints[`shin_${side}`] = shin;

        const calfGeo = new THREE.CylinderGeometry(0.065, 0.045, 0.38, 12);
        const calfMesh = new THREE.Mesh(calfGeo, skinMat);
        calfMesh.position.set(0, -0.19, 0);
        calfMesh.castShadow = true;
        shin.add(calfMesh);

        // Ankle & Foot
        const foot = new THREE.Group();
        foot.position.set(0, -0.38, 0);
        shin.add(foot);
        this.joints[`foot_${side}`] = foot;

        const shoeGeo = new THREE.BoxGeometry(0.09, 0.07, 0.20);
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        const shoe = new THREE.Mesh(shoeGeo, shoeMat);
        shoe.position.set(0, -0.03, 0.05);
        shoe.castShadow = true;
        foot.add(shoe);
      };

      buildLeg('left');
      buildLeg('right');
    }

    /**
     * Equipment Rigs: Olympic Barbell, Benches, Dumbbells, Cable Stations, Yoga Mat
     */
    buildEquipmentRig() {
      this.equipmentRoot = new THREE.Group();
      this.equipmentRoot.name = 'EquipmentRoot';
      this.scene.add(this.equipmentRoot);

      const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.5 });
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const benchLeather = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });

      // ── 1. OLYMPIC BARBELL ──
      const barbell = new THREE.Group();
      const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.1, 16);
      const bar = new THREE.Mesh(barGeo, chromeMat);
      bar.rotation.z = Math.PI / 2; // Lie along X axis by default
      barbell.add(bar);

      // Weight Plates (Left & Right Sleeves)
      [-0.85, 0.85].forEach(x => {
        const plateGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24);
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.rotation.z = Math.PI / 2;
        plate.position.x = x;
        plate.castShadow = true;
        barbell.add(plate);

        const plate2Geo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24);
        const plate2 = new THREE.Mesh(plate2Geo, plateMat);
        plate2.rotation.z = Math.PI / 2;
        plate2.position.x = x + (x > 0 ? 0.04 : -0.04);
        barbell.add(plate2);
      });
      barbell.visible = false;
      this.equipmentRoot.add(barbell);
      this.equipmentParts['barbell'] = barbell;

      // ── 2. FLAT BENCH ──
      const flatBench = new THREE.Group();
      const padGeo = new THREE.BoxGeometry(0.32, 0.08, 1.25);
      const pad = new THREE.Mesh(padGeo, benchLeather);
      pad.position.set(0, 0.45, 0);
      pad.castShadow = true;
      flatBench.add(pad);

      [-0.45, 0.45].forEach(z => {
        const legGeo = new THREE.BoxGeometry(0.28, 0.42, 0.06);
        const leg = new THREE.Mesh(legGeo, benchMat);
        leg.position.set(0, 0.21, z);
        leg.castShadow = true;
        flatBench.add(leg);
      });
      flatBench.visible = false;
      this.equipmentRoot.add(flatBench);
      this.equipmentParts['flat_bench'] = flatBench;

      // ── 3. INCLINE BENCH ──
      const inclineBench = new THREE.Group();
      const incPad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.92), benchLeather);
      incPad.position.set(0, 0.65, -0.15);
      incPad.rotation.x = 0.55; // ~32 degree incline
      incPad.castShadow = true;
      inclineBench.add(incPad);

      const seatPad = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.08, 0.32), benchLeather);
      seatPad.position.set(0, 0.45, 0.32);
      inclineBench.add(seatPad);
      inclineBench.visible = false;
      this.equipmentRoot.add(inclineBench);
      this.equipmentParts['incline_bench'] = inclineBench;

      // ── 4. HEX DUMBBELLS (PAIR) ──
      const buildDumbbell = () => {
        const db = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 12), chromeMat);
        db.add(handle);
        [-0.09, 0.09].forEach(y => {
          const head = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.06, 6), plateMat);
          head.position.y = y;
          db.add(head);
        });
        return db;
      };

      const dbLeft = buildDumbbell();
      const dbRight = buildDumbbell();
      dbLeft.visible = false;
      dbRight.visible = false;
      this.equipmentRoot.add(dbLeft);
      this.equipmentRoot.add(dbRight);
      this.equipmentParts['dumbbell_left'] = dbLeft;
      this.equipmentParts['dumbbell_right'] = dbRight;

      // ── 5. LAT PULLDOWN TOWER ──
      const latTower = new THREE.Group();
      const towerPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 0.12), benchMat);
      towerPost.position.set(0, 1.25, -0.85);
      latTower.add(towerPost);

      const topArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.1), benchMat);
      topArm.position.set(0, 2.45, -0.35);
      latTower.add(topArm);

      const latBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.35, 16), chromeMat);
      latBar.rotation.z = Math.PI / 2;
      latBar.position.set(0, 2.0, 0);
      latTower.add(latBar);
      this.equipmentParts['lat_bar'] = latBar;

      const latSeat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.45), benchLeather);
      latSeat.position.set(0, 0.48, 0.1);
      latTower.add(latSeat);

      latTower.visible = false;
      this.equipmentRoot.add(latTower);
      this.equipmentParts['lat_tower'] = latTower;

      // ── 6. SEATED CABLE ROW STATION ──
      const cableRow = new THREE.Group();
      const rowBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.3), benchMat);
      rowBase.position.set(0, 0.22, 0.15);
      cableRow.add(rowBase);

      const footPlates = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.25, 0.04), chromeMat);
      footPlates.position.set(0, 0.35, -0.55);
      cableRow.add(footPlates);

      const rowHandle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 8, 16), chromeMat);
      rowHandle.position.set(0, 0.8, -0.3);
      cableRow.add(rowHandle);
      this.equipmentParts['row_handle'] = rowHandle;

      cableRow.visible = false;
      this.equipmentRoot.add(cableRow);
      this.equipmentParts['cable_row'] = cableRow;

      // ── 7. YOGA MAT ──
      const matGeo = new THREE.BoxGeometry(0.75, 0.01, 1.85);
      const matMat = new THREE.MeshStandardMaterial({
        color: 0x059669,
        roughness: 0.7,
        metalness: 0.1
      });
      const yogaMat = new THREE.Mesh(matGeo, matMat);
      yogaMat.position.set(0, 0.005, 0);
      yogaMat.receiveShadow = true;
      yogaMat.visible = false;
      this.equipmentRoot.add(yogaMat);
      this.equipmentParts['yoga_mat'] = yogaMat;
    }

    /**
     * Build Controls, Phase Progress HUD, and Speed Selector
     */
    buildUIOverlay() {
      const hud = document.createElement('div');
      hud.className = 'absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-4 z-10 font-sans';
      hud.innerHTML = `
        <!-- Top Bar: Phase Progress Indicator & Muscle Target Badge -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-2xl shadow-lg pointer-events-auto">
            <span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span id="hud-exercise-title" class="text-xs font-black text-white">3D Kinematics</span>
          </div>

          <!-- Movement Phase Steps (Synchronized) -->
          <div id="hud-phase-container" class="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-2xl shadow-lg pointer-events-auto text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span id="phase-step-0" class="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 transition-all">START</span>
            <span class="text-slate-600">→</span>
            <span id="phase-step-1" class="px-2 py-0.5 rounded-lg transition-all">MOVE</span>
            <span class="text-slate-600">→</span>
            <span id="phase-step-2" class="px-2 py-0.5 rounded-lg transition-all">PEAK</span>
            <span class="text-slate-600">→</span>
            <span id="phase-step-3" class="px-2 py-0.5 rounded-lg transition-all">RETURN</span>
          </div>

          <div class="flex items-center gap-1 pointer-events-auto">
            <button id="btn-3d-reset-cam" class="bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-md transition-all flex items-center gap-1" title="Reset Camera View">
              <span>↻ Reset View</span>
            </button>
          </div>
        </div>

        <!-- Center Inactive / Loading Badge -->
        <div id="hud-fallback-msg" class="hidden self-center bg-slate-900/90 border border-amber-500/40 p-4 rounded-2xl text-center max-w-sm pointer-events-auto shadow-2xl">
          <p class="text-xs font-bold text-amber-400">3D Demonstration in Standby</p>
          <p class="text-[10px] text-slate-300 mt-1">Movement instructions and form checkpoints are active below.</p>
        </div>

        <!-- Bottom Control Bar -->
        <div class="flex items-center justify-between gap-3 bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 p-2.5 rounded-2xl shadow-2xl pointer-events-auto">
          <div class="flex items-center gap-1.5">
            <button id="btn-3d-play-pause" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-transform active:scale-95 flex items-center gap-1 shadow-md shadow-emerald-500/20">
              <span id="play-pause-icon">⏸ Pause</span>
            </button>
            <button id="btn-3d-replay" class="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors" title="Replay from start">
              ↻
            </button>
          </div>

          <!-- Playback Scrubber -->
          <div class="flex-1 max-w-xs flex items-center gap-2">
            <input type="range" id="slider-3d-progress" min="0" max="100" value="0" class="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg">
          </div>

          <!-- Speed Controls -->
          <div class="flex items-center gap-1 text-[10px] font-bold">
            <button data-speed="0.5" class="btn-3d-spd px-2 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800">0.5x</button>
            <button data-speed="0.75" class="btn-3d-spd px-2 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800">0.75x</button>
            <button data-speed="1.0" class="btn-3d-spd px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">1x</button>
            <button data-speed="1.25" class="btn-3d-spd px-2 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800">1.25x</button>
          </div>
        </div>
      `;

      this.container.appendChild(hud);

      // Bind HUD Events
      const playBtn = hud.querySelector('#btn-3d-play-pause');
      const replayBtn = hud.querySelector('#btn-3d-replay');
      const resetCamBtn = hud.querySelector('#btn-3d-reset-cam');
      const scrubber = hud.querySelector('#slider-3d-progress');
      const speedBtns = hud.querySelectorAll('.btn-3d-spd');

      playBtn.addEventListener('click', () => this.togglePlay());
      replayBtn.addEventListener('click', () => {
        this.animationProgress = 0.0;
        this.isPlaying = true;
        this.updatePlayBtnText();
      });
      resetCamBtn.addEventListener('click', () => this.resetCameraView());

      scrubber.addEventListener('input', (e) => {
        this.animationProgress = parseFloat(e.target.value) / 100.0;
        this.evaluateKinematics(this.animationProgress);
      });

      speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          speedBtns.forEach(b => {
            b.className = 'btn-3d-spd px-2 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800';
          });
          btn.className = 'btn-3d-spd px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
          this.playbackSpeed = parseFloat(btn.getAttribute('data-speed')) || 1.0;
        });
      });
    }

    /**
     * Load an exercise configuration and mount appropriate equipment & camera preset
     */
    loadExercise(exercise) {
      if (!exercise) return;
      this.activeExercise = exercise;
      const config = window.getExercise3DConfig ? window.getExercise3DConfig(exercise) : null;
      this.activeConfig = config;

      // Update Title
      const titleEl = this.container.querySelector('#hud-exercise-title');
      if (titleEl) titleEl.innerText = exercise.name || '3D Exercise Motion';

      // Update Phase labels if custom
      if (config && config.phases && config.phases.length === 4) {
        for (let i = 0; i < 4; i++) {
          const pEl = this.container.querySelector(`#phase-step-${i}`);
          if (pEl) pEl.innerText = config.phases[i];
        }
      }

      // Hide all equipment by default
      Object.values(this.equipmentParts).forEach(part => {
        if (part) part.visible = false;
      });

      // Enable relevant equipment
      const eq = (config ? config.equipment : '').toLowerCase();
      if (eq.includes('barbell_bench')) {
        if (this.equipmentParts['barbell']) this.equipmentParts['barbell'].visible = true;
        if (this.equipmentParts['flat_bench']) this.equipmentParts['flat_bench'].visible = true;
      } else if (eq.includes('incline_bench')) {
        if (this.equipmentParts['barbell']) this.equipmentParts['barbell'].visible = true;
        if (this.equipmentParts['incline_bench']) this.equipmentParts['incline_bench'].visible = true;
      } else if (eq.includes('dumbbell_bench')) {
        if (this.equipmentParts['dumbbell_left']) this.equipmentParts['dumbbell_left'].visible = true;
        if (this.equipmentParts['dumbbell_right']) this.equipmentParts['dumbbell_right'].visible = true;
        if (this.equipmentParts['flat_bench']) this.equipmentParts['flat_bench'].visible = true;
      } else if (eq.includes('dumbbells')) {
        if (this.equipmentParts['dumbbell_left']) this.equipmentParts['dumbbell_left'].visible = true;
        if (this.equipmentParts['dumbbell_right']) this.equipmentParts['dumbbell_right'].visible = true;
      } else if (eq.includes('barbell')) {
        if (this.equipmentParts['barbell']) this.equipmentParts['barbell'].visible = true;
      } else if (eq.includes('lat_pulldown')) {
        if (this.equipmentParts['lat_tower']) this.equipmentParts['lat_tower'].visible = true;
      } else if (eq.includes('cable_row')) {
        if (this.equipmentParts['cable_row']) this.equipmentParts['cable_row'].visible = true;
      } else if (eq.includes('cable_station')) {
        if (this.equipmentParts['barbell']) {
          this.equipmentParts['barbell'].visible = true;
          this.equipmentParts['barbell'].scale.set(0.4, 0.4, 0.4);
        }
      } else if (eq.includes('yoga_mat') || (exercise.category || '').toLowerCase() === 'yoga') {
        if (this.equipmentParts['yoga_mat']) this.equipmentParts['yoga_mat'].visible = true;
      }

      // Highlight target muscles
      this.highlightMuscles(exercise.primary_muscles || (config ? config.primary_muscles : []), exercise.secondary_muscles || (config ? config.secondary_muscles : []));

      // Camera Preset
      this.resetCameraView();

      this.animationProgress = 0.0;
      this.isPlaying = true;
      this.updatePlayBtnText();
    }

    /**
     * Muscle Emission Shader Activation
     */
    highlightMuscles(primaryList = [], secondaryList = []) {
      const primStr = (Array.isArray(primaryList) ? primaryList.join(' ') : String(primaryList)).toLowerCase();
      const secStr = (Array.isArray(secondaryList) ? secondaryList.join(' ') : String(secondaryList)).toLowerCase();

      Object.keys(this.muscleMeshes).forEach(key => {
        const mesh = this.muscleMeshes[key];
        if (!mesh || !mesh.material) return;

        let isPrimary = false;
        let isSecondary = false;

        if (key.includes('chest') && (primStr.includes('chest') || primStr.includes('pectoral'))) isPrimary = true;
        if (key.includes('lats') && (primStr.includes('lat') || primStr.includes('back'))) isPrimary = true;
        if (key.includes('bicep') && primStr.includes('bicep')) isPrimary = true;
        if (key.includes('tricep') && primStr.includes('tricep')) isPrimary = true;
        if (key.includes('deltoid') && (primStr.includes('deltoid') || primStr.includes('shoulder'))) isPrimary = true;
        if (key.includes('quad') && (primStr.includes('quad') || primStr.includes('leg') || primStr.includes('thigh'))) isPrimary = true;
        if (key.includes('glute') && (primStr.includes('glute') || primStr.includes('hip'))) isPrimary = true;

        if (!isPrimary) {
          if (key.includes('tricep') && (secStr.includes('tricep') || primStr.includes('chest') || primStr.includes('shoulder'))) isSecondary = true;
          if (key.includes('deltoid') && (secStr.includes('deltoid') || secStr.includes('shoulder') || primStr.includes('chest'))) isSecondary = true;
          if (key.includes('bicep') && (secStr.includes('bicep') || primStr.includes('lat') || primStr.includes('back'))) isSecondary = true;
          if (key.includes('glute') && (secStr.includes('glute') || primStr.includes('quad') || primStr.includes('hamstring'))) isSecondary = true;
        }

        if (isPrimary) {
          mesh.material.color.setHex(0x10b981);
          mesh.material.emissive = new THREE.Color(0x10b981);
          mesh.material.emissiveIntensity = 0.65;
        } else if (isSecondary) {
          mesh.material.color.setHex(0x06b6d4);
          mesh.material.emissive = new THREE.Color(0x06b6d4);
          mesh.material.emissiveIntensity = 0.35;
        } else {
          mesh.material.color.setHex(0x222a38);
          mesh.material.emissive = new THREE.Color(0x000000);
          mesh.material.emissiveIntensity = 0.0;
        }
      });
    }

    /**
     * Reset Camera to Optimal Angle
     */
    resetCameraView() {
      const config = this.activeConfig;
      const preset = (config && config.camera ? config.camera.preset : 'front_3_4');
      const dist = (config && config.camera ? config.camera.distance : 4.5);
      const targetY = (config && config.camera ? config.camera.targetY : 0.9);

      if (preset === 'side_3_4') {
        this.camera.position.set(dist * 0.8, 1.8, dist * 0.6);
      } else if (preset === 'front_3_4') {
        this.camera.position.set(dist * 0.5, 1.9, dist * 0.85);
      } else {
        this.camera.position.set(0, 1.8, dist);
      }

      if (this.controls) {
        this.controls.target.set(0, targetY, 0);
        this.controls.update();
      }
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      this.updatePlayBtnText();
    }

    updatePlayBtnText() {
      const icon = this.container.querySelector('#play-pause-icon');
      if (icon) {
        icon.innerText = this.isPlaying ? '⏸ Pause' : '▶ Play';
      }
    }

    /**
     * Mathematical Articulation Engine for All Exercises & Yoga Poses with Dynamic Equipment Grasping
     */
    evaluateKinematics(t) {
      const anim = (this.activeConfig ? this.activeConfig.animation : 'squat');
      const j = this.joints;
      const eq = this.equipmentParts;

      // Update Phase HUD
      let phaseIdx = 0;
      if (t < 0.15) phaseIdx = 0;
      else if (t < 0.50) phaseIdx = 1;
      else if (t < 0.65) phaseIdx = 2;
      else phaseIdx = 3;

      if (phaseIdx !== this.currentPhaseIndex) {
        this.currentPhaseIndex = phaseIdx;
        for (let i = 0; i < 4; i++) {
          const stepEl = this.container.querySelector(`#phase-step-${i}`);
          if (stepEl) {
            if (i === phaseIdx) {
              stepEl.className = 'px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-black shadow-sm';
            } else {
              stepEl.className = 'px-2 py-0.5 rounded-lg transition-all text-slate-400';
            }
          }
        }
      }

      // Smooth wave progression (0 -> 1 -> 0)
      const easeWave = (1 - Math.cos(t * 2 * Math.PI)) / 2;

      // Reset base roots
      j.hips.position.set(0, 0.95, 0);
      j.hips.rotation.set(0, 0, 0);
      j.spine.rotation.set(0, 0, 0);
      j.head.rotation.set(0, 0, 0);
      ['left', 'right'].forEach(s => {
        j[`shoulder_${s}`].rotation.set(0, 0, 0);
        j[`upper_arm_${s}`].rotation.set(0, 0, 0);
        j[`elbow_${s}`].rotation.set(0, 0, 0);
        j[`forearm_${s}`].rotation.set(0, 0, 0);
        j[`hand_${s}`].rotation.set(0, 0, 0);
        j[`hip_${s}`].rotation.set(0, 0, 0);
        j[`thigh_${s}`].rotation.set(0, 0, 0);
        j[`knee_${s}`].rotation.set(0, 0, 0);
        j[`shin_${s}`].rotation.set(0, 0, 0);
        j[`foot_${s}`].rotation.set(0, 0, 0);
      });

      // ── 1. SQUAT / BARBELL SQUAT ──
      if (anim === 'squat') {
        const depth = easeWave * 0.45;
        j.hips.position.y = 0.95 - depth;
        j.hips.position.z = -depth * 0.35;
        j.spine.rotation.x = depth * 0.65; // athletic torso hip-hinge incline

        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`thigh_${s}`].rotation.x = -depth * 2.3; // hip flexion
          j[`knee_${s}`].rotation.x = depth * 2.7;   // knee flexion to parallel
          // Hands firmly gripping bar on traps
          j[`shoulder_${s}`].rotation.set(-0.35, sign * 0.2, sign * 0.95);
          j[`elbow_${s}`].rotation.set(1.95, 0, sign * -0.2);
          j[`hand_${s}`].rotation.set(0.3, 0, 0);
        });
      }

      // ── 2. BENCH PRESS (FLAT) ──
      else if (anim === 'bench_press') {
        j.hips.position.set(0, 0.48, -0.05);
        j.hips.rotation.x = -Math.PI / 2; // Lie flat on bench
        j.spine.rotation.x = 0.05; // natural slight arch

        // Feet planted firmly on floor
        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`thigh_${s}`].rotation.set(0.55, sign * 0.25, 0);
          j[`knee_${s}`].rotation.set(1.45, 0, 0);

          // Barbell press trajectory: 75° tucked elbows, vertical press
          const press = easeWave; // 0 = lockout at top, 1 = touching chest
          j[`shoulder_${s}`].rotation.set(
            -(0.6 + press * 0.5),
            sign * (0.2 + press * 0.3),
            sign * (0.85 - press * 0.45)
          );
          j[`elbow_${s}`].rotation.set((1 - press) * 0.2 + press * 1.55, 0, 0);
          j[`hand_${s}`].rotation.set(press * 0.3, 0, 0);
        });
      }

      // ── 3. INCLINE BENCH PRESS ──
      else if (anim === 'incline_bench_press') {
        j.hips.position.set(0, 0.50, 0.18);
        j.hips.rotation.x = -Math.PI / 2 + 0.55; // 32 deg incline

        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`thigh_${s}`].rotation.set(0.4, sign * 0.2, 0);
          j[`knee_${s}`].rotation.set(1.2, 0, 0);

          const press = easeWave;
          j[`shoulder_${s}`].rotation.set(
            -(0.5 + press * 0.45),
            sign * (0.2 + press * 0.25),
            sign * (0.8 - press * 0.4)
          );
          j[`elbow_${s}`].rotation.set((1 - press) * 0.2 + press * 1.5, 0, 0);
        });
      }

      // ── 4. DUMBBELL BENCH PRESS ──
      else if (anim === 'dumbbell_bench_press') {
        j.hips.position.set(0, 0.48, -0.05);
        j.hips.rotation.x = -Math.PI / 2;

        const press = easeWave;
        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`thigh_${s}`].rotation.set(0.55, sign * 0.25, 0);
          j[`knee_${s}`].rotation.set(1.45, 0, 0);

          j[`shoulder_${s}`].rotation.set(
            -(0.6 + press * 0.45),
            sign * (0.2 + press * 0.3),
            sign * (0.9 - press * 0.4)
          );
          j[`elbow_${s}`].rotation.set((1 - press) * 0.2 + press * 1.55, 0, 0);
          j[`hand_${s}`].rotation.set(0, 0, sign * (0.2 - press * 0.1));
        });
      }

      // ── 5. PUSH-UP ──
      else if (anim === 'push_up') {
        const descent = easeWave * 0.26;
        j.hips.position.set(0, 0.42 - descent, 0);
        j.hips.rotation.x = -Math.PI / 2 + 0.12; // straight plank line

        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`shoulder_${s}`].rotation.set(
            -(0.7 + easeWave * 0.35),
            sign * 0.2,
            sign * (0.65 + easeWave * 0.35)
          );
          j[`elbow_${s}`].rotation.set(easeWave * 1.6, 0, 0);
          j[`hand_${s}`].rotation.set(-1.4, 0, 0); // hands flat on floor
        });
      }

      // ── 6. LAT PULLDOWN ──
      else if (anim === 'lat_pulldown') {
        j.hips.position.set(0, 0.55, 0.1);
        j.thigh_left.rotation.x = -1.5;
        j.thigh_right.rotation.x = -1.5;
        j.knee_left.rotation.x = 1.5;
        j.knee_right.rotation.x = 1.5;

        const pull = easeWave;
        j.spine.rotation.x = -pull * 0.22; // slight upper back arch

        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          // Overhead reach to collarbone pull
          j[`shoulder_${s}`].rotation.set(
            -(2.6 - pull * 1.7),
            sign * 0.2,
            sign * (1.1 - pull * 0.4)
          );
          j[`elbow_${s}`].rotation.set(pull * 1.95, 0, 0);
          j[`hand_${s}`].rotation.set(0.3, 0, 0);
        });
      }

      // ── 7. SEATED CABLE ROW ──
      else if (anim === 'seated_cable_row') {
        j.hips.position.set(0, 0.32, 0.2);
        j.thigh_left.rotation.x = -1.45;
        j.thigh_right.rotation.x = -1.45;
        j.knee_left.rotation.x = 0.3;
        j.knee_right.rotation.x = 0.3;

        const row = easeWave;
        j.spine.rotation.x = (0.5 - row) * 0.22;

        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`shoulder_${s}`].rotation.set(
            (1 - row) * -1.2 + row * 0.35,
            sign * 0.1,
            sign * 0.25
          );
          j[`elbow_${s}`].rotation.set(row * 1.85, 0, 0);
        });
      }

      // ── 8. BICEP CURL / BARBELL CURL ──
      else if (anim === 'bicep_curl') {
        const curl = easeWave * 2.15;
        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`shoulder_${s}`].rotation.set(0.08, 0, sign * 0.1); // upper arms pinned to sides
          j[`elbow_${s}`].rotation.set(curl, 0, 0);             // forearm supinated curl
          j[`hand_${s}`].rotation.set(0.2, 0, 0);
        });
      }

      // ── 9. TRICEP PUSHDOWN ──
      else if (anim === 'tricep_pushdown') {
        j.spine.rotation.x = 0.22; // athletic hip hinge
        const push = easeWave;

        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`shoulder_${s}`].rotation.set(0.28, 0, sign * 0.15); // upper arms locked at torso
          j[`elbow_${s}`].rotation.set((1 - push) * 1.75, 0, 0); // extends downwards
          j[`hand_${s}`].rotation.set(-0.2, 0, 0);
        });
      }

      // ── 10. SHOULDER PRESS / OVERHEAD PRESS ──
      else if (anim === 'shoulder_press') {
        const press = easeWave; // 0 = at shoulders, 1 = locked overhead
        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`shoulder_${s}`].rotation.set(
            -(0.4 + press * 2.2),
            sign * 0.2,
            sign * (0.8 - press * 0.45)
          );
          j[`elbow_${s}`].rotation.set((1 - press) * 1.6, 0, 0);
          j[`hand_${s}`].rotation.set(0.2, 0, 0);
        });
      }

      // ── 11. DEADLIFT / ROMANIAN DEADLIFT ──
      else if (anim === 'deadlift') {
        const hinge = easeWave;
        j.hips.position.y = 0.95 - hinge * 0.25;
        j.hips.position.z = -hinge * 0.35;
        j.spine.rotation.x = hinge * 1.1; // deep neutral hip hinge

        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`thigh_${s}`].rotation.x = -hinge * 1.1;
          j[`knee_${s}`].rotation.x = hinge * 0.6; // soft athletic knees
          j[`shoulder_${s}`].rotation.set(-hinge * 0.65, 0, sign * 0.3); // arms hang straight down
          j[`elbow_${s}`].rotation.set(0.05, 0, 0);
          j[`hand_${s}`].rotation.set(0.2, 0, 0);
        });
      }

      // ── 12. LUNGE ──
      else if (anim === 'lunge') {
        const drop = easeWave * 0.35;
        j.hips.position.y = 0.95 - drop;
        j.thigh_left.rotation.x = -easeWave * 1.45; // front knee 90°
        j.knee_left.rotation.x = easeWave * 1.45;
        j.thigh_right.rotation.x = easeWave * 0.6;  // rear knee dropping
        j.knee_right.rotation.x = easeWave * 1.5;

        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`shoulder_${s}`].rotation.set(0, 0, sign * 0.25);
        });
      }

      // ── 13. PULL-UP ──
      else if (anim === 'pull_up') {
        const pull = easeWave * 0.45;
        j.hips.position.y = 1.15 + pull;
        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`shoulder_${s}`].rotation.set(
            -(2.7 - easeWave * 1.6),
            sign * 0.2,
            sign * (0.9 - easeWave * 0.3)
          );
          j[`elbow_${s}`].rotation.set(easeWave * 2.1, 0, 0);
          j[`thigh_${s}`].rotation.x = -0.3; // crossed knees
          j[`knee_${s}`].rotation.x = 0.7;
        });
      }

      // ── 14. PLANK ──
      else if (anim === 'plank') {
        j.hips.position.set(0, 0.35, 0);
        j.hips.rotation.x = -Math.PI / 2 + 0.08;
        ['left', 'right'].forEach(s => {
          const sign = s === 'left' ? 1 : -1;
          j[`shoulder_${s}`].rotation.set(-1.57, sign * 0.1, sign * 0.2);
          j[`elbow_${s}`].rotation.set(1.57, 0, 0); // 90° forearm resting on floor
        });
      }

      // ── YOGA ASANAS (20 POSTURES) ──
      else if (anim === 'yoga_downward_dog') {
        const sway = Math.sin(t * 2 * Math.PI) * 0.02;
        j.hips.position.set(0, 0.88 + sway, 0.05);
        j.hips.rotation.x = 1.65; // inverted V apex
        j.spine.rotation.x = 0.15;
        ['left', 'right'].forEach(s => {
          j[`shoulder_${s}`].rotation.set(-2.8, 0, s === 'left' ? 0.2 : -0.2);
          j[`thigh_${s}`].rotation.set(-1.4, 0, 0);
          j[`knee_${s}`].rotation.set(0.05, 0, 0);
        });
      }

      else if (anim === 'yoga_warrior_ii') {
        j.hips.position.set(0, 0.75, 0);
        j.thigh_left.rotation.set(-1.35, 0.2, 0); // 90 deg front knee
        j.knee_left.rotation.set(1.35, 0, 0);
        j.thigh_right.rotation.set(0.2, -0.3, 0); // straight rear leg
        j.knee_right.rotation.set(0.05, 0, 0);
        j.shoulder_left.rotation.set(0, 0, 1.55);  // horizontal arms
        j.shoulder_right.rotation.set(0, 0, -1.55);
        j.head.rotation.y = 0.6; // gaze over front hand
      }

      else if (anim === 'yoga_childs_pose') {
        j.hips.position.set(0, 0.25, 0.2);
        j.thigh_left.rotation.set(-2.2, 0.3, 0);
        j.thigh_right.rotation.set(-2.2, -0.3, 0);
        j.knee_left.rotation.set(2.4, 0, 0);
        j.knee_right.rotation.set(2.4, 0, 0);
        j.spine.rotation.set(1.2, 0, 0); // folded over thighs
        j.shoulder_left.rotation.set(-2.6, 0, 0.2);
        j.shoulder_right.rotation.set(-2.6, 0, -0.2);
      }

      else if (anim === 'yoga_cobra') {
        const breath = Math.sin(t * 2 * Math.PI) * 0.08;
        j.hips.position.set(0, 0.15, 0);
        j.hips.rotation.x = -Math.PI / 2;
        j.spine.rotation.x = -0.7 - breath;
        j.shoulder_left.rotation.set(0.4, 0, 0.3);
        j.shoulder_right.rotation.set(0.4, 0, -0.3);
        j.elbow_left.rotation.set(0.6, 0, 0);
        j.elbow_right.rotation.set(0.6, 0, 0);
      }

      else if (anim === 'yoga_cat_cow') {
        j.hips.position.set(0, 0.45, 0);
        j.thigh_left.rotation.set(-1.57, 0.1, 0);
        j.thigh_right.rotation.set(-1.57, -0.1, 0);
        j.knee_left.rotation.set(1.57, 0, 0);
        j.knee_right.rotation.set(1.57, 0, 0);
        j.shoulder_left.rotation.set(-1.57, 0, 0.2);
        j.shoulder_right.rotation.set(-1.57, 0, -0.2);
        const curve = Math.sin(t * 2 * Math.PI);
        j.spine.rotation.x = curve * 0.35;
        j.head.rotation.x = -curve * 0.3;
      }

      else if (anim === 'yoga_mountain') {
        const breath = Math.sin(t * 2 * Math.PI) * 0.01;
        j.hips.position.set(0, 0.95 + breath, 0);
        j.shoulder_left.rotation.set(0, 0, 0.15);
        j.shoulder_right.rotation.set(0, 0, -0.15);
      }

      else if (anim === 'yoga_upward_dog') {
        j.hips.position.set(0, 0.35, 0);
        j.hips.rotation.x = -Math.PI / 2 + 0.4;
        j.spine.rotation.x = -0.65;
        j.shoulder_left.rotation.set(0.2, 0, 0.25);
        j.shoulder_right.rotation.set(0.2, 0, -0.25);
        j.thigh_left.rotation.x = 0.2;
        j.thigh_right.rotation.x = 0.2;
      }

      else if (anim === 'yoga_warrior_i') {
        j.hips.position.set(0, 0.75, 0);
        j.thigh_left.rotation.set(-1.35, 0.1, 0);
        j.knee_left.rotation.set(1.35, 0, 0);
        j.thigh_right.rotation.set(0.4, -0.2, 0);
        j.shoulder_left.rotation.set(-2.9, 0, 0.15);
        j.shoulder_right.rotation.set(-2.9, 0, -0.15);
      }

      else if (anim === 'yoga_triangle') {
        j.hips.position.set(0, 0.85, 0);
        j.thigh_left.rotation.z = 0.5;
        j.thigh_right.rotation.z = -0.5;
        j.spine.rotation.z = 0.85;
        j.shoulder_left.rotation.z = 1.55;
        j.shoulder_right.rotation.z = 1.55;
      }

      else if (anim === 'yoga_tree') {
        j.hips.position.set(0, 0.95, 0);
        j.thigh_right.rotation.set(-0.9, -0.8, -0.7);
        j.knee_right.rotation.set(2.2, 0, 0);
        j.shoulder_left.rotation.set(-1.2, 0, 0.6);
        j.shoulder_right.rotation.set(-1.2, 0, -0.6);
        j.elbow_left.rotation.set(1.6, 0, 0);
        j.elbow_right.rotation.set(1.6, 0, 0);
      }

      else if (anim === 'yoga_chair') {
        j.hips.position.set(0, 0.65, -0.2);
        j.thigh_left.rotation.set(-1.1, 0, 0);
        j.thigh_right.rotation.set(-1.1, 0, 0);
        j.knee_left.rotation.set(1.3, 0, 0);
        j.knee_right.rotation.set(1.3, 0, 0);
        j.spine.rotation.set(0.5, 0, 0);
        j.shoulder_left.rotation.set(-2.6, 0, 0.2);
        j.shoulder_right.rotation.set(-2.6, 0, -0.2);
      }

      else if (anim === 'yoga_bridge') {
        const bridgeLift = 0.25 + Math.sin(t * 2 * Math.PI) * 0.05;
        j.hips.position.set(0, 0.35 + bridgeLift, 0);
        j.hips.rotation.x = -Math.PI / 2 + 0.35;
        j.thigh_left.rotation.x = -0.7;
        j.thigh_right.rotation.x = -0.7;
        j.knee_left.rotation.x = 1.8;
        j.knee_right.rotation.x = 1.8;
      }

      else if (anim === 'yoga_boat') {
        j.hips.position.set(0, 0.35, 0);
        j.spine.rotation.x = 0.7;
        j.thigh_left.rotation.x = -1.1;
        j.thigh_right.rotation.x = -1.1;
        j.shoulder_left.rotation.set(-1.57, 0, 0.2);
        j.shoulder_right.rotation.set(-1.57, 0, -0.2);
      }

      else if (anim === 'yoga_seated_forward_fold') {
        j.hips.position.set(0, 0.25, 0);
        j.thigh_left.rotation.x = -1.57;
        j.thigh_right.rotation.x = -1.57;
        j.spine.rotation.x = 1.3;
        j.shoulder_left.rotation.set(-1.7, 0, 0.2);
        j.shoulder_right.rotation.set(-1.7, 0, -0.2);
      }

      else if (anim === 'yoga_butterfly') {
        j.hips.position.set(0, 0.25, 0);
        j.thigh_left.rotation.z = 1.2;
        j.thigh_right.rotation.z = -1.2;
        j.knee_left.rotation.x = 2.1;
        j.knee_right.rotation.x = 2.1;
        j.spine.rotation.x = 0.3;
      }

      else if (anim === 'yoga_low_lunge') {
        j.hips.position.set(0, 0.55, 0);
        j.thigh_left.rotation.x = -1.4;
        j.knee_left.rotation.x = 1.4;
        j.thigh_right.rotation.x = 0.6;
        j.knee_right.rotation.x = 1.6;
        j.shoulder_left.rotation.set(-2.7, 0, 0.2);
        j.shoulder_right.rotation.set(-2.7, 0, -0.2);
      }

      else if (anim === 'yoga_crescent_lunge') {
        j.hips.position.set(0, 0.70, 0);
        j.thigh_left.rotation.x = -1.35;
        j.knee_left.rotation.x = 1.35;
        j.thigh_right.rotation.x = 0.3;
        j.knee_right.rotation.x = 0.1;
        j.shoulder_left.rotation.set(-2.9, 0, 0.2);
        j.shoulder_right.rotation.set(-2.9, 0, -0.2);
      }

      else if (anim === 'yoga_side_plank') {
        j.hips.position.set(0, 0.45, 0);
        j.hips.rotation.z = 0.5;
        j.shoulder_left.rotation.z = 1.4;
        j.shoulder_right.rotation.z = -1.57;
      }

      else if (anim === 'yoga_corpse') {
        j.hips.position.set(0, 0.15, 0);
        j.hips.rotation.x = -Math.PI / 2;
        j.shoulder_left.rotation.z = 0.35;
        j.shoulder_right.rotation.z = -0.35;
      }

      // ── DYNAMIC EQUIPMENT-TO-HAND LOCKING (100% Guaranteed Physical Grip) ──
      this.mannequinRoot.updateMatrixWorld(true);

      const gripL = new THREE.Vector3();
      const gripR = new THREE.Vector3();
      if (j.grip_left) j.grip_left.getWorldPosition(gripL);
      if (j.grip_right) j.grip_right.getWorldPosition(gripR);

      // 1. Olympic Barbell: Snapped directly between left & right hand grips!
      if (eq.barbell && eq.barbell.visible) {
        const midPoint = new THREE.Vector3().addVectors(gripL, gripR).multiplyScalar(0.5);
        eq.barbell.position.copy(midPoint);

        const barDir = new THREE.Vector3().subVectors(gripR, gripL).normalize();
        if (barDir.lengthSq() > 0.001) {
          const defaultDir = new THREE.Vector3(1, 0, 0);
          const quat = new THREE.Quaternion().setFromUnitVectors(defaultDir, barDir);
          eq.barbell.quaternion.copy(quat);
        }
      }

      // 2. Hex Dumbbells: Locked directly into the left and right hand palms!
      if (eq.dumbbell_left && eq.dumbbell_left.visible && j.grip_left) {
        eq.dumbbell_left.position.copy(gripL);
        const handLRot = new THREE.Quaternion();
        j.hand_left.getWorldQuaternion(handLRot);
        eq.dumbbell_left.quaternion.copy(handLRot);
      }
      if (eq.dumbbell_right && eq.dumbbell_right.visible && j.grip_right) {
        eq.dumbbell_right.position.copy(gripR);
        const handRRot = new THREE.Quaternion();
        j.hand_right.getWorldQuaternion(handRRot);
        eq.dumbbell_right.quaternion.copy(handRRot);
      }

      // 3. Lat Pulldown Wide Bar: Snapped to hand grips
      if (eq.lat_bar && eq.lat_tower && eq.lat_tower.visible) {
        const midPoint = new THREE.Vector3().addVectors(gripL, gripR).multiplyScalar(0.5);
        eq.lat_bar.position.copy(midPoint);
      }

      // 4. Seated Cable Row Handle: Snapped to hand grips
      if (eq.row_handle && eq.cable_row && eq.cable_row.visible) {
        const midPoint = new THREE.Vector3().addVectors(gripL, gripR).multiplyScalar(0.5);
        eq.row_handle.position.copy(midPoint);
      }
    }

    /**
     * Animation Loop (60fps)
     */
    animate() {
      this.rafId = requestAnimationFrame(this.animate);

      if (this.isPlaying) {
        const delta = this.clock ? this.clock.getDelta() : 0.016;
        const cycleDuration = 3.2 / (this.playbackSpeed || 1.0);
        this.animationProgress = (this.animationProgress + (delta / cycleDuration)) % 1.0;

        const scrubber = this.container.querySelector('#slider-3d-progress');
        if (scrubber) {
          scrubber.value = Math.round(this.animationProgress * 100);
        }

        this.evaluateKinematics(this.animationProgress);
      }

      if (this.controls) {
        this.controls.update();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    handleResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width > 0 && height > 0) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    }

    /**
     * Complete Teardown & WebGL Context Disposal
     */
    destroy() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      window.removeEventListener('resize', this.onWindowResize);

      if (this.controls) {
        this.controls.dispose();
      }

      if (this.scene) {
        this.scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }

      if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
      }

      this.container.innerHTML = '';
      if (window.__active3DViewer === this) {
        window.__active3DViewer = null;
      }
    }
  }

  /**
   * Global Convenience Initializer
   */
  function initFitSync3DViewer(containerId, exercise) {
    if (window.__active3DViewer) {
      window.__active3DViewer.destroy();
    }
    const viewer = new FitSync3DViewer(containerId);
    if (exercise) {
      viewer.loadExercise(exercise);
    }
    window.__active3DViewer = viewer;
    return viewer;
  }

  window.FitSync3DViewer = FitSync3DViewer;
  window.initFitSync3DViewer = initFitSync3DViewer;

})(window);
