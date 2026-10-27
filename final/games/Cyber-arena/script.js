/**
 * ============================================================================
 * CYBER ARENA — 3D Battle Royale Shooting Game
 * Procedural Humanoid Soldiers, Cyberpunk Metropolis, Safe Zone & Tactical AI
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. GAME CONFIGURATION & STATE
  // --------------------------------------------------------------------------
  const CONFIG = {
    worldSize: 280,
    playerSpeed: 11,
    sprintMultiplier: 1.6,
    crouchMultiplier: 0.55,
    jumpForce: 13,
    gravity: 32,
    cameraHeight: 2.1,
    cameraDist: 4.2,
    cameraRightOffset: 0.85,
    adsFov: 48,
    normalFov: 75,
    weapons: [
      {
        id: 'ar',
        name: 'PLASMA ASSAULT RIFLE',
        shortName: 'PLASMA AR',
        fireMode: 'FULL AUTO',
        fireInterval: 0.11, // ~540 RPM
        damage: 22,
        headshotMult: 1.8,
        pellets: 1,
        magSize: 32,
        reserve: 160,
        reloadTime: 1.8,
        spreadHip: 0.035,
        spreadAds: 0.012,
        recoilPitch: 0.015,
        color: 0x00f3ff
      },
      {
        id: 'shotgun',
        name: 'CYBER SCATTERGUN',
        shortName: 'SCATTERGUN',
        fireMode: 'PUMP SPREAD',
        fireInterval: 0.72,
        damage: 13,
        headshotMult: 1.5,
        pellets: 8,
        magSize: 8,
        reserve: 48,
        reloadTime: 2.2,
        spreadHip: 0.075,
        spreadAds: 0.045,
        recoilPitch: 0.04,
        color: 0xff0055
      },
      {
        id: 'pistol',
        name: 'HEAVY PULSE PISTOL',
        shortName: 'PULSE PISTOL',
        fireMode: 'SEMI-AUTO',
        fireInterval: 0.22,
        damage: 34,
        headshotMult: 2.0,
        pellets: 1,
        magSize: 12,
        reserve: 72,
        reloadTime: 1.2,
        spreadHip: 0.02,
        spreadAds: 0.007,
        recoilPitch: 0.022,
        color: 0xffe600
      }
    ],
    zonePhases: [
      { duration: 120, targetRadius: 90, damagePerSec: 2 },
      { duration: 90, targetRadius: 50, damagePerSec: 5 },
      { duration: 60, targetRadius: 20, damagePerSec: 10 },
      { duration: 45, targetRadius: 4, damagePerSec: 18 }
    ],
    botNames: [
      'NEXUS-01', 'CYBER-WOLF', 'VORTEX-9', 'PHANTOM-X', 'TITAN-4',
      'GHOST-07', 'VALKYRIE-3', 'SPECTRE-8', 'RAZOR-5', 'CYBORG-12',
      'CHROME-6', 'ZERO-PULSE', 'APEX-88', 'HYDRA-2', 'AEGIS-9',
      'NIGHTFALL', 'BLADE-RUN', 'NEON-REAPER', 'SOLARIS-X', 'VIPER-3',
      'ZENITH-1', 'OMEGA-4', 'FRACTURE', 'ECHELON'
    ],
    botColors: [
      { accent: 0xff0055, name: 'Crimson' },
      { accent: 0xff9900, name: 'Amber' },
      { accent: 0xd500f9, name: 'Acid Violet' },
      { accent: 0x00ff88, name: 'Emerald' },
      { accent: 0x00e5ff, name: 'Cyan' }
    ]
  };

  const STATE = {
    mode: 'menu', // 'menu', 'playing', 'paused', 'gameover', 'victory'
    botCount: 16,
    difficulty: 'standard', // 'standard', 'hardcore'
    mouseSens: 1.2,
    audioEnabled: true,
    lastTime: performance.now(),
    matchStartTime: 0,
    damageDealt: 0,
    kills: 0,
    keys: {},
    mouse: { x: 0, y: 0, leftDown: false, rightDown: false, locked: false },
    zone: {
      phaseIndex: 0,
      phaseTimeLeft: 120,
      currentRadius: 135,
      targetRadius: 90,
      centerX: 0,
      centerZ: 0,
      targetCenterX: 0,
      targetCenterZ: 0,
      shrinkSpeed: 0
    }
  };

  // --------------------------------------------------------------------------
  // 2. PROCEDURAL SYNTHESIZER (WEB AUDIO API)
  // --------------------------------------------------------------------------
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playShoot(weaponId) {
      if (!STATE.audioEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (weaponId === 'shotgun') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        this.playNoise(0.15, 0.35);
      } else if (weaponId === 'pistol') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      } else {
        // Plasma AR
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      }
    }

    playNoise(duration, volume) {
      if (!STATE.audioEnabled || !this.ctx) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    }

    playHit(isCrit) {
      if (!STATE.audioEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isCrit ? 2600 : 1800, t);
      osc.frequency.setValueAtTime(isCrit ? 3400 : 2200, t + 0.04);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }

    playReload() {
      if (!STATE.audioEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    playJump() {
      if (!STATE.audioEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.18);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    playPickup() {
      if (!STATE.audioEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.06);
        gain.gain.setValueAtTime(0.2, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.15);
      });
    }

    playVictory() {
      if (!STATE.audioEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.12);
        gain.gain.setValueAtTime(0.3, t + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.12);
        osc.stop(t + idx * 0.12 + 0.45);
      });
    }

    playDefeat() {
      if (!STATE.audioEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.6);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    }
  }

  const audio = new SoundEngine();

  // --------------------------------------------------------------------------
  // 3. THREE.JS PROCEDURAL HUMAN SOLDIER BUILDER
  // --------------------------------------------------------------------------
  /**
   * Procedural humanoid cyber soldier with anatomically articulated joints,
   * black tactical armor, helmet with visor, backpack thrusters, and weapon.
   */
  function createCyberSoldier(isPlayer, colorTheme) {
    const group = new THREE.Group();

    const armorBlack = new THREE.MeshStandardMaterial({
      color: 0x141822,
      roughness: 0.35,
      metalness: 0.75
    });

    const armorDarkGray = new THREE.MeshStandardMaterial({
      color: 0x222a3d,
      roughness: 0.4,
      metalness: 0.6
    });

    const accentColor = isPlayer ? 0x00f3ff : colorTheme.accent;
    const secondaryColor = isPlayer ? 0xff0055 : 0xffa500;

    const neonAccent = new THREE.MeshBasicMaterial({ color: accentColor });
    const neonSecondary = new THREE.MeshBasicMaterial({ color: secondaryColor });

    const visorMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9
    });

    // Root Hierarchy Nodes
    const hips = new THREE.Group();
    group.add(hips);
    hips.position.y = 0.95;

    // Pelvis Armor (tapered cylinder)
    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.24, 10);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, armorDarkGray);
    hips.add(pelvisMesh);

    // Tactical belt & neon band
    const beltGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12);
    const beltMesh = new THREE.Mesh(beltGeo, armorBlack);
    const beltRing = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.02, 12), neonAccent);
    hips.add(beltMesh);
    hips.add(beltRing);

    // Holster pouch on hips
    const pouchGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
    const leftPouch = new THREE.Mesh(pouchGeo, armorBlack);
    leftPouch.position.set(0.25, -0.04, 0);
    const rightPouch = new THREE.Mesh(pouchGeo, armorBlack);
    rightPouch.position.set(-0.25, -0.04, 0);
    hips.add(leftPouch);
    hips.add(rightPouch);

    // Spine / Abdomen
    const spine = new THREE.Group();
    spine.position.y = 0.12;
    hips.add(spine);

    const abdomenGeo = new THREE.CylinderGeometry(0.22, 0.21, 0.2, 10);
    const abdomenMesh = new THREE.Mesh(abdomenGeo, armorBlack);
    spine.add(abdomenMesh);

    // Chest / Thorax Group
    const chest = new THREE.Group();
    chest.position.y = 0.22;
    spine.add(chest);

    // Chest Armor Plate (tapered wide breastplate)
    const chestGeo = new THREE.CylinderGeometry(0.3, 0.24, 0.32, 10);
    const chestMesh = new THREE.Mesh(chestGeo, armorDarkGray);
    chestMesh.scale.set(1.15, 1, 0.85);
    chest.add(chestMesh);

    // Glowing Chest Core Reactor
    const coreGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8);
    const coreMesh = new THREE.Mesh(coreGeo, neonAccent);
    coreMesh.rotation.x = Math.PI / 2;
    coreMesh.position.set(0, 0.05, 0.22);
    chest.add(coreMesh);

    // Chest Chevron Stripes
    const chevronGeo = new THREE.BoxGeometry(0.18, 0.02, 0.02);
    const chevronMesh = new THREE.Mesh(chevronGeo, neonSecondary);
    chevronMesh.position.set(0, -0.04, 0.22);
    chest.add(chevronMesh);

    // Backpack Thruster Unit (Jump-pack)
    const packGroup = new THREE.Group();
    packGroup.position.set(0, 0.02, -0.22);
    const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.14), armorBlack);
    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 8), armorDarkGray);
    thrusterL.position.set(-0.1, -0.16, 0);
    const thrusterR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 8), armorDarkGray);
    thrusterR.position.set(0.1, -0.16, 0);
    const thrusterGlowL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), neonAccent);
    thrusterGlowL.position.set(-0.1, -0.22, 0);
    const thrusterGlowR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), neonAccent);
    thrusterGlowR.position.set(0.1, -0.22, 0);

    packGroup.add(packBody);
    packGroup.add(thrusterL);
    packGroup.add(thrusterR);
    packGroup.add(thrusterGlowL);
    packGroup.add(thrusterGlowR);
    chest.add(packGroup);

    // Neck & Head
    const neck = new THREE.Group();
    neck.position.y = 0.2;
    chest.add(neck);

    const neckGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.1, 8);
    const neckMesh = new THREE.Mesh(neckGeo, armorBlack);
    neck.add(neckMesh);

    const head = new THREE.Group();
    head.position.y = 0.12;
    neck.add(head);

    // Futuristic Helmet (faceted dome)
    const helmetGeo = new THREE.SphereGeometry(0.16, 12, 10);
    helmetGeo.scale(0.9, 1.1, 1.05);
    const helmetMesh = new THREE.Mesh(helmetGeo, armorBlack);
    head.add(helmetMesh);

    // Angular Visor
    const visorGeo = new THREE.BoxGeometry(0.2, 0.07, 0.06);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.02, 0.15);
    head.add(visorMesh);

    // Antenna on left ear
    const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6);
    const antMesh = new THREE.Mesh(antGeo, neonAccent);
    antMesh.position.set(-0.16, 0.1, 0);
    head.add(antMesh);

    // Left Arm (Shoulder -> Elbow -> Forearm -> Hand)
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(0.32, 0.12, 0);
    chest.add(leftShoulder);

    const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), armorBlack);
    pauldronL.scale.set(1.1, 1, 1);
    leftShoulder.add(pauldronL);

    const leftUpperArm = new THREE.Group();
    leftShoulder.add(leftUpperArm);
    const bicepL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.24, 8), armorDarkGray);
    bicepL.position.y = -0.12;
    leftUpperArm.add(bicepL);

    const leftElbow = new THREE.Group();
    leftElbow.position.y = -0.24;
    leftUpperArm.add(leftElbow);

    const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.22, 8), armorBlack);
    forearmL.position.y = -0.11;
    leftElbow.add(forearmL);

    const gauntletGlowL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.02), neonAccent);
    gauntletGlowL.position.set(0.06, -0.11, 0);
    leftElbow.add(gauntletGlowL);

    const leftHand = new THREE.Group();
    leftHand.position.y = -0.22;
    leftElbow.add(leftHand);
    const handMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), armorDarkGray);
    leftHand.add(handMeshL);

    // Right Arm (Weapon Wielder)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(-0.32, 0.12, 0);
    chest.add(rightShoulder);

    const pauldronR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), armorBlack);
    rightShoulder.add(pauldronR);

    const rightUpperArm = new THREE.Group();
    rightShoulder.add(rightUpperArm);
    const bicepR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.24, 8), armorDarkGray);
    bicepR.position.y = -0.12;
    rightUpperArm.add(bicepR);

    const rightElbow = new THREE.Group();
    rightElbow.position.y = -0.24;
    rightUpperArm.add(rightElbow);

    const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.22, 8), armorBlack);
    forearmR.position.y = -0.11;
    rightElbow.add(forearmR);

    const rightHand = new THREE.Group();
    rightHand.position.y = -0.22;
    rightElbow.add(rightHand);
    const handMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), armorDarkGray);
    rightHand.add(handMeshR);

    // Weapon Attached to Right Hand
    const weaponGroup = new THREE.Group();
    rightHand.add(weaponGroup);
    weaponGroup.position.set(0, -0.05, 0.15);
    weaponGroup.rotation.x = Math.PI / 2;

    // Procedural Weapon Models
    const arModel = createWeaponModel('ar', neonAccent, armorBlack);
    const shotgunModel = createWeaponModel('shotgun', neonSecondary, armorBlack);
    const pistolModel = createWeaponModel('pistol', neonAccent, armorBlack);

    shotgunModel.visible = false;
    pistolModel.visible = false;

    weaponGroup.add(arModel);
    weaponGroup.add(shotgunModel);
    weaponGroup.add(pistolModel);

    // Muzzle Flash Light & Mesh
    const muzzleLight = new THREE.PointLight(accentColor, 0, 8);
    muzzleLight.position.set(0, 0.05, 0.55);
    weaponGroup.add(muzzleLight);

    const muzzleFlashMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    );
    muzzleFlashMesh.position.copy(muzzleLight.position);
    weaponGroup.add(muzzleFlashMesh);

    // Legs: Left Leg (Thigh -> Knee -> Calf -> Boot)
    const leftHip = new THREE.Group();
    leftHip.position.set(0.14, -0.12, 0);
    hips.add(leftHip);

    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.38, 8), armorDarkGray);
    thighL.position.y = -0.19;
    leftHip.add(thighL);

    const thighStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.02), neonAccent);
    thighStripeL.position.set(0.085, -0.19, 0);
    leftHip.add(thighStripeL);

    const leftKnee = new THREE.Group();
    leftKnee.position.y = -0.38;
    leftHip.add(leftKnee);

    const kneeCapL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.06), armorBlack);
    kneeCapL.position.set(0, 0, 0.06);
    leftKnee.add(kneeCapL);

    const calfL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.36, 8), armorBlack);
    calfL.position.y = -0.18;
    leftKnee.add(calfL);

    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.36;
    leftKnee.add(leftFoot);

    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.22), armorBlack);
    bootL.position.set(0, -0.04, 0.05);
    leftFoot.add(bootL);

    // Right Leg
    const rightHip = new THREE.Group();
    rightHip.position.set(-0.14, -0.12, 0);
    hips.add(rightHip);

    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.38, 8), armorDarkGray);
    thighR.position.y = -0.19;
    rightHip.add(thighR);

    const thighStripeR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.02), neonAccent);
    thighStripeR.position.set(-0.085, -0.19, 0);
    rightHip.add(thighStripeR);

    const rightKnee = new THREE.Group();
    rightKnee.position.y = -0.38;
    rightHip.add(rightKnee);

    const kneeCapR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.06), armorBlack);
    kneeCapR.position.set(0, 0, 0.06);
    rightKnee.add(kneeCapR);

    const calfR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.36, 8), armorBlack);
    calfR.position.y = -0.18;
    rightKnee.add(calfR);

    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.36;
    rightKnee.add(rightFoot);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.22), armorBlack);
    bootR.position.set(0, -0.04, 0.05);
    rightFoot.add(bootR);

    // Initial Combat Aiming Pose
    rightShoulder.rotation.x = -Math.PI / 3;
    rightElbow.rotation.x = -Math.PI / 6;
    leftShoulder.rotation.x = -Math.PI / 3;
    leftShoulder.rotation.y = -0.3;
    leftElbow.rotation.x = -Math.PI / 4;

    return {
      group,
      joints: {
        hips,
        spine,
        chest,
        head,
        leftShoulder,
        leftUpperArm,
        leftElbow,
        leftHand,
        rightShoulder,
        rightUpperArm,
        rightElbow,
        rightHand,
        leftHip,
        leftKnee,
        rightHip,
        rightKnee
      },
      weaponGroup,
      weaponModels: {
        ar: arModel,
        shotgun: shotgunModel,
        pistol: pistolModel
      },
      muzzleLight,
      muzzleFlashMesh
    };
  }

  function createWeaponModel(type, neonMat, metalMat) {
    const wGroup = new THREE.Group();
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111319, roughness: 0.3, metalness: 0.8 });

    if (type === 'ar') {
      // Assault Rifle Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.52), metalMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, 0.38);

      const optic = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.14), darkMat);
      optic.position.set(0, 0.08, 0);

      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.1), neonMat);
      clip.position.set(0, -0.1, 0.08);

      wGroup.add(body);
      wGroup.add(barrel);
      wGroup.add(optic);
      wGroup.add(clip);
    } else if (type === 'shotgun') {
      // Scattergun Heavy Frame
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.58), metalMat);
      const wideBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 8), darkMat);
      wideBarrel.rotation.x = Math.PI / 2;
      wideBarrel.position.set(0, 0.02, 0.42);

      const heatVent = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.2), neonMat);
      heatVent.position.set(0, 0.06, 0.18);

      wGroup.add(body);
      wGroup.add(wideBarrel);
      wGroup.add(heatVent);
    } else {
      // Pistol
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.26), metalMat);
      slide.position.set(0, 0.04, 0.08);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.12, 0.07), darkMat);
      handle.rotation.x = -0.2;
      handle.position.set(0, -0.04, 0.02);

      const glowRail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.18), neonMat);
      glowRail.position.set(0, 0.08, 0.08);

      wGroup.add(slide);
      wGroup.add(handle);
      wGroup.add(glowRail);
    }

    return wGroup;
  }

  // --------------------------------------------------------------------------
  // 4. ARENA ENVIRONMENT GENERATOR
  // --------------------------------------------------------------------------
  function createCyberArena(scene) {
    const obstacles = [];
    const size = CONFIG.worldSize;

    // Ground Plane with Cyber Grid Texture
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 1024;
    groundCanvas.height = 1024;
    const gctx = groundCanvas.getContext('2d');
    gctx.fillStyle = '#050914';
    gctx.fillRect(0, 0, 1024, 1024);

    // Neon grid roads
    gctx.strokeStyle = 'rgba(0, 243, 255, 0.18)';
    gctx.lineWidth = 4;
    for (let i = 0; i < 1024; i += 64) {
      gctx.beginPath();
      gctx.moveTo(i, 0);
      gctx.lineTo(i, 1024);
      gctx.stroke();
      gctx.beginPath();
      gctx.moveTo(0, i);
      gctx.lineTo(1024, i);
      gctx.stroke();
    }

    // Road markings & crosswalks
    gctx.strokeStyle = 'rgba(255, 0, 85, 0.28)';
    gctx.lineWidth = 8;
    gctx.strokeRect(256, 256, 512, 512);

    const groundTex = new THREE.CanvasTexture(groundCanvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(12, 12);

    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.6,
      metalness: 0.4
    });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Holographic Laser Boundary Fence
    const fenceMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const fence = new THREE.Mesh(new THREE.CylinderGeometry(size / 2, size / 2, 40, 32, 8, true), fenceMat);
    fence.position.y = 20;
    scene.add(fence);

    // Skyscrapers & Mega Towers
    const towerMatDark = new THREE.MeshStandardMaterial({ color: 0x070b18, roughness: 0.3, metalness: 0.8 });
    const towerMatAccent1 = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const towerMatAccent2 = new THREE.MeshBasicMaterial({ color: 0xff0055 });

    const buildingSpots = [
      // Outer perimeter towers
      { x: -100, z: -100, w: 26, d: 26, h: 75 },
      { x: 100, z: -100, w: 28, d: 24, h: 85 },
      { x: -100, z: 100, w: 24, d: 28, h: 68 },
      { x: 100, z: 100, w: 30, d: 30, h: 95 },
      { x: 0, z: -115, w: 34, d: 22, h: 90 },
      { x: 0, z: 115, w: 32, d: 24, h: 80 },
      { x: -115, z: 0, w: 22, d: 36, h: 105 },
      { x: 115, z: 0, w: 24, d: 34, h: 95 },

      // Mid-field tactical towers
      { x: -45, z: -55, w: 18, d: 18, h: 45 },
      { x: 50, z: -50, w: 20, d: 16, h: 50 },
      { x: -55, z: 45, w: 16, d: 22, h: 48 },
      { x: 45, z: 55, w: 22, d: 20, h: 54 },
      { x: -65, z: 0, w: 14, d: 14, h: 36 },
      { x: 65, z: 0, w: 14, d: 14, h: 38 },
      { x: 0, z: -65, w: 15, d: 15, h: 40 },
      { x: 0, z: 65, w: 15, z: 65, h: 42 }
    ];

    buildingSpots.forEach((b, idx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, b.h / 2, b.z);

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), towerMatDark);
      bGroup.add(bMesh);

      // Window neon strips
      const windowStripGeo = new THREE.BoxGeometry(b.w + 0.2, 0.8, b.d + 0.2);
      const stripeMesh = new THREE.Mesh(windowStripGeo, idx % 2 === 0 ? towerMatAccent1 : towerMatAccent2);
      stripeMesh.position.y = (b.h * 0.3) - (b.h / 2);
      bGroup.add(stripeMesh);

      const stripeMesh2 = stripeMesh.clone();
      stripeMesh2.position.y = (b.h * 0.7) - (b.h / 2);
      bGroup.add(stripeMesh2);

      scene.add(bGroup);

      // Add to collision obstacle array (AABB box)
      obstacles.push({
        minX: b.x - b.w / 2 - 0.6,
        maxX: b.x + b.w / 2 + 0.6,
        minZ: b.z - b.d / 2 - 0.6,
        maxZ: b.z + b.d / 2 + 0.6,
        height: b.h
      });
    });

    // Center Plaza Hologram Monument
    const monumentBase = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 10, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x162035, metalness: 0.9 })
    );
    monumentBase.position.y = 0.6;
    scene.add(monumentBase);

    const monumentCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(2.4, 0),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true })
    );
    monumentCore.position.y = 4.2;
    scene.add(monumentCore);
    monumentCore.userData.isRotating = true;

    // Tactical Shipping Containers & Cover Barriers
    const containerGeo = new THREE.BoxGeometry(6, 3, 2.6);
    const containerMat1 = new THREE.MeshStandardMaterial({ color: 0x1c2b4a, roughness: 0.4 });
    const containerMat2 = new THREE.MeshStandardMaterial({ color: 0x3d1428, roughness: 0.4 });

    const barrierGeo = new THREE.BoxGeometry(4, 1.4, 0.6);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x222c3d, roughness: 0.5 });

    // Seed repeatable obstacles
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + (i % 3) * 0.2;
      const radius = 22 + (i % 5) * 16;
      const ox = Math.cos(angle) * radius;
      const oz = Math.sin(angle) * radius;

      // Don't spawn inside center monument
      if (Math.abs(ox) < 10 && Math.abs(oz) < 10) continue;

      if (i % 2 === 0) {
        // Cargo Container
        const container = new THREE.Mesh(containerGeo, i % 4 === 0 ? containerMat1 : containerMat2);
        container.position.set(ox, 1.5, oz);
        container.rotation.y = angle + 0.4;
        scene.add(container);

        obstacles.push({
          minX: ox - 3.2,
          maxX: ox + 3.2,
          minZ: oz - 1.8,
          maxZ: oz + 1.8,
          height: 3
        });
      } else {
        // Low Blast Wall
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(ox, 0.7, oz);
        barrier.rotation.y = angle;
        scene.add(barrier);

        obstacles.push({
          minX: ox - 2.2,
          maxX: ox + 2.2,
          minZ: oz - 0.6,
          maxZ: oz + 0.6,
          height: 1.4
        });
      }
    }

    // Cyber Trees & Neon Pillars
    const treeTrunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4.5, 6);
    const treeLeafGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x111624 });
    const foliageMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true });

    for (let j = 0; j < 22; j++) {
      const angle = (j / 22) * Math.PI * 2;
      const dist = 35 + (j % 3) * 25;
      const tx = Math.cos(angle) * dist + (j % 4) * 3;
      const tz = Math.sin(angle) * dist - (j % 4) * 3;

      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.y = 2.25;
      const leaves = new THREE.Mesh(treeLeafGeo, foliageMat);
      leaves.position.y = 5.2;

      tree.add(trunk);
      tree.add(leaves);
      scene.add(tree);

      obstacles.push({
        minX: tx - 0.5,
        maxX: tx + 0.5,
        minZ: tz - 0.5,
        maxZ: tz + 0.5,
        height: 5.5
      });
    }

    return { obstacles, monumentCore };
  }

  // --------------------------------------------------------------------------
  // 5. LOOT CRATES & SUPPLY DROPS
  // --------------------------------------------------------------------------
  function createLootPickups(scene, count = 20) {
    const pickups = [];
    const types = ['health', 'shield', 'ammo', 'shotgun', 'ar'];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 85;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const pGroup = new THREE.Group();
      pGroup.position.set(x, 1.2, z);

      let color = 0x00ff88;
      if (type === 'shield') color = 0x00f3ff;
      if (type === 'ammo') color = 0xffe600;
      if (type === 'shotgun') color = 0xff0055;
      if (type === 'ar') color = 0x00f3ff;

      // Floating crate mesh
      const crateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.9, 0.9),
        new THREE.MeshStandardMaterial({
          color: 0x111a2e,
          roughness: 0.3,
          metalness: 0.8
        })
      );
      const edgeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.1, 0.95),
        new THREE.MeshBasicMaterial({ color })
      );

      // Light Beacon
      const light = new THREE.PointLight(color, 1.2, 6);
      light.position.y = 0.5;

      pGroup.add(crateMesh);
      pGroup.add(edgeMesh);
      pGroup.add(light);
      scene.add(pGroup);

      pickups.push({
        type,
        group: pGroup,
        x,
        z,
        baseY: 1.2,
        active: true,
        rotSpeed: 1.5 + Math.random()
      });
    }

    return pickups;
  }

  // --------------------------------------------------------------------------
  // 6. SAFE ZONE ENERGY RING (STORM)
  // --------------------------------------------------------------------------
  function createSafeZoneVisual(scene) {
    const radius = STATE.zone.currentRadius;
    const geo = new THREE.CylinderGeometry(radius, radius, 50, 48, 4, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const stormMesh = new THREE.Mesh(geo, mat);
    stormMesh.position.y = 25;
    scene.add(stormMesh);

    // Glowing boundary rim ring on the floor
    const ringGeo = new THREE.RingGeometry(radius - 0.4, radius + 0.4, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.08;
    scene.add(ringMesh);

    return { stormMesh, ringMesh };
  }

  // --------------------------------------------------------------------------
  // 7. MAIN ENGINE & GAME CONTROLLER
  // --------------------------------------------------------------------------
  class CyberArenaGame {
    constructor() {
      this.container = document.getElementById('game-container');
      this.initThree();
      this.initDomElements();
      this.initEvents();

      // World items
      this.environment = createCyberArena(this.scene);
      this.obstacles = this.environment.obstacles;
      this.pickups = createLootPickups(this.scene, 24);
      this.safeZoneVisual = createSafeZoneVisual(this.scene);

      // Combatants
      this.player = null;
      this.bots = [];
      this.bullets = [];
      this.particles = [];

      this.initPlayer();
      this.initBots(STATE.botCount);

      // Start RAF loop
      requestAnimationFrame(this.loop.bind(this));
    }

    initThree() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050814);
      this.scene.fog = new THREE.FogExp2(0x070c1e, 0.009);

      this.camera = new THREE.PerspectiveCamera(
        CONFIG.normalFov,
        window.innerWidth / window.innerHeight,
        0.1,
        600
      );
      this.camera.rotation.order = 'YXZ';

      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);

      // Atmosphere Lighting
      const ambient = new THREE.AmbientLight(0x1a233d, 1.2);
      this.scene.add(ambient);

      const moonLight = new THREE.DirectionalLight(0x6e94e8, 1.4);
      moonLight.position.set(60, 120, 50);
      moonLight.castShadow = true;
      moonLight.shadow.mapSize.width = 1024;
      moonLight.shadow.mapSize.height = 1024;
      this.scene.add(moonLight);

      // Accent Neon Lights
      const cyanBeacon = new THREE.PointLight(0x00f3ff, 2, 80);
      cyanBeacon.position.set(0, 15, 0);
      this.scene.add(cyanBeacon);
    }

    initDomElements() {
      this.ui = {
        // Overlays & Menus
        startScreen: document.getElementById('start-screen'),
        pauseScreen: document.getElementById('pause-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        victoryScreen: document.getElementById('victory-screen'),
        clickToFocus: document.getElementById('click-to-focus'),
        damageFlash: document.getElementById('damage-flash'),
        zoneOverlay: document.getElementById('zone-warning-overlay'),
        stormWarning: document.getElementById('storm-warning'),
        crosshair: document.getElementById('crosshair-container'),
        hitMarker: document.getElementById('hit-marker'),

        // HUD Elements
        healthBar: document.getElementById('health-bar-fill'),
        healthText: document.getElementById('health-value'),
        armorBar: document.getElementById('armor-bar-fill'),
        armorText: document.getElementById('armor-value'),
        systemStatus: document.getElementById('system-status'),
        ammoCurrent: document.getElementById('ammo-current'),
        ammoReserve: document.getElementById('ammo-reserve'),
        weaponName: document.getElementById('active-weapon-name'),
        fireMode: document.getElementById('active-fire-mode'),
        reloadIndicator: document.getElementById('reload-indicator'),
        reloadText: document.getElementById('reload-text'),
        aliveCount: document.getElementById('hud-alive-count'),
        killCount: document.getElementById('hud-kill-count'),
        zoneTimer: document.getElementById('zone-timer-text'),
        zoneBadge: document.getElementById('zone-status-badge'),
        compassHeading: document.getElementById('compass-heading'),
        compassArrow: document.getElementById('compass-zone-arrow'),
        minimapCanvas: document.getElementById('minimap-canvas'),
        killFeed: document.getElementById('kill-feed'),
        interactionPrompt: document.getElementById('interaction-prompt'),
        promptText: document.getElementById('prompt-text'),

        // Weapon Slots
        slots: [
          document.getElementById('slot-1'),
          document.getElementById('slot-2'),
          document.getElementById('slot-3')
        ],

        // End Screens Stats
        endPlacement: document.getElementById('end-placement'),
        endKills: document.getElementById('end-kills'),
        endDamage: document.getElementById('end-damage'),
        endTime: document.getElementById('end-time'),
        vicKills: document.getElementById('vic-kills'),
        vicDamage: document.getElementById('vic-damage'),
        vicTime: document.getElementById('vic-time')
      };

      this.minimapCtx = this.ui.minimapCanvas.getContext('2d');
    }

    initPlayer() {
      const soldier = createCyberSoldier(true, { accent: 0x00f3ff, name: 'Cyan' });
      this.scene.add(soldier.group);

      this.player = {
        soldier,
        group: soldier.group,
        position: new THREE.Vector3(0, 0, 40),
        velocity: new THREE.Vector3(0, 0, 0),
        yaw: 0,
        pitch: 0,
        health: 100,
        armor: 100,
        isGrounded: true,
        isSprinting: false,
        isCrouching: false,
        isAiming: false,
        activeWeaponIndex: 0,
        weapons: JSON.parse(JSON.stringify(CONFIG.weapons)), // independent ammo
        lastShotTime: 0,
        isReloading: false,
        reloadEndTime: 0,
        runCycle: 0,
        isAlive: true,
        recoilOffset: 0
      };

      soldier.group.position.copy(this.player.position);
    }

    initBots(count) {
      // Clean up previous bots
      this.bots.forEach(b => this.scene.remove(b.soldier.group));
      this.bots = [];

      for (let i = 0; i < count; i++) {
        const name = CONFIG.botNames[i % CONFIG.botNames.length];
        const color = CONFIG.botColors[i % CONFIG.botColors.length];
        const soldier = createCyberSoldier(false, color);
        this.scene.add(soldier.group);

        // Spawn spread out across the arena
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const dist = 35 + Math.random() * 80;
        const bx = Math.cos(angle) * dist;
        const bz = Math.sin(angle) * dist;

        soldier.group.position.set(bx, 0, bz);

        this.bots.push({
          id: i,
          name,
          color,
          soldier,
          position: soldier.group.position,
          velocity: new THREE.Vector3(),
          yaw: Math.random() * Math.PI * 2,
          pitch: 0,
          health: 100,
          armor: 100,
          isAlive: true,
          weapon: JSON.parse(JSON.stringify(CONFIG.weapons[i % 3])),
          lastShotTime: 0,
          isReloading: false,
          reloadEndTime: 0,
          state: 'roam', // 'roam', 'attack', 'retreat'
          target: null,
          targetPos: new THREE.Vector3(bx, 0, bz),
          stateTimer: Math.random() * 4,
          strafeDir: Math.random() > 0.5 ? 1 : -1,
          runCycle: Math.random() * 10
        });
      }

      this.updateAliveCountUI();
    }

    // ------------------------------------------------------------------------
    // EVENTS & INPUT
    // ------------------------------------------------------------------------
    initEvents() {
      window.addEventListener('resize', this.onResize.bind(this));

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        STATE.keys[e.code] = true;

        if (e.code === 'Escape') {
          this.togglePause();
        }

        if (STATE.mode === 'playing') {
          if (e.code === 'KeyR') this.reloadActiveWeapon();
          if (e.code === 'Digit1') this.switchWeapon(0);
          if (e.code === 'Digit2') this.switchWeapon(1);
          if (e.code === 'Digit3') this.switchWeapon(2);
          if (e.code === 'KeyE') this.checkPickupInteraction();
        }
      });

      window.addEventListener('keyup', (e) => {
        STATE.keys[e.code] = false;
      });

      // Mouse Controls & Pointer Lock
      window.addEventListener('mousedown', (e) => {
        if (STATE.mode !== 'playing') return;
        audio.init();

        if (e.button === 0) {
          STATE.mouse.leftDown = true;
          if (!STATE.mouse.locked) {
            this.requestLock();
          }
        } else if (e.button === 2) {
          STATE.mouse.rightDown = true;
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) STATE.mouse.leftDown = false;
        if (e.button === 2) STATE.mouse.rightDown = false;
      });

      window.addEventListener('contextmenu', (e) => e.preventDefault());

      window.addEventListener('mousemove', (e) => {
        if (!STATE.mouse.locked || STATE.mode !== 'playing') return;
        const sens = STATE.mouseSens * 0.0022;
        this.player.yaw -= e.movementX * sens;
        this.player.pitch -= e.movementY * sens;
        // Clamp pitch to prevent camera flip
        this.player.pitch = Math.max(-1.1, Math.min(1.1, this.player.pitch));
      });

      document.addEventListener('pointerlockchange', () => {
        STATE.mouse.locked = document.pointerLockElement === this.container;
        if (!STATE.mouse.locked && STATE.mode === 'playing') {
          this.ui.clickToFocus.style.display = 'block';
        } else {
          this.ui.clickToFocus.style.display = 'none';
        }
      });

      // UI Button Bindings
      document.getElementById('btn-start').addEventListener('click', () => {
        audio.init();
        this.startMatch();
      });

      document.getElementById('btn-resume').addEventListener('click', () => {
        this.togglePause();
      });

      document.getElementById('btn-pause-restart').addEventListener('click', () => {
        this.restartMatch();
      });

      document.getElementById('btn-restart-gameover').addEventListener('click', () => {
        this.restartMatch();
      });

      document.getElementById('btn-restart-victory').addEventListener('click', () => {
        this.restartMatch();
      });

      // Bot Count Buttons
      const botBtns = document.querySelectorAll('#bot-count-selector button');
      botBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          botBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          STATE.botCount = parseInt(btn.dataset.bots, 10);
        });
      });

      // Difficulty Selector
      const diffBtns = document.querySelectorAll('#difficulty-selector button');
      diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          diffBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          STATE.difficulty = btn.dataset.diff;
        });
      });

      // Settings
      const sensSlider = document.getElementById('sensitivity-slider');
      const sensVal = document.getElementById('sensitivity-val');
      sensSlider.addEventListener('input', (e) => {
        STATE.mouseSens = parseFloat(e.target.value);
        sensVal.textContent = STATE.mouseSens.toFixed(1);
      });

      const audioBtn = document.getElementById('btn-toggle-audio');
      audioBtn.addEventListener('click', () => {
        STATE.audioEnabled = !STATE.audioEnabled;
        audioBtn.textContent = STATE.audioEnabled ? 'ENABLED' : 'MUTED';
        audioBtn.classList.toggle('active', STATE.audioEnabled);
      });

      // Weapon Slot Clicks
      this.ui.slots.forEach((slot, idx) => {
        slot.addEventListener('click', () => this.switchWeapon(idx));
      });
    }

    requestLock() {
      this.container.requestPointerLock = this.container.requestPointerLock || this.container.mozRequestPointerLock;
      if (this.container.requestPointerLock) {
        this.container.requestPointerLock();
      }
    }

    onResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ------------------------------------------------------------------------
    // MATCH LIFECYCLE
    // ------------------------------------------------------------------------
    startMatch() {
      STATE.mode = 'playing';
      STATE.matchStartTime = performance.now();
      STATE.damageDealt = 0;
      STATE.kills = 0;

      // Reset Zone
      STATE.zone.phaseIndex = 0;
      STATE.zone.currentRadius = 135;
      STATE.zone.phaseTimeLeft = CONFIG.zonePhases[0].duration;
      STATE.zone.targetRadius = CONFIG.zonePhases[0].targetRadius;
      STATE.zone.centerX = 0;
      STATE.zone.centerZ = 0;
      STATE.zone.targetCenterX = (Math.random() - 0.5) * 30;
      STATE.zone.targetCenterZ = (Math.random() - 0.5) * 30;

      this.ui.startScreen.classList.remove('active');
      this.ui.pauseScreen.classList.remove('active');
      this.ui.gameOverScreen.classList.remove('active');
      this.ui.victoryScreen.classList.remove('active');

      this.initPlayer();
      this.initBots(STATE.botCount);
      this.updateHUD();
      this.requestLock();
      this.addKillFeed('CYBER ARENA', 'MISSION PROTOCOL INITIATED');
    }

    restartMatch() {
      this.startMatch();
    }

    togglePause() {
      if (STATE.mode === 'playing') {
        STATE.mode = 'paused';
        document.exitPointerLock();
        this.ui.pauseScreen.classList.add('active');
      } else if (STATE.mode === 'paused') {
        STATE.mode = 'playing';
        this.ui.pauseScreen.classList.remove('active');
        this.requestLock();
      }
    }

    onGameOver() {
      STATE.mode = 'gameover';
      document.exitPointerLock();
      audio.playDefeat();

      const timeSurvived = Math.floor((performance.now() - STATE.matchStartTime) / 1000);
      const mins = String(Math.floor(timeSurvived / 60)).padStart(2, '0');
      const secs = String(timeSurvived % 60).padStart(2, '0');
      const rank = this.bots.filter(b => b.isAlive).length + 1;

      this.ui.endPlacement.textContent = `#${rank}`;
      this.ui.endKills.textContent = STATE.kills;
      this.ui.endDamage.textContent = Math.round(STATE.damageDealt);
      this.ui.endTime.textContent = `${mins}:${secs}`;

      setTimeout(() => {
        this.ui.gameOverScreen.classList.add('active');
      }, 700);
    }

    onVictory() {
      STATE.mode = 'victory';
      document.exitPointerLock();
      audio.playVictory();

      const timeSurvived = Math.floor((performance.now() - STATE.matchStartTime) / 1000);
      const mins = String(Math.floor(timeSurvived / 60)).padStart(2, '0');
      const secs = String(timeSurvived % 60).padStart(2, '0');

      this.ui.vicKills.textContent = STATE.kills;
      this.ui.vicDamage.textContent = Math.round(STATE.damageDealt);
      this.ui.vicTime.textContent = `${mins}:${secs}`;

      setTimeout(() => {
        this.ui.victoryScreen.classList.add('active');
      }, 800);
    }

    // ------------------------------------------------------------------------
    // MAIN GAME LOOP (ANIMATION FRAME)
    // ------------------------------------------------------------------------
    loop(timestamp) {
      requestAnimationFrame(this.loop.bind(this));

      const delta = Math.min((timestamp - STATE.lastTime) / 1000, 0.1);
      STATE.lastTime = timestamp;

      // Rotate central monument hologram
      if (this.environment.monumentCore) {
        this.environment.monumentCore.rotation.y += delta * 0.8;
        this.environment.monumentCore.rotation.x += delta * 0.4;
      }

      if (STATE.mode === 'playing') {
        this.updateSafeZone(delta);
        this.updatePlayer(delta);
        this.updateBots(delta);
        this.updateBullets(delta);
        this.updatePickups(delta);
        this.updateParticles(delta);
        this.updateMinimap();
      }

      this.updateCamera(delta);
      this.renderer.render(this.scene, this.camera);
    }

    // ------------------------------------------------------------------------
    // PLAYER CONTROLS & ANIMATION
    // ------------------------------------------------------------------------
    updatePlayer(delta) {
      if (!this.player.isAlive) return;

      const p = this.player;
      p.isAiming = STATE.mouse.rightDown;
      p.isSprinting = STATE.keys['ShiftLeft'] || STATE.keys['ShiftRight'];
      p.isCrouching = STATE.keys['KeyC'];

      // Speed calculation
      let speed = CONFIG.playerSpeed;
      if (p.isSprinting && !p.isCrouching && !p.isAiming) speed *= CONFIG.sprintMultiplier;
      if (p.isCrouching) speed *= CONFIG.crouchMultiplier;
      if (p.isAiming) speed *= 0.65;

      // WASD Input Vector
      const moveVec = new THREE.Vector3();
      if (STATE.keys['KeyW']) moveVec.z -= 1;
      if (STATE.keys['KeyS']) moveVec.z += 1;
      if (STATE.keys['KeyA']) moveVec.x -= 1;
      if (STATE.keys['KeyD']) moveVec.x += 1;

      const isMoving = moveVec.lengthSq() > 0.01;
      if (isMoving) {
        moveVec.normalize();
        // Rotate move vector with camera yaw
        moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);

        p.velocity.x = moveVec.x * speed;
        p.velocity.z = moveVec.z * speed;
        p.runCycle += delta * (p.isSprinting ? 14 : 9);
      } else {
        p.velocity.x = 0;
        p.velocity.z = 0;
      }

      // Jump
      if (STATE.keys['Space'] && p.isGrounded) {
        p.velocity.y = CONFIG.jumpForce;
        p.isGrounded = false;
        audio.playJump();
      }

      // Gravity & Vertical Movement
      p.velocity.y -= CONFIG.gravity * delta;
      p.position.y += p.velocity.y * delta;

      // Ground Collision
      const baseHeight = p.isCrouching ? 0.35 : 0;
      if (p.position.y <= baseHeight) {
        p.position.y = baseHeight;
        p.velocity.y = 0;
        p.isGrounded = true;
      }

      // Horizontal Movement with AABB Wall Collisions
      const nextX = p.position.x + p.velocity.x * delta;
      const nextZ = p.position.z + p.velocity.z * delta;

      if (!this.checkCollision(nextX, p.position.z, 0.4)) {
        p.position.x = nextX;
      }
      if (!this.checkCollision(p.position.x, nextZ, 0.4)) {
        p.position.z = nextZ;
      }

      // World Boundary Clamp
      const bound = CONFIG.worldSize / 2 - 2;
      p.position.x = Math.max(-bound, Math.min(bound, p.position.x));
      p.position.z = Math.max(-bound, Math.min(bound, p.position.z));

      // Synchronize 3D Mesh
      p.group.position.copy(p.position);
      p.group.rotation.y = p.yaw;

      // Animate Articulated Humanoid Skeleton
      this.animateHumanoidJoints(p.soldier, isMoving, p.runCycle, p.isGrounded, p.isCrouching, p.pitch, p.recoilOffset);

      // Weapon Recoil recovery
      if (p.recoilOffset > 0) {
        p.recoilOffset = Math.max(0, p.recoilOffset - delta * 0.15);
      }

      // Shooting
      if (STATE.mouse.leftDown && !p.isReloading) {
        this.triggerPlayerShoot();
      }

      // Reloading Progress
      if (p.isReloading && performance.now() >= p.reloadEndTime) {
        this.finishReload(p);
      }

      // Check Proximity to Supply Drops
      this.checkNearbyPickups();
    }

    animateHumanoidJoints(soldier, isMoving, cycle, isGrounded, isCrouching, pitch, recoil) {
      const j = soldier.joints;

      // Spine & Torso Aim Pitch + Recoil
      j.chest.rotation.x = pitch + recoil;
      j.head.rotation.x = pitch * 0.4;

      // Crouch adjustment
      j.hips.position.y = isCrouching ? 0.65 : 0.95;

      if (!isGrounded) {
        // Jumping / Airborne pose
        j.leftHip.rotation.x = -0.4;
        j.rightHip.rotation.x = -0.4;
        j.leftKnee.rotation.x = 0.6;
        j.rightKnee.rotation.x = 0.6;
      } else if (isMoving) {
        // Smooth Running / Walking Sinusoidal Gait
        const legSwing = Math.sin(cycle) * 0.65;
        j.leftHip.rotation.x = legSwing;
        j.rightHip.rotation.x = -legSwing;

        // Knee flexion on back swing
        j.leftKnee.rotation.x = Math.max(0, -Math.sin(cycle) * 0.8);
        j.rightKnee.rotation.x = Math.max(0, Math.sin(cycle) * 0.8);

        // Counter arm swing
        j.leftShoulder.rotation.x = -Math.PI / 3 - legSwing * 0.3;
      } else {
        // Idle breathing
        const breath = Math.sin(performance.now() * 0.003) * 0.03;
        j.chest.rotation.z = breath;
        j.leftHip.rotation.x = 0;
        j.rightHip.rotation.x = 0;
        j.leftKnee.rotation.x = 0;
        j.rightKnee.rotation.x = 0;
        j.leftShoulder.rotation.x = -Math.PI / 3;
      }
    }

    // ------------------------------------------------------------------------
    // THIRD-PERSON CAMERA CONTROLS
    // ------------------------------------------------------------------------
    updateCamera(delta) {
      if (!this.player) return;

      const p = this.player;
      const targetFov = p.isAiming ? CONFIG.adsFov : CONFIG.normalFov;
      this.camera.fov += (targetFov - this.camera.fov) * delta * 12;
      this.camera.updateProjectionMatrix();

      // Camera Offset relative to player heading
      const camDist = p.isAiming ? 2.6 : CONFIG.cameraDist;
      const camHeight = (p.isCrouching ? 1.4 : CONFIG.cameraHeight);
      const camRight = p.isAiming ? 0.6 : CONFIG.cameraRightOffset;

      const offset = new THREE.Vector3(camRight, camHeight, camDist);
      offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), p.pitch);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);

      const desiredCamPos = p.position.clone().add(offset);

      // Smooth camera position
      this.camera.position.lerp(desiredCamPos, delta * 18);

      // Look at target ahead of the player's crosshair
      const lookDist = 50;
      const lookTarget = p.position.clone().add(new THREE.Vector3(0, camHeight * 0.8, 0));
      const lookDir = new THREE.Vector3(0, 0, -lookDist);
      lookDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), p.pitch);
      lookDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw);
      lookTarget.add(lookDir);

      this.camera.lookAt(lookTarget);

      // Update Compass Heading UI
      const deg = Math.round(((-p.yaw * 180 / Math.PI) % 360 + 360) % 360);
      this.ui.compassHeading.textContent = `${String(deg).padStart(3, '0')}°`;

      // Update Safe Zone Pointer Arrow in Compass
      const toZoneX = STATE.zone.centerX - p.position.x;
      const toZoneZ = STATE.zone.centerZ - p.position.z;
      const zoneAngle = Math.atan2(toZoneX, toZoneZ);
      const relativeAngle = zoneAngle - p.yaw;
      this.ui.compassArrow.style.transform = `rotate(${relativeAngle}rad)`;
    }

    // ------------------------------------------------------------------------
    // SHOOTING & WEAPONS SYSTEM
    // ------------------------------------------------------------------------
    triggerPlayerShoot() {
      const p = this.player;
      const weapon = p.weapons[p.activeWeaponIndex];
      const now = performance.now();

      if (now - p.lastShotTime < weapon.fireInterval * 1000) return;

      if (weapon.magSize <= 0) {
        this.reloadActiveWeapon();
        return;
      }

      // Deduct Ammo
      weapon.magSize--;
      p.lastShotTime = now;
      p.recoilOffset = weapon.recoilPitch;

      // Sound & Muzzle Flash
      audio.playShoot(weapon.id);
      this.flashMuzzle(p.soldier);

      // Camera Aim Direction Raycast
      const spread = p.isAiming ? weapon.spreadAds : weapon.spreadHip;
      const origin = this.camera.position.clone();

      for (let i = 0; i < weapon.pellets; i++) {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), p.pitch + (Math.random() - 0.5) * spread);
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw + (Math.random() - 0.5) * spread);
        dir.normalize();

        this.fireRaycastBullet(origin, dir, weapon, true);
      }

      this.updateHUD();
    }

    fireRaycastBullet(origin, dir, weapon, isFromPlayer) {
      const maxDist = 200;
      let hitDist = maxDist;
      let hitTarget = null;
      let isHeadshot = false;

      // Check Hits against Enemy Bots
      if (isFromPlayer) {
        this.bots.forEach(bot => {
          if (!bot.isAlive) return;
          const hit = this.rayIntersectSphere(origin, dir, bot.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0.85);
          if (hit && hit < hitDist) {
            hitDist = hit;
            hitTarget = bot;
            // Check Headshot height
            const hitPoint = origin.clone().add(dir.clone().multiplyScalar(hit));
            isHeadshot = hitPoint.y > bot.position.y + 1.45;
          }
        });
      } else {
        // Bot shooting at player
        const hit = this.rayIntersectSphere(origin, dir, this.player.position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0.85);
        if (hit && hit < hitDist) {
          hitDist = hit;
          hitTarget = this.player;
          const hitPoint = origin.clone().add(dir.clone().multiplyScalar(hit));
          isHeadshot = hitPoint.y > this.player.position.y + 1.45;
        }
      }

      // Check Obstacle Raycast
      const wallHit = this.rayIntersectObstacles(origin, dir, hitDist);
      if (wallHit && wallHit < hitDist) {
        hitDist = wallHit;
        hitTarget = null; // Wall blocked shot
      }

      const endPoint = origin.clone().add(dir.clone().multiplyScalar(hitDist));

      // Bullet Plasma Tracer
      this.spawnBulletTracer(origin, endPoint, weapon.color);

      // Process Damage if Entity Hit
      if (hitTarget) {
        let dmg = weapon.damage;
        if (isHeadshot) dmg *= weapon.headshotMult;

        this.applyDamage(hitTarget, dmg, isFromPlayer, isHeadshot);
        this.spawnBloodSparks(endPoint, isFromPlayer ? 0xff0055 : 0x00f3ff);
      } else {
        // Wall spark
        this.spawnWallSparks(endPoint);
      }
    }

    rayIntersectSphere(origin, dir, center, radius) {
      const m = origin.clone().sub(center);
      const b = m.dot(dir);
      const c = m.dot(m) - radius * radius;
      if (c > 0 && b > 0) return null;
      const discr = b * b - c;
      if (discr < 0) return null;
      let t = -b - Math.sqrt(discr);
      if (t < 0) t = -b + Math.sqrt(discr);
      return t > 0 ? t : null;
    }

    rayIntersectObstacles(origin, dir, maxDist) {
      let closest = maxDist;
      this.obstacles.forEach(obs => {
        // Simplified bounding box ray test
        const min = new THREE.Vector3(obs.minX, 0, obs.minZ);
        const max = new THREE.Vector3(obs.maxX, obs.height, obs.maxZ);
        const t = this.rayAABB(origin, dir, min, max);
        if (t && t > 0 && t < closest) closest = t;
      });
      return closest < maxDist ? closest : null;
    }

    rayAABB(orig, dir, min, max) {
      let tmin = (min.x - orig.x) / (dir.x || 0.00001);
      let tmax = (max.x - orig.x) / (dir.x || 0.00001);
      if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

      let tymin = (min.y - orig.y) / (dir.y || 0.00001);
      let tymax = (max.y - orig.y) / (dir.y || 0.00001);
      if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

      if (tmin > tymax || tymin > tmax) return null;
      if (tymin > tmin) tmin = tymin;
      if (tymax < tmax) tmax = tymax;

      let tzmin = (min.z - orig.z) / (dir.z || 0.00001);
      let tzmax = (max.z - orig.z) / (dir.z || 0.00001);
      if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

      if (tmin > tzmax || tzmin > tmax) return null;
      if (tzmin > tmin) tmin = tzmin;

      return tmin;
    }

    applyDamage(target, damage, fromPlayer, isCrit) {
      // Shield absorbs 70% of damage
      const shieldDmg = Math.min(target.armor, damage * 0.7);
      target.armor -= shieldDmg;
      const remainingDmg = damage - shieldDmg;
      target.health -= remainingDmg;

      if (fromPlayer) {
        STATE.damageDealt += damage;
        audio.playHit(isCrit);
        this.flashHitMarker(isCrit);
      } else if (target === this.player) {
        this.flashDamageScreen();
        this.updateHUD();
      }

      if (target.health <= 0) {
        target.health = 0;
        this.eliminateEntity(target, fromPlayer);
      }
    }

    eliminateEntity(entity, byPlayer) {
      entity.isAlive = false;

      // Play death fall animation & sparks
      entity.soldier.joints.hips.rotation.x = -Math.PI / 2;
      entity.soldier.group.position.y = 0.2;
      this.spawnBloodSparks(entity.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff0055, 30);

      if (entity === this.player) {
        this.addKillFeed('ELIMINATED', 'YOU WERE TAKEN DOWN');
        this.onGameOver();
      } else {
        const victimName = entity.name;
        if (byPlayer) {
          STATE.kills++;
          this.addKillFeed('YOU', `ELIMINATED ${victimName}`, true);
        } else {
          this.addKillFeed('ARENA BOT', `ELIMINATED ${victimName}`);
        }

        // Spawn Loot Drop from defeated bot
        this.spawnDropLoot(entity.position.x, entity.position.z);

        this.updateAliveCountUI();

        // Check Victory
        const aliveBots = this.bots.filter(b => b.isAlive);
        if (aliveBots.length === 0 && this.player.isAlive) {
          this.onVictory();
        }
      }
    }

    spawnDropLoot(x, z) {
      const pGroup = new THREE.Group();
      pGroup.position.set(x, 1.2, z);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x00f3ff, roughness: 0.3 })
      );
      const light = new THREE.PointLight(0x00f3ff, 1.5, 6);
      pGroup.add(mesh);
      pGroup.add(light);
      this.scene.add(pGroup);

      this.pickups.push({
        type: 'shield',
        group: pGroup,
        x,
        z,
        baseY: 1.2,
        active: true,
        rotSpeed: 2
      });
    }

    flashMuzzle(soldier) {
      soldier.muzzleLight.intensity = 3;
      soldier.muzzleFlashMesh.material.opacity = 0.9;
      setTimeout(() => {
        soldier.muzzleLight.intensity = 0;
        soldier.muzzleFlashMesh.material.opacity = 0;
      }, 40);
    }

    flashHitMarker(isCrit) {
      this.ui.hitMarker.classList.add('active');
      if (isCrit) this.ui.hitMarker.classList.add('crit');
      setTimeout(() => {
        this.ui.hitMarker.classList.remove('active', 'crit');
      }, 90);
    }

    flashDamageScreen() {
      this.ui.damageFlash.style.opacity = '0.9';
      setTimeout(() => {
        this.ui.damageFlash.style.opacity = '0';
      }, 200);
    }

    reloadActiveWeapon() {
      const p = this.player;
      const w = p.weapons[p.activeWeaponIndex];
      const maxMag = CONFIG.weapons[p.activeWeaponIndex].magSize;

      if (p.isReloading || w.magSize >= maxMag || w.reserve <= 0) return;

      p.isReloading = true;
      p.reloadEndTime = performance.now() + w.reloadTime * 1000;
      audio.playReload();

      this.ui.reloadIndicator.classList.add('reloading');
      this.ui.reloadText.textContent = 'RELOADING...';
    }

    finishReload(p) {
      const w = p.weapons[p.activeWeaponIndex];
      const maxMag = CONFIG.weapons[p.activeWeaponIndex].magSize;
      const needed = maxMag - w.magSize;
      const amount = Math.min(needed, w.reserve);

      w.magSize += amount;
      w.reserve -= amount;
      p.isReloading = false;

      this.ui.reloadIndicator.classList.remove('reloading');
      this.ui.reloadText.textContent = 'READY';
      this.updateHUD();
    }

    switchWeapon(index) {
      const p = this.player;
      if (index === p.activeWeaponIndex || p.isReloading) return;

      p.activeWeaponIndex = index;
      const wId = p.weapons[index].id;

      // Show selected 3D weapon model
      Object.keys(p.soldier.weaponModels).forEach(key => {
        p.soldier.weaponModels[key].visible = key === wId;
      });

      // Update UI slots
      this.ui.slots.forEach((s, idx) => s.classList.toggle('active', idx === index));
      this.updateHUD();
    }

    // ------------------------------------------------------------------------
    // ENEMY BOTS AI SYSTEM
    // ------------------------------------------------------------------------
    updateBots(delta) {
      const p = this.player;
      const zone = STATE.zone;
      const isHardcore = STATE.difficulty === 'hardcore';

      this.bots.forEach(bot => {
        if (!bot.isAlive) return;

        bot.stateTimer -= delta;
        bot.runCycle += delta * 8;

        // Check if outside safe zone: priority is retreating to zone center!
        const distFromZoneCenter = Math.hypot(bot.position.x - zone.centerX, bot.position.z - zone.centerZ);
        const isOutsideZone = distFromZoneCenter > zone.currentRadius - 5;

        if (isOutsideZone) {
          bot.state = 'retreat';
          bot.targetPos.set(zone.centerX, 0, zone.centerZ);
        } else if (bot.stateTimer <= 0) {
          // Switch AI Behavior State
          bot.stateTimer = 2.5 + Math.random() * 3;
          const distToPlayer = bot.position.distanceTo(p.position);

          if (distToPlayer < 45 && p.isAlive) {
            bot.state = 'attack';
            bot.target = p;
          } else {
            bot.state = 'roam';
            // Pick a random waypoint
            const rAngle = Math.random() * Math.PI * 2;
            const rDist = Math.random() * (zone.currentRadius * 0.8);
            bot.targetPos.set(
              zone.centerX + Math.cos(rAngle) * rDist,
              0,
              zone.centerZ + Math.sin(rAngle) * rDist
            );
          }
        }

        // State Action Execution
        const moveDir = new THREE.Vector3();

        if (bot.state === 'attack' && bot.target && bot.target.isAlive) {
          // Face the target
          const toTarget = bot.target.position.clone().sub(bot.position);
          toTarget.y = 0;
          const dist = toTarget.length();
          toTarget.normalize();

          bot.yaw = Math.atan2(toTarget.x, toTarget.z);

          // Strafe left/right while maintaining range
          const strafe = new THREE.Vector3(-toTarget.z, 0, toTarget.x).multiplyScalar(bot.strafeDir);
          if (dist > 18) moveDir.add(toTarget);
          if (dist < 10) moveDir.sub(toTarget);
          moveDir.add(strafe.multiplyScalar(0.7));

          // Aim & Fire at Player or Enemy
          this.botFireWeapon(bot, delta, isHardcore);
        } else {
          // Navigate towards targetPos
          const toPos = bot.targetPos.clone().sub(bot.position);
          toPos.y = 0;
          if (toPos.length() > 2) {
            toPos.normalize();
            moveDir.copy(toPos);
            bot.yaw = Math.atan2(toPos.x, toPos.z);
          }
        }

        // Apply movement & collisions
        if (moveDir.lengthSq() > 0.01) {
          moveDir.normalize();
          const speed = (bot.state === 'retreat' ? 9.5 : 6.5);
          const nextX = bot.position.x + moveDir.x * speed * delta;
          const nextZ = bot.position.z + moveDir.z * speed * delta;

          if (!this.checkCollision(nextX, bot.position.z, 0.5)) bot.position.x = nextX;
          if (!this.checkCollision(bot.position.x, nextZ, 0.5)) bot.position.z = nextZ;
        }

        // Sync 3D Mesh
        bot.soldier.group.position.copy(bot.position);
        bot.soldier.group.rotation.y = bot.yaw;

        this.animateHumanoidJoints(
          bot.soldier,
          moveDir.lengthSq() > 0.01,
          bot.runCycle,
          true,
          false,
          bot.pitch,
          0
        );

        // Safe zone damage for bot
        if (isOutsideZone) {
          const dmg = (CONFIG.zonePhases[zone.phaseIndex] || CONFIG.zonePhases[0]).damagePerSec * delta;
          bot.health -= dmg;
          if (bot.health <= 0) {
            this.eliminateEntity(bot, false);
          }
        }
      });
    }

    botFireWeapon(bot, delta, isHardcore) {
      const now = performance.now();
      const w = bot.weapon;
      if (now - bot.lastShotTime < w.fireInterval * 1000 * (isHardcore ? 1.0 : 1.4)) return;

      bot.lastShotTime = now;
      this.flashMuzzle(bot.soldier);

      // Aim at player chest with intentional AI spread
      const origin = bot.position.clone().add(new THREE.Vector3(0, 1.4, 0));
      const targetPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const dir = targetPos.sub(origin).normalize();

      const spread = isHardcore ? 0.04 : 0.08;
      dir.x += (Math.random() - 0.5) * spread;
      dir.y += (Math.random() - 0.5) * spread;
      dir.z += (Math.random() - 0.5) * spread;
      dir.normalize();

      this.fireRaycastBullet(origin, dir, w, false);
    }

    // ------------------------------------------------------------------------
    // SAFE ZONE (STORM) SYSTEM
    // ------------------------------------------------------------------------
    updateSafeZone(delta) {
      const z = STATE.zone;
      const phase = CONFIG.zonePhases[z.phaseIndex];

      if (phase) {
        z.phaseTimeLeft -= delta;

        // Shrink towards target radius and center
        if (z.phaseTimeLeft <= 0) {
          // Advance to next phase
          z.phaseIndex++;
          if (z.phaseIndex < CONFIG.zonePhases.length) {
            const nextPhase = CONFIG.zonePhases[z.phaseIndex];
            z.phaseTimeLeft = nextPhase.duration;
            z.targetRadius = nextPhase.targetRadius;
            // Shift center unpredictably
            z.centerX = z.targetCenterX;
            z.centerZ = z.targetCenterZ;
            z.targetCenterX += (Math.random() - 0.5) * 20;
            z.targetCenterZ += (Math.random() - 0.5) * 20;
            this.addKillFeed('ZONE COLLAPSE', `PHASE ${z.phaseIndex + 1} COMMENCING`);
          }
        } else {
          // Smoothly interpolate radius and center
          const progress = 1 - (z.phaseTimeLeft / phase.duration);
          z.currentRadius = THREE.MathUtils.lerp(z.currentRadius, z.targetRadius, delta * 0.08);
          z.centerX = THREE.MathUtils.lerp(z.centerX, z.targetCenterX, delta * 0.05);
          z.centerZ = THREE.MathUtils.lerp(z.centerZ, z.targetCenterZ, delta * 0.05);
        }

        // Update 3D Visual Mesh
        const rad = Math.max(2, z.currentRadius);
        this.safeZoneVisual.stormMesh.scale.set(rad / 135, 1, rad / 135);
        this.safeZoneVisual.stormMesh.position.set(z.centerX, 25, z.centerZ);

        this.safeZoneVisual.ringMesh.scale.set(rad / 135, rad / 135, 1);
        this.safeZoneVisual.ringMesh.position.set(z.centerX, 0.08, z.centerZ);

        // Check if player is outside safe zone
        const pDist = Math.hypot(this.player.position.x - z.centerX, this.player.position.z - z.centerZ);
        const isPlayerOutside = pDist > rad;

        if (isPlayerOutside) {
          const dmg = phase.damagePerSec * delta;
          this.player.health -= dmg;
          this.ui.zoneOverlay.style.opacity = '0.7';
          this.ui.stormWarning.style.display = 'block';

          if (this.player.health <= 0) {
            this.player.health = 0;
            this.eliminateEntity(this.player, false);
          }
        } else {
          this.ui.zoneOverlay.style.opacity = '0';
          this.ui.stormWarning.style.display = 'none';
        }

        // Update HUD Countdown
        const secs = Math.max(0, Math.ceil(z.phaseTimeLeft));
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        this.ui.zoneTimer.textContent = `${m}:${s}`;
      }
    }

    // ------------------------------------------------------------------------
    // PICKUPS & SUPPLY CRATES
    // ------------------------------------------------------------------------
    updatePickups(delta) {
      this.pickups.forEach(p => {
        if (!p.active) return;
        p.group.rotation.y += delta * p.rotSpeed;
        p.group.position.y = p.baseY + Math.sin(performance.now() * 0.003 + p.x) * 0.15;
      });
    }

    checkNearbyPickups() {
      let promptActive = false;
      const p = this.player;

      this.pickups.forEach(pickup => {
        if (!pickup.active) return;
        const dist = p.position.distanceTo(pickup.group.position);
        if (dist < 2.8) {
          promptActive = true;
          this.ui.promptText.textContent = `COLLECT ${pickup.type.toUpperCase()} SUPPLY`;
          this.activeNearbyPickup = pickup;
        }
      });

      this.ui.interactionPrompt.style.display = promptActive ? 'flex' : 'none';
      if (!promptActive) this.activeNearbyPickup = null;
    }

    checkPickupInteraction() {
      if (!this.activeNearbyPickup) return;
      const pickup = this.activeNearbyPickup;

      if (pickup.type === 'health') {
        this.player.health = Math.min(100, this.player.health + 50);
      } else if (pickup.type === 'shield') {
        this.player.armor = Math.min(100, this.player.armor + 50);
      } else if (pickup.type === 'ammo') {
        this.player.weapons.forEach(w => w.reserve += 60);
      } else if (pickup.type === 'shotgun') {
        this.switchWeapon(1);
      } else if (pickup.type === 'ar') {
        this.switchWeapon(0);
      }

      audio.playPickup();
      pickup.active = false;
      this.scene.remove(pickup.group);
      this.ui.interactionPrompt.style.display = 'none';
      this.updateHUD();
    }

    // ------------------------------------------------------------------------
    // BULLETS, TRACERS, & PARTICLE FX
    // ------------------------------------------------------------------------
    spawnBulletTracer(start, end, colorHex) {
      const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
      const mat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 });
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);

      this.bullets.push({
        line,
        spawnTime: performance.now(),
        life: 0.08
      });
    }

    updateBullets(delta) {
      const now = performance.now();
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (now - b.spawnTime > b.life * 1000) {
          this.scene.remove(b.line);
          this.bullets.splice(i, 1);
        }
      }
    }

    spawnBloodSparks(pos, colorHex, count = 12) {
      for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.06, 0.06),
          new THREE.MeshBasicMaterial({ color: colorHex })
        );
        p.position.copy(pos);
        this.scene.add(p);

        this.particles.push({
          mesh: p,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 6 + 1,
            (Math.random() - 0.5) * 8
          ),
          life: 0.35 + Math.random() * 0.2
        });
      }
    }

    spawnWallSparks(pos) {
      for (let i = 0; i < 6; i++) {
        const p = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.04, 0.04),
          new THREE.MeshBasicMaterial({ color: 0xffe600 })
        );
        p.position.copy(pos);
        this.scene.add(p);

        this.particles.push({
          mesh: p,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            Math.random() * 4,
            (Math.random() - 0.5) * 6
          ),
          life: 0.2
        });
      }
    }

    updateParticles(delta) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= delta;
        p.vel.y -= 18 * delta; // Gravity
        p.mesh.position.addScaledVector(p.vel, delta);

        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
      }
    }

    // ------------------------------------------------------------------------
    // COLLISION DETECTION (AABB)
    // ------------------------------------------------------------------------
    checkCollision(x, z, radius) {
      for (let i = 0; i < this.obstacles.length; i++) {
        const o = this.obstacles[i];
        if (
          x + radius > o.minX &&
          x - radius < o.maxX &&
          z + radius > o.minZ &&
          z - radius < o.maxZ
        ) {
          return true;
        }
      }
      return false;
    }

    // ------------------------------------------------------------------------
    // RADAR MINIMAP & HUD UPDATES
    // ------------------------------------------------------------------------
    updateMinimap() {
      const ctx = this.minimapCtx;
      const w = this.ui.minimapCanvas.width;
      const h = this.ui.minimapCanvas.height;
      const center = w / 2;
      const scale = w / CONFIG.worldSize;

      ctx.clearRect(0, 0, w, h);

      // Arena Boundary Circle
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center, center, (CONFIG.worldSize / 2) * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Safe Zone Circle
      const zx = center + STATE.zone.centerX * scale;
      const zz = center + STATE.zone.centerZ * scale;
      const zRad = STATE.zone.currentRadius * scale;

      ctx.strokeStyle = '#00ff88';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.05)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(zx, zz, zRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Enemy Bot Dots
      this.bots.forEach(bot => {
        if (!bot.isAlive) return;
        const bx = center + bot.position.x * scale;
        const bz = center + bot.position.z * scale;

        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(bx, bz, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player Arrow
      const px = center + this.player.position.x * scale;
      const pz = center + this.player.position.z * scale;

      ctx.save();
      ctx.translate(px, pz);
      ctx.rotate(-this.player.yaw);
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(4, 4);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    updateHUD() {
      if (!this.player) return;

      const p = this.player;
      const w = p.weapons[p.activeWeaponIndex];

      // Health & Armor bars
      const hpPercent = Math.max(0, Math.min(100, p.health));
      const armorPercent = Math.max(0, Math.min(100, p.armor));

      this.ui.healthBar.style.width = `${hpPercent}%`;
      this.ui.healthText.textContent = `${Math.round(hpPercent)} / 100`;

      this.ui.armorBar.style.width = `${armorPercent}%`;
      this.ui.armorText.textContent = `${Math.round(armorPercent)} / 100`;

      // Weapon Info
      this.ui.weaponName.textContent = w.name;
      this.ui.fireMode.textContent = w.fireMode;
      this.ui.ammoCurrent.textContent = w.magSize;
      this.ui.ammoReserve.textContent = w.reserve;

      // Status Indicator
      if (hpPercent < 30) {
        this.ui.systemStatus.textContent = 'CRITICAL ALERT // VITALS COMPROMISED';
        this.ui.systemStatus.style.color = 'var(--magenta-neon)';
      } else {
        this.ui.systemStatus.textContent = 'ARMOR INTEGRITY // OPERATIONAL';
        this.ui.systemStatus.style.color = 'var(--text-muted)';
      }
    }

    updateAliveCountUI() {
      const aliveCount = this.bots.filter(b => b.isAlive).length + (this.player.isAlive ? 1 : 0);
      this.ui.aliveCount.textContent = aliveCount;
      this.ui.killCount.textContent = STATE.kills;
    }

    addKillFeed(killer, victim, isPlayer = false) {
      const feed = this.ui.killFeed;
      const item = document.createElement('div');
      item.className = `kill-feed-item ${isPlayer ? 'player-kill' : ''}`;
      item.textContent = `${killer} ▸ ${victim}`;

      feed.prepend(item);
      setTimeout(() => {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 5000);
    }
  }

  // --------------------------------------------------------------------------
  // 8. BOOTSTRAP WHEN DOM READY
  // --------------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    // Check if Three.js is ready
    if (typeof THREE === 'undefined') {
      const msg = document.createElement('div');
      msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#00f3ff;font-family:monospace;font-size:18px;text-align:center;';
      msg.textContent = 'CYBER ARENA // Loading Three.js visual engine...';
      document.body.appendChild(msg);

      const checkInterval = setInterval(() => {
        if (typeof THREE !== 'undefined') {
          clearInterval(checkInterval);
          msg.remove();
          window.CYBER_ARENA = new CyberArenaGame();
        }
      }, 100);
    } else {
      window.CYBER_ARENA = new CyberArenaGame();
    }
  });
})();
