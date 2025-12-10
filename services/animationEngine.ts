
import * as THREE from 'three';

// --- Interfaces ---

export interface Limb {
  root: THREE.Group;    // Hip or Shoulder
  mid: THREE.Group;     // Knee or Elbow
  end: THREE.Group;     // Ankle or Wrist
  upperMeshName?: string; // Key for bodyParts
  lowerMeshName?: string;
}

export interface BodyRig {
  main: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  legs: { l: Limb; r: Limb };
  arms: { l: Limb; r: Limb };
  parts: Record<string, THREE.Mesh>;
}

export interface AnimationContext {
  time: number;       // Exercise Rep Cycle (0 -> 2PI)
  breathTime: number; // Continuous breathing cycle
  visualTag: string;
  name: string;
  guideLines: THREE.Line[];
}

export interface MaterialSet {
  skin: THREE.MeshPhysicalMaterial;
  joint: THREE.MeshPhysicalMaterial;
  highlight: THREE.MeshPhysicalMaterial;
  jointHighlight: THREE.MeshPhysicalMaterial;
  clothesTop: THREE.MeshPhysicalMaterial;
  clothesBot: THREE.MeshPhysicalMaterial;
  shoe: THREE.MeshStandardMaterial;
}

// --- Helper Functions ---

const getWorldPos = (mesh: THREE.Object3D) => {
  const v = new THREE.Vector3();
  mesh.getWorldPosition(v);
  return v;
};

/**
 * Simulates muscle contraction by scaling the mesh.
 * Uses a non-linear curve to create a "pop" effect at peak contraction.
 */
const bulgeMuscle = (rig: BodyRig, partName: string, contraction: number) => {
  const mesh = rig.parts[partName];
  if (mesh) {
    // Non-linear response: mild at low values, pops at high values
    const intensity = Math.pow(Math.max(0, contraction), 1.5); 
    
    // Bulge: Shorten (Y) and Widen (X/Z)
    const thickness = 1 + (intensity * 0.15); 
    const length = 1 - (intensity * 0.08);   
    
    mesh.scale.set(thickness, length, thickness);
  }
};

/**
 * Simulates core bracing/tension.
 * Abs flatten (Z) and widen slightly (X) under tension.
 */
const tensenCore = (rig: BodyRig, contraction: number) => {
  const abs = rig.parts['abs'];
  if (abs) {
    const intensity = Math.max(0, contraction);
    abs.scale.set(
       1 + (intensity * 0.05), // Wider (bracing)
       1 - (intensity * 0.02), // Slightly compressed vertical
       1 - (intensity * 0.10)  // Flatter (pulling in/tightening)
    );
  }
};

const applyHighlight = (
  rig: BodyRig,
  mat: THREE.MeshPhysicalMaterial,
  targetParts: string[],
  intensity: number,
  colorA: number,
  colorB: number
) => {
  if (intensity < 0.05) return;
  
  const c1 = new THREE.Color(colorA);
  const c2 = new THREE.Color(colorB);
  
  mat.emissiveIntensity = intensity;
  mat.emissive.lerpColors(c1, c2, intensity > 0.5 ? (intensity - 0.5) * 2 : 0);
  mat.opacity = 0.3 + (intensity * 0.5);

  targetParts.forEach(name => {
    const mesh = rig.parts[name];
    if (mesh) mesh.material = mat;
  });
};

const updateGuide = (line: THREE.Line, start: THREE.Vector3, end: THREE.Vector3) => {
  if (!line) return;
  line.visible = true;
  line.geometry.setFromPoints([start, end]);
  line.computeLineDistances();
};

/**
 * Calculates how "hard" the current pose is based on the exercise type and phase.
 * Returns 0.0 (Rest) to 1.0 (Max Effort).
 */
export const calculateExertion = (tag: string, time: number, name: string): number => {
  const sin = Math.sin(time);
  const absSin = Math.abs(sin);
  
  switch(tag) {
    case 'plank': 
    case 'side_plank':
      // Static holds: Exertion is consistently high, slightly pulsing with effort
      return 0.7 + (Math.sin(time * 0.8) * 0.1); 

    case 'standing':
      if (name.includes('squat') || name.includes('chair')) {
        // High exertion at bottom of squat
        return THREE.MathUtils.smoothstep(absSin, 0.2, 1.0); 
      }
      return 0.1;

    case 'glute_bridge':
       // High exertion at top of bridge (when sin > 0)
       return Math.max(0, sin); 

    case 'lunge':
       return 0.4 + (sin * 0.4); // Peak at bottom
    
    case 'all_fours':
    case 'bird_dog':
       if (name.includes('bird') || name.includes('dog')) {
         return Math.max(0, sin); // Peak extension
       }
       return 0.3;

    case 'lying_back':
       if (name.includes('deadbug') || name.includes('crunch') || name.includes('slide')) {
          return absSin;
       }
       return 0.1;

    default:
       return 0.2;
  }
};

// --- Main Engine ---

export const updateAnimationFrame = (
  rig: BodyRig,
  mats: MaterialSet,
  ctx: AnimationContext
) => {
  const { time, breathTime, visualTag, name } = ctx;
  const sinWave = Math.sin(time);
  const absSin = Math.abs(sinWave);
  
  // Calculate instantaneous exertion for secondary effects
  const exertion = calculateExertion(visualTag, time, name);
  
  // 1. Reset Rig to Neutral
  rig.main.position.set(0, 0, 0);
  rig.main.rotation.set(0, 0, 0);
  rig.pelvis.position.set(0, 1.0, 0);
  rig.pelvis.rotation.set(0, 0, 0);
  rig.spine.rotation.set(0, 0, 0);
  rig.spine.position.set(0, 0, 0);
  rig.chest.rotation.set(0, 0, 0);
  rig.chest.scale.set(1, 1, 1);
  rig.neck.rotation.set(0, 0, 0);
  rig.head.rotation.set(0, 0, 0);
  
  [rig.legs.l, rig.legs.r, rig.arms.l, rig.arms.r].forEach(limb => {
    limb.root.rotation.set(0, 0, 0);
    limb.mid.rotation.set(0, 0, 0);
    limb.end.rotation.set(0, 0, 0);
  });
  
  // Reset all scale (Critical for bulging effect to not accumulate)
  Object.values(rig.parts).forEach(part => part.scale.set(1, 1, 1));

  // Default Arms (A-Pose relaxed)
  rig.arms.l.root.rotation.z = 0.2;
  rig.arms.r.root.rotation.z = -0.2;

  // Reset Materials
  Object.keys(rig.parts).forEach(key => {
    if (key.includes('nose') || key.includes('hair')) return;
    const mesh = rig.parts[key];
    
    // Base Assignment
    if (key.includes('Joint') || key.includes('Elbow') || key.includes('Wrist') || key.includes('Knee') || key.includes('Ankle')) {
        mesh.material = mats.joint;
    } else if (key.includes('Hand') || key.includes('Forearm') || key.includes('head') || key.includes('neck')) {
        mesh.material = mats.skin;
    } else if (key.includes('Foot')) {
        mesh.material = mats.shoe;
    } else if (key.includes('Thigh') || key.includes('Shin') || key.includes('hips')) {
        mesh.material = mats.clothesBot;
    } else {
        mesh.material = mats.clothesTop;
    }
  });
  ctx.guideLines.forEach(l => l.visible = false);

  // 2. Secondary Motion: Breathing
  
  // Breathing Dynamics
  const breathFreq = 1.2 + (exertion * 2.8); // Breath faster when exertion is high
  const breathAmp = 0.02 + (exertion * 0.05); // Breath deeper when exertion is high
  
  const rawBreath = (Math.sin(breathTime * breathFreq) + 1) * 0.5;
  const breathVal = rawBreath * breathAmp;
  
  // Chest Expansion
  rig.chest.scale.set(
    1 + breathVal * 0.4, 
    1 + breathVal * 0.15, 
    1 + breathVal * 0.8
  );

  // Belly Breathing (Diaphragmatic)
  if (rig.parts['abs']) {
      const bellyScale = breathVal * 1.5;
      rig.parts['abs'].scale.set(
          1 + bellyScale * 0.2, 
          1, 
          1 + bellyScale 
      );
  }

  rig.spine.rotation.x += breathVal * 0.15; 
  
  const shoulderRise = breathVal * 0.3;
  rig.arms.l.root.position.y = 0.10 + shoulderRise;
  rig.arms.r.root.position.y = 0.10 + shoulderRise;
  
  // Material response to exertion (Simulated Sweat/Flush)
  mats.skin.clearcoat = 0.1 + (exertion * 0.5); // Shinier when working hard
  mats.skin.roughness = 0.4 - (exertion * 0.2); // Smoother/Wetter look

  // 3. Pose Logic
  const lLeg = rig.legs.l;
  const rLeg = rig.legs.r;
  const lArm = rig.arms.l;
  const rArm = rig.arms.r;
  const pelvis = rig.pelvis;
  const spine = rig.spine;

  switch (visualTag) {
    case 'seated':
       rig.main.position.y = -0.1;
       pelvis.position.y = 0.55; 
       lLeg.root.rotation.x = -1.5; lLeg.mid.rotation.x = 1.5;
       rLeg.root.rotation.x = -1.5; rLeg.mid.rotation.x = 1.5;
       lLeg.end.rotation.x = -0.1; rLeg.end.rotation.x = -0.1;

       lArm.root.rotation.x = -0.5; lArm.mid.rotation.x = 1.2;
       rArm.root.rotation.x = -0.5; rArm.mid.rotation.x = 1.2;

       if (name.includes('tilt')) {
         pelvis.rotation.x = Math.sin(time) * 0.3;
         applyHighlight(rig, mats.highlight, ['hips', 'abs'], Math.abs(Math.sin(time)), 0xf43f5e, 0xffffff);
       } 
       break;

    case 'standing':
      if (name.includes('squat') || name.includes('chair')) {
        const depth = absSin;
        pelvis.position.y = 1.0 - (depth * 0.35);
        pelvis.position.z = -(depth * 0.2); 
        pelvis.rotation.x = -depth * 0.3; 
        
        spine.rotation.x += depth * 0.4; 
        
        const hipFlex = -depth * 1.2;
        const kneeFlex = depth * 2.3;
        
        lLeg.root.rotation.x = hipFlex; rLeg.root.rotation.x = hipFlex;
        lLeg.mid.rotation.x = kneeFlex; rLeg.mid.rotation.x = kneeFlex;
        lLeg.end.rotation.x = depth * 0.8; rLeg.end.rotation.x = depth * 0.8; 

        lArm.root.rotation.x = -depth * 1.5; rArm.root.rotation.x = -depth * 1.5;

        // Visual Feedback
        applyHighlight(rig, mats.highlight, ['leftThigh', 'rightThigh', 'hips'], depth, 0xf43f5e, 0xffffff);
        
        // Dynamic Muscle Bulge
        if (depth > 0.4) {
           const effort = (depth - 0.4) * 1.5;
           bulgeMuscle(rig, 'leftThigh', effort);
           bulgeMuscle(rig, 'rightThigh', effort);
           // Engage core at bottom of squat
           tensenCore(rig, effort * 0.6);
        }

      } else if (name.includes('balance')) {
        pelvis.position.x = Math.sin(time * 0.5) * 0.05; 
        rLeg.root.rotation.x = -0.4;
        rLeg.mid.rotation.x = 1.2; 
        
        // Standing leg works hard
        bulgeMuscle(rig, 'leftThigh', 0.5);
        tensenCore(rig, 0.6);
        
        applyHighlight(rig, mats.highlight, ['leftThigh', 'leftShin', 'abs'], 0.8, 0xf43f5e, 0xffffff);
      }
      break;

    case 'lunge':
        const lungeVal = (sinWave + 1) * 0.5;
        lLeg.root.rotation.x = 0.5 + (lungeVal * 0.5); lLeg.mid.rotation.x = 0.5 + (lungeVal * 0.5);
        rLeg.root.rotation.x = -0.5 - (lungeVal * 0.5); rLeg.mid.rotation.x = 0.5 + (lungeVal * 0.8);
        pelvis.position.y = 0.9 - (lungeVal * 0.2);
        
        lArm.root.rotation.x = 0.5; lArm.mid.rotation.x = 1.0;
        rArm.root.rotation.x = -0.5; rArm.mid.rotation.x = 1.0;

        if (lungeVal > 0.5) {
             const effort = (lungeVal - 0.5) * 1.5;
             bulgeMuscle(rig, 'leftThigh', effort); // Front leg
             bulgeMuscle(rig, 'rightThigh', effort * 0.5); // Back leg stretch
             tensenCore(rig, effort * 0.4);
        }

        applyHighlight(rig, mats.highlight, ['leftThigh', 'rightThigh', 'hips'], lungeVal, 0xf43f5e, 0xffffff);
        break;

    case 'lying_back':
      rig.main.rotation.x = -Math.PI / 2;
      rig.main.position.y = 0.15;
      
      lLeg.root.rotation.x = -1.5; rLeg.root.rotation.x = -1.5;
      lLeg.mid.rotation.x = 1.8; rLeg.mid.rotation.x = 1.8;

      if (name.includes('slide') || name.includes('heel')) {
        const slide = (sinWave + 1) * 0.5;
        lLeg.mid.rotation.x = 1.8 - (slide * 1.8); 
        lLeg.root.rotation.x = -1.5 + (slide * 0.2); 
        applyHighlight(rig, mats.highlight, ['abs', 'leftThigh'], slide, 0xf43f5e, 0xffffff);
        tensenCore(rig, slide * 0.6); 
        
        if (slide > 0.3) bulgeMuscle(rig, 'leftThigh', slide * 0.3);

      } else if (name.includes('deadbug')) {
        lArm.root.rotation.x = -3.14 + (sinWave * 0.5);
        rLeg.root.rotation.x = -1.5 + (sinWave * 0.5);
        rLeg.mid.rotation.x = 1.5 - (sinWave * 0.5);
        
        tensenCore(rig, 0.9); // High core tension
        applyHighlight(rig, mats.highlight, ['abs'], 0.8, 0xf43f5e, 0xffffff);
      } else {
        const crunch = Math.max(0, sinWave);
        spine.rotation.x += crunch * 0.5;
        rig.neck.rotation.x = crunch * 0.3;
        tensenCore(rig, crunch * 1.2); // Max tension
        applyHighlight(rig, mats.highlight, ['abs'], crunch, 0xf43f5e, 0xffffff);
      }
      break;

    case 'glute_bridge':
      rig.main.rotation.x = -Math.PI / 2;
      rig.main.position.y = 0.15;
      lLeg.root.rotation.x = -0.5; rLeg.root.rotation.x = -0.5;
      lLeg.mid.rotation.x = 2.0; rLeg.mid.rotation.x = 2.0;
      
      const bridge = Math.max(0, sinWave);
      pelvis.position.y = 0.15 + (bridge * 0.3);
      pelvis.position.z = -(bridge * 0.1);
      
      lLeg.root.rotation.x = -0.5 + (bridge * 0.5);
      rLeg.root.rotation.x = -0.5 + (bridge * 0.5);
      
      if (bridge > 0.5) {
        const effort = (bridge - 0.5) * 2;
        bulgeMuscle(rig, 'leftThigh', effort);
        bulgeMuscle(rig, 'rightThigh', effort);
        tensenCore(rig, effort * 0.5);
      }

      applyHighlight(rig, mats.highlight, ['hips', 'leftThigh', 'rightThigh'], bridge, 0xf43f5e, 0xffffff);
      break;

    case 'plank':
      rig.main.rotation.x = -Math.PI / 2;
      rig.main.position.y = 0.28;
      lArm.root.rotation.x = -1.2; rArm.root.rotation.x = -1.2;
      lArm.mid.rotation.x = -1.5; rArm.mid.rotation.x = -1.5;
      
      tensenCore(rig, 1.0); // Constant max tension
      bulgeMuscle(rig, 'leftThigh', 0.6);
      bulgeMuscle(rig, 'rightThigh', 0.6);
      applyHighlight(rig, mats.highlight, ['abs', 'leftThigh', 'rightThigh'], 0.9, 0xf43f5e, 0xffffff);
      break;

    case 'all_fours':
    case 'bird_dog':
      rig.main.rotation.x = -Math.PI / 2;
      rig.main.position.y = 0.45;
      lArm.root.rotation.x = -1.57; rArm.root.rotation.x = -1.57;
      lLeg.root.rotation.x = -1.57; rLeg.root.rotation.x = -1.57;
      lLeg.mid.rotation.x = 1.57; rLeg.mid.rotation.x = 1.57;

      if (visualTag === 'bird_dog') {
        const extend = Math.max(0, sinWave);
        rArm.root.rotation.x = -1.57 + (extend * 1.57); 
        lLeg.root.rotation.x = -1.57 - (extend * 0.4); 
        lLeg.mid.rotation.x = 1.57 - (extend * 1.57); 
        
        tensenCore(rig, 0.8);
        
        if (extend > 0.4) {
           const effort = extend * 0.6;
           bulgeMuscle(rig, 'rightUpperArm', effort); // Supporting arm
           bulgeMuscle(rig, 'leftThigh', effort * 1.2); // Extended leg glute area
        }

        applyHighlight(rig, mats.highlight, ['abs', 'rightUpperArm', 'leftThigh'], extend, 0xf43f5e, 0xffffff);
      } else {
        spine.rotation.x += Math.sin(time) * 0.3; 
        applyHighlight(rig, mats.highlight, ['abs'], 0.5, 0xf43f5e, 0xffffff);
      }
      break;
      
    case 'side_plank':
        rig.main.rotation.x = -Math.PI / 2;
        rig.main.rotation.y = -Math.PI / 2;
        rig.main.position.y = 0.2;
        rArm.root.rotation.z = -1.57; rArm.mid.rotation.x = -1.57;
        const sideLift = Math.max(0, sinWave);
        pelvis.position.y = 0.2 + (sideLift * 0.2);
        
        tensenCore(rig, 0.9);
        applyHighlight(rig, mats.highlight, ['abs', 'rightUpperArm', 'hips'], sideLift, 0xf43f5e, 0xffffff);
        break;

    default:
        spine.rotation.y = Math.sin(time) * 0.05;
        break;
  }
};
