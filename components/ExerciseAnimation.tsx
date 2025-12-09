import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Loader2, AlertTriangle, Move3d, Layers, Eye } from 'lucide-react';

interface Props {
  visualTag: string;
  exerciseName?: string;
  description?: string;
}

const ExerciseAnimation: React.FC<Props> = ({ visualTag, exerciseName, description }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  
  // Animation State Refs
  const timeRef = useRef(0);
  const isPlayingRef = useRef(true);
  const speedRef = useRef(1);
  const isScrubbingRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // References for animation manipulation
  const bodyPartsRef = useRef<Record<string, THREE.Mesh>>({});
  const guideLinesRef = useRef<THREE.Line[]>([]);

  // UI State
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  // Toggle Play
  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    isPlayingRef.current = newState;
  };

  // Toggle Speed
  const toggleSpeed = () => {
    const newSpeed = speed === 1 ? 0.5 : speed === 0.5 ? 2 : 1;
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
  };
  
  // Handle Scrub
  const handleScrubStart = () => {
    isScrubbingRef.current = true;
  };

  const handleScrubEnd = () => {
    isScrubbingRef.current = false;
  };
  
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    timeRef.current = (val / 100) * (Math.PI * 2);
  };

  // Change Camera View
  const changeView = (view: 'iso' | 'front' | 'side' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const target = new THREE.Vector3(0, 0.9, 0);
    
    switch(view) {
        case 'front': 
            cameraRef.current.position.set(0, 1.4, 5.5); 
            break;
        case 'side': 
            cameraRef.current.position.set(5.5, 1.4, 0); 
            break;
        case 'top': 
            cameraRef.current.position.set(0, 6, 0.1); 
            break;
        case 'iso': 
        default: 
            cameraRef.current.position.set(3, 2, 4); 
            break;
    }

    cameraRef.current.lookAt(target);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
  };

  // --- Advanced Procedural Texture Generator ---
  const createTexture = (type: 'skin' | 'fabric', mode: 'color' | 'bump' = 'bump') => {
    if (typeof document === 'undefined') return null;
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Gradient Base
    const gradient = ctx.createLinearGradient(0, 0, size, 0);
    
    if (type === 'skin') {
       if (mode === 'color') {
           // Improved SSS Simulation: Deeper, richer gradient for skin tone depth
           gradient.addColorStop(0, '#a67c74');    // Shadow/Blood-rich area
           gradient.addColorStop(0.3, '#dcaaa0'); // Mid-tone
           gradient.addColorStop(0.5, '#f5d0c0'); // Highlight/Surface
           gradient.addColorStop(0.7, '#dcaaa0');
           gradient.addColorStop(1, '#a67c74');
       } else {
           // Bump Map Base
           gradient.addColorStop(0, '#808080');
           gradient.addColorStop(1, '#808080');
       }
    } else {
       // Fabric Base
       gradient.addColorStop(0, '#606060');
       gradient.addColorStop(0.5, '#808080');
       gradient.addColorStop(1, '#606060');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Noise Generation
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    
    for(let i=0; i < data.length; i += 4) {
        let grain;
        if (type === 'skin') {
             if (mode === 'bump') {
                 // Mixed frequency noise for realistic pores
                 const highFreq = (Math.random() - 0.5) * 20; // Sharper pores
                 const lowFreq = (Math.random() - 0.5) * 5;
                 grain = highFreq + lowFreq;
             } else {
                 // Color noise for skin pigmentation variation
                 grain = (Math.random() - 0.5) * 8;
             }
        } else {
            // Fabric noise
            grain = (Math.random() - 0.5) * 30;
        }
        
        data[i] = Math.max(0, Math.min(255, data[i] + grain));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + grain));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + grain));
        data[i+3] = 255; // Alpha
    }
    
    ctx.putImageData(imgData, 0, 0);

    // Detail Layers for Realism
    if (type === 'skin' && mode === 'color') {
        // 1. Blotchiness (Uneven skin tone for realism - Asymmetry)
        ctx.globalCompositeOperation = 'overlay';
        for (let i = 0; i < 60; i++) {
             const x = Math.random() * size;
             const y = Math.random() * size;
             const r = 30 + Math.random() * 60;
             // Subtle red/purple blotches for underlying blood vessels
             ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 180, 180, 0.04)' : 'rgba(100, 60, 80, 0.03)';
             ctx.beginPath();
             ctx.arc(x, y, r, 0, Math.PI * 2);
             ctx.fill();
        }

        // 2. Subsurface Veins (Subtle blue/purple)
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = 'rgba(80, 80, 140, 0.09)'; // Slightly purple/blue for veins
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.filter = 'blur(6px)'; // Heavy blur to put them "under" the skin
        
        const drawVein = (x: number, y: number, length: number, angle: number, width: number) => {
            if (length < 15 || width < 0.5) return;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(x, y);
            // Natural branching path
            const cp1x = x + Math.cos(angle) * length * 0.5;
            const cp1y = y + Math.sin(angle) * length * 0.5;
            const endX = x + Math.cos(angle + (Math.random() - 0.5)) * length;
            const endY = y + Math.sin(angle + (Math.random() - 0.5)) * length;
            
            ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
            ctx.stroke();

            // Recursively draw branches
            if (Math.random() > 0.6) {
                drawVein(endX, endY, length * 0.7, angle + 0.4, width * 0.7);
                drawVein(endX, endY, length * 0.7, angle - 0.4, width * 0.7);
            }
        };

        // Draw veins in random clusters
        for (let k = 0; k < 10; k++) {
            drawVein(Math.random() * size, Math.random() * size, 250, Math.random() * Math.PI * 2, 5);
        }
        ctx.filter = 'none';

        // 3. Moles & Freckles (Imperfections)
        ctx.globalCompositeOperation = 'source-over';
        for(let k=0; k<35; k++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 0.5 + Math.random() * 1.5;
            // Varied brown tones
            ctx.fillStyle = `rgba(${70 + Math.random()*20}, ${40 + Math.random()*20}, 30, ${0.4 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.fill();
        }
    }

    if (type === 'fabric') {
        // Weave pattern overlay
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for(let i=0; i<size; i+=4) {
            ctx.fillRect(i, 0, 1, size);
            ctx.fillRect(0, i, size, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    // Anisotropy improves texture quality at oblique angles
    texture.anisotropy = 4;
    texture.repeat.set(type === 'skin' ? 2 : 3, 2);
    
    if (mode === 'color') {
        texture.colorSpace = THREE.SRGBColorSpace;
    }
    
    return texture;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Reset
    setIsLoading(true);
    setHasError(false);
    timeRef.current = 0;
    isPlayingRef.current = true;
    setIsPlaying(true);
    isScrubbingRef.current = false;
    setSpeed(1);
    speedRef.current = 1;
    bodyPartsRef.current = {};
    guideLinesRef.current = [];

    // Timeout
    const loadTimeout = setTimeout(() => {
      if (mountRef.current && !rendererRef.current) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 4000);

    let animationId: number;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let resizeObserver: ResizeObserver;
    let controls: any;

    try {
      // --- SCENE SETUP ---
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1e293b); // Slate-800

      const initialWidth = mountRef.current.clientWidth || 300;
      const initialHeight = mountRef.current.clientHeight || 200;

      // Camera
      camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 100);
      camera.position.set(3, 2, 4);
      camera.lookAt(0, 0.9, 0);
      cameraRef.current = camera;

      // Renderer
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: false, 
        powerPreference: "high-performance" 
      });
      renderer.setSize(initialWidth, initialHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap; // High quality soft shadows
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0; 
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.minDistance = 2;
      controls.maxDistance = 7;
      controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above floor
      controls.target.set(0, 0.9, 0);
      controlsRef.current = controls;

      // --- STUDIO LIGHTING SETUP (REFINED) ---
      // 1. Ambient - Warm/Cool gradient bounce, moderate intensity for base visibility
      const ambient = new THREE.HemisphereLight(0xffffff, 0x2a3b55, 0.5); 
      scene.add(ambient);

      // 2. Key Light - Main source, warm, soft shadows
      const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
      keyLight.position.set(3, 6, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048; 
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.bias = -0.0001;
      keyLight.shadow.radius = 10; // Increased for even softer shadows
      scene.add(keyLight);

      // 3. Fill Light - Opposing the Key Light, cool tone, softer
      // Adjusted position to be more opposite (-5, 4, 2)
      const fillLight = new THREE.DirectionalLight(0xe6eeff, 0.6); 
      fillLight.position.set(-5, 4, 2); 
      scene.add(fillLight);
      
      // 4. Rim Light - Strong backlight for silhouette
      const rimLight = new THREE.SpotLight(0xc4b5fd, 3.5); 
      rimLight.position.set(-4, 5, -4);
      rimLight.lookAt(0, 0.5, 0);
      rimLight.penumbra = 0.5;
      scene.add(rimLight);
      
      // 5. Bounce Light - Ground reflection
      const bounceLight = new THREE.PointLight(0xffffff, 0.2);
      bounceLight.position.set(0, -2, 2);
      scene.add(bounceLight);

      // Floor
      const gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
      gridHelper.position.y = 0.001;
      scene.add(gridHelper);

      // --- MATERIALS (REFINED REALISM) ---
      const skinColorTex = createTexture('skin', 'color');
      const skinBumpTex = createTexture('skin', 'bump');
      const fabricTex = createTexture('fabric', 'bump'); 
      
      const skinMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: skinColorTex, 
        bumpMap: skinBumpTex,
        bumpScale: 0.004, // Slightly deeper for pore visibility
        roughness: 0.6, 
        roughnessMap: skinBumpTex, 
        metalness: 0.0,
        sheen: 1.2,         // Simulates micro-hairs/velvet skin surface
        sheenColor: 0xffd1d1, // Pinkish sheen for Subsurface Scattering approximation
        sheenRoughness: 0.6,
        clearcoat: 0.2,     // Natural oils
        clearcoatRoughness: 0.4,
        ior: 1.45,
      });

      const clothingTopMat = new THREE.MeshPhysicalMaterial({
        color: 0xf8fafc, 
        roughness: 0.8, 
        metalness: 0.0,
        bumpMap: fabricTex,
        bumpScale: 0.01, 
        sheen: 0.1
      });

      const clothingBotMat = new THREE.MeshPhysicalMaterial({
        color: 0x1e293b, 
        roughness: 0.6, 
        metalness: 0.1,
        bumpMap: fabricTex,
        bumpScale: 0.005,
        clearcoat: 0.1,
        sheen: 0.2,
        sheenColor: 0x475569
      });

      const shoeMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6
      });

      const jointMat = new THREE.MeshPhysicalMaterial({
        color: 0x64748b,
        roughness: 0.7,
        metalness: 0.3
      });
      
      const jointHighlightMat = new THREE.MeshPhysicalMaterial({
        color: 0xffaa00, 
        emissive: 0xff4400, 
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      });
      
      const guideMat = new THREE.LineDashedMaterial({
        color: 0xfacc15, 
        dashSize: 0.15,
        gapSize: 0.1,
        opacity: 0.8,
        transparent: true,
        depthTest: false
      });

      const highlightMat = new THREE.MeshPhysicalMaterial({
        color: 0x2dd4bf,
        emissive: 0x0d9488,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.8,
        transmission: 0.1,
        thickness: 0.5
      });

      const mannequin = new THREE.Group();
      scene.add(mannequin);

      // -- BODY CONSTRUCTION --
      const createPart = (name: string, geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D) => {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = name;
        parent.add(mesh);
        bodyPartsRef.current[name] = mesh;
        return mesh;
      };

      // 1. Pelvis (Bottoms)
      const pelvis = new THREE.Group();
      pelvis.position.y = 1.0;
      mannequin.add(pelvis);
      createPart('hips', new THREE.CylinderGeometry(0.13, 0.11, 0.22, 32), clothingBotMat, pelvis);

      // 2. Torso (Top)
      const spine = new THREE.Group();
      spine.position.y = 0.1;
      pelvis.add(spine);
      
      // Waist/Abs (Top)
      const waistMesh = createPart('abs', new THREE.CapsuleGeometry(0.1, 0.25, 8, 32), clothingTopMat, spine);
      waistMesh.position.y = 0.15;

      // Chest (Top)
      const chestGroup = new THREE.Group();
      chestGroup.position.y = 0.35;
      spine.add(chestGroup);
      const chestMesh = createPart('chest', new THREE.CylinderGeometry(0.16, 0.12, 0.3, 32), clothingTopMat, chestGroup);
      chestMesh.position.y = 0;

      // Neck (Skin)
      const neckGroup = new THREE.Group();
      neckGroup.position.y = 0.16;
      chestGroup.add(neckGroup);
      createPart('neck', new THREE.CylinderGeometry(0.045, 0.055, 0.1, 24), skinMat, neckGroup).position.y = 0.05;

      // Head (Skin)
      const headGroup = new THREE.Group();
      headGroup.position.y = 0.1;
      neckGroup.add(headGroup);
      createPart('head', new THREE.CapsuleGeometry(0.095, 0.13, 8, 32), skinMat, headGroup).position.y = 0.08;
      
      // Nose
      const noseGeo = new THREE.ConeGeometry(0.015, 0.04, 16);
      noseGeo.rotateX(Math.PI/2);
      const nose = createPart('nose', noseGeo, skinMat, headGroup);
      nose.position.set(0, 0.08, 0.1);

      // 3. Legs
      const createLeg = (side: 'left' | 'right') => {
        const isLeft = side === 'left';
        const sign = isLeft ? -1 : 1;
        
        const hipJoint = new THREE.Group();
        hipJoint.position.set(sign * 0.115, -0.05, 0);
        pelvis.add(hipJoint);
        createPart(`${side}HipJoint`, new THREE.SphereGeometry(0.07, 32, 32), jointMat, hipJoint);

        const thighGroup = new THREE.Group();
        thighGroup.position.y = 0;
        hipJoint.add(thighGroup);
        // Thighs (Bottoms)
        const thighMesh = createPart(`${side}Thigh`, new THREE.CapsuleGeometry(0.09, 0.38, 8, 32), clothingBotMat, thighGroup);
        thighMesh.position.y = -0.22;

        const kneeGroup = new THREE.Group();
        kneeGroup.position.y = -0.44;
        thighGroup.add(kneeGroup);
        createPart(`${side}Knee`, new THREE.SphereGeometry(0.065, 32, 32), jointMat, kneeGroup);

        // Shins (Bottoms/Leggings)
        const shinMesh = createPart(`${side}Shin`, new THREE.CapsuleGeometry(0.075, 0.38, 8, 32), clothingBotMat, kneeGroup);
        shinMesh.position.y = -0.22;

        const ankleGroup = new THREE.Group();
        ankleGroup.position.y = -0.44;
        kneeGroup.add(ankleGroup);
        createPart(`${side}Ankle`, new THREE.SphereGeometry(0.055, 32, 32), jointMat, ankleGroup);

        // Foot (Shoes)
        const footMesh = createPart(`${side}Foot`, new THREE.BoxGeometry(0.08, 0.05, 0.22), shoeMat, ankleGroup);
        footMesh.position.set(0, -0.04, 0.06);

        return { hip: hipJoint, knee: kneeGroup, ankle: ankleGroup, thigh: thighGroup };
      };

      const lLeg = createLeg('left');
      const rLeg = createLeg('right');

      // 4. Arms
      const createArm = (side: 'left' | 'right') => {
        const isLeft = side === 'left';
        const sign = isLeft ? -1 : 1;

        const shoulderJoint = new THREE.Group();
        shoulderJoint.position.set(sign * 0.19, 0.11, 0);
        chestGroup.add(shoulderJoint);
        createPart(`${side}Shoulder`, new THREE.SphereGeometry(0.07, 32, 32), jointMat, shoulderJoint);

        const upperArmGroup = new THREE.Group();
        shoulderJoint.add(upperArmGroup);
        // Upper Arm (Top/Sleeves)
        const upperArmMesh = createPart(`${side}UpperArm`, new THREE.CapsuleGeometry(0.07, 0.28, 8, 32), clothingTopMat, upperArmGroup);
        upperArmMesh.position.y = -0.16;

        const elbowGroup = new THREE.Group();
        elbowGroup.position.y = -0.32;
        upperArmGroup.add(elbowGroup);
        createPart(`${side}Elbow`, new THREE.SphereGeometry(0.06, 32, 32), jointMat, elbowGroup);

        // Forearm (Skin)
        const forearmMesh = createPart(`${side}Forearm`, new THREE.CapsuleGeometry(0.06, 0.24, 8, 32), skinMat, elbowGroup);
        forearmMesh.position.y = -0.15;

        const wristGroup = new THREE.Group();
        wristGroup.position.y = -0.28;
        elbowGroup.add(wristGroup);
        createPart(`${side}Wrist`, new THREE.SphereGeometry(0.05, 32, 32), jointMat, wristGroup);

        // Hand (Skin)
        const handMesh = createPart(`${side}Hand`, new THREE.BoxGeometry(0.05, 0.12, 0.09), skinMat, wristGroup);
        handMesh.position.y = -0.07;

        return { shoulder: shoulderJoint, elbow: elbowGroup, wrist: wristGroup };
      };

      const lArm = createArm('left');
      const rArm = createArm('right');

      // --- VISUAL AIDS (Guides) ---
      const guidesGroup = new THREE.Group();
      scene.add(guidesGroup);
      
      const createGuide = () => {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const line = new THREE.Line(geo, guideMat);
        line.visible = false;
        guidesGroup.add(line);
        guideLinesRef.current.push(line);
        return line;
      };
      
      createGuide();
      createGuide();
      createGuide();

      setIsLoading(false);
      clearTimeout(loadTimeout);

      // --- RESIZE HANDLER ---
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
           const { width, height } = entry.contentRect;
           if (width > 0 && height > 0 && renderer && camera) {
             renderer.setSize(width, height);
             camera.aspect = width / height;
             camera.updateProjectionMatrix();
           }
        }
      });
      resizeObserver.observe(mountRef.current);

      // --- ANIMATION LOOP ---
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        controls.update();

        // 1. Time Update
        if (isPlayingRef.current) {
           timeRef.current += 0.03 * speedRef.current;
           if (timeRef.current > Math.PI * 2) {
              timeRef.current -= Math.PI * 2;
           }
           if (sliderRef.current && !isScrubbingRef.current) {
              sliderRef.current.value = ((timeRef.current / (Math.PI * 2)) * 100).toString();
           }
        }
  
        const time = timeRef.current;
        const sinWave = Math.sin(time);
        const absSin = Math.abs(sinWave);
        
        // --- PHYSICS & SECONDARY MOTION ---
        const exertion = (Math.sin(time) + 1) * 0.5; // 0 to 1 intensity cycle

        // Sweat accumulation logic (Material Physics)
        skinMat.clearcoat = 0.2 + (exertion * 0.3); // Increased sweat gloss range
        skinMat.roughness = 0.6 - (exertion * 0.15); 
        
        // Breathing fill light for lifelike ambience (Lighting Physics)
        fillLight.intensity = 0.6 + (Math.sin(time * 0.8) * 0.1);
        keyLight.position.x = 3 + Math.sin(time * 0.2) * 0.5;

        // 1. Respiratory Dynamics (Breathing)
        // Faster breathing during exertion, affects shoulders and chest
        const breathSpeed = 1.5 + (exertion * 1.5); 
        const breathDepth = 0.02 + (exertion * 0.015);
        const breath = Math.sin(time * breathSpeed) * breathDepth;
        
        chestGroup.scale.set(1 + breath, 1 + breath, 1 + breath * 1.2); 
        lArm.shoulder.position.y = 0.11 + (breath * 0.3);
        rArm.shoulder.position.y = 0.11 + (breath * 0.3);

        // 2. Natural Noise (Micro-adjustments for balance)
        // Using sine combination to simulate Perlin-like noise
        const noise = Math.sin(time * 3.7) * Math.sin(time * 1.3) * 0.02;
        spine.rotation.z += noise; 
        headGroup.rotation.z -= noise * 0.8; // Head compensates

        // 3. Inertia / Lag (Amplified for lifelike feel)
        const timeLag = time - 0.25;
        const sinLag = Math.sin(timeLag);
        const absSinLag = Math.abs(sinLag);
        
        // 4. Tremor (Muscle Stability)
        const tremorMagnitude = 0.003 + (exertion * 0.005);
        const tremor = (Math.random() - 0.5) * tremorMagnitude;

        // 5. Muscle Dynamics (Squash & Stretch)
        const bulgeMuscle = (partName: string, contraction: number) => {
            const mesh = bodyPartsRef.current[partName];
            if (mesh) {
                // Simple volume conservation approximation
                const thick = 1 + (contraction * 0.15); // Bulge
                const len = 1 - (contraction * 0.05);   // Shorten
                mesh.scale.set(thick, len, thick);
            }
        };

        // 2. Reset Pose (Base)
        pelvis.position.set(0, 1.0, 0);
        pelvis.rotation.set(0,0,0);
        spine.rotation.set(0,0,0);
        chestGroup.rotation.set(0,0,0); 
        mannequin.rotation.set(0,0,0);
        mannequin.position.set(0,0,0);
        guidesGroup.visible = showGuides;

        // Reset Joint Rotations
        [lLeg, rLeg].forEach(leg => {
            leg.hip.rotation.set(0,0,0);
            leg.knee.rotation.set(0,0,0);
            leg.ankle.rotation.set(0,0,0);
            if (bodyPartsRef.current[leg.thigh.name]) bodyPartsRef.current[leg.thigh.name].scale.set(1,1,1); // Reset bulge 
        });
        [lArm, rArm].forEach(arm => {
            arm.shoulder.rotation.set(0,0,0);
            arm.elbow.rotation.set(0,0,0);
            arm.wrist.rotation.set(0,0,0);
        });

        // Default A-Pose
        lArm.shoulder.rotation.z = 0.2;
        rArm.shoulder.rotation.z = -0.2;

        // 3. Highlight Logic (Reset first)
        const parts = bodyPartsRef.current;
        Object.keys(parts).forEach(key => {
            if (key.includes('nose')) return;
            
            if (key.includes('Joint') || key.includes('Elbow') || key.includes('Wrist') || key.includes('Knee') || key.includes('Ankle')) {
                parts[key].material = jointMat;
                return;
            }

            if (key.includes('Hand') || key.includes('Forearm') || key.includes('head') || key.includes('neck')) {
                parts[key].material = skinMat;
            } else if (key.includes('Foot')) {
                parts[key].material = shoeMat;
            } else if (key.includes('Thigh') || key.includes('Shin') || key.includes('hips')) {
                parts[key].material = clothingBotMat;
            } else {
                parts[key].material = clothingTopMat; // Shirt
            }
        });

        const highlightParts = (partNames: string[], engagement: number = 0.5) => {
            // Smooth easing curve (Cubic Ease In-Out) for natural engagement transition
            // This prevents linear "robotic" lighting changes
            const t = engagement < 0.5 
                ? 4 * engagement * engagement * engagement 
                : 1 - Math.pow(-2 * engagement + 2, 3) / 2;

            if (t < 0.05) return;

            // Dynamic Pulse (Simulates blood flow/energy)
            // Frequency scales with effort: 1.5Hz (resting) -> 4.0Hz (max effort)
            const pulseFreq = 1.5 + (t * 2.5); 
            // Sine wave normalized 0..1 with a slight time offset for organic feel
            const sine = (Math.sin(time * pulseFreq - Math.PI/4) + 1) * 0.5;
            // Pulse magnitude increases with effort
            const pulse = sine * (0.1 + t * 0.3);

            // Intensity Mapping
            // Base emission + dynamic effort + pulse
            const baseIntensity = 0.4;
            const maxIntensity = 2.5; // Brighter peak for visibility
            const currentIntensity = baseIntensity + (t * (maxIntensity - baseIntensity)) + pulse;

            const opacity = 0.5 + (t * 0.4); // 0.5 to 0.9

            const mat = highlightMat as THREE.MeshPhysicalMaterial;
            mat.emissiveIntensity = currentIntensity;
            mat.opacity = opacity;
            
            // Dynamic Color Shift (Heatmap style)
            // Shift from Cool Teal -> Bright Cyan -> Hot White
            const c1 = new THREE.Color(0x2dd4bf); // Base Teal
            const c2 = new THREE.Color(0xffffff); // Hot White
            mat.emissive.lerpColors(c1, c2, t * 0.9); // Don't go fully white to keep some color

            partNames.forEach(name => {
                const mesh = parts[name];
                if (mesh) {
                    mesh.material = highlightMat;
                }
            });
        };
        
        const highlightJoints = (partNames: string[], intensityScalar: number) => {
            // Subtle sympathetic resonance pulse
            const pulse = (Math.sin(time * 8.0) + 1) * 0.15; 
            const glow = 0.6 + (intensityScalar * 2.0) + pulse;
            
            const mat = jointHighlightMat as THREE.MeshPhysicalMaterial;
            mat.emissiveIntensity = glow;
            
            // Dynamic Color Shift: Warning Orange -> Alert Red
            const safeColor = new THREE.Color(0xff8800);
            const stressColor = new THREE.Color(0xff0000);
            mat.emissive.lerpColors(safeColor, stressColor, intensityScalar * 0.8);

            partNames.forEach(name => {
                const mesh = parts[name];
                if (mesh) {
                    mesh.material = jointHighlightMat;
                }
            });
        };

        const updateGuide = (idx: number, start: THREE.Vector3, end: THREE.Vector3) => {
            const line = guideLinesRef.current[idx];
            if (!line) return;
            line.visible = true;
            line.geometry.setFromPoints([start, end]);
            line.computeLineDistances();
        };
        guideLinesRef.current.forEach(l => l.visible = false);
        
        const getWorldPos = (name: string) => {
            const v = new THREE.Vector3();
            if(parts[name]) parts[name].getWorldPosition(v);
            return v;
        };

        // 4. Procedural Animations
        switch (visualTag) {
          case 'standing': // SQUAT
            pelvis.position.y = 1.0 - (absSin * 0.3);
            pelvis.rotation.x = -absSin * 0.2;
            
            lLeg.hip.rotation.x = -absSin * 1.0;
            rLeg.hip.rotation.x = -absSin * 1.0;
            lLeg.knee.rotation.x = absSin * 2.1;
            rLeg.knee.rotation.x = absSin * 2.1;
            
            lLeg.ankle.rotation.x = -lLeg.hip.rotation.x - lLeg.knee.rotation.x - pelvis.rotation.x;
            rLeg.ankle.rotation.x = -rLeg.hip.rotation.x - rLeg.knee.rotation.x - pelvis.rotation.x;

            // Lag Effect: Arms raise slightly after hips drop
            lArm.shoulder.rotation.x = -absSinLag * 1.5;
            rArm.shoulder.rotation.x = -absSinLag * 1.5;
            spine.position.y = 0.1 - (absSin * 0.01);

             // Physics: Knee wobble at bottom of squat
            if (absSin > 0.8) {
                 lLeg.knee.rotation.z = (Math.sin(time * 15) * 0.05);
                 rLeg.knee.rotation.z = -(Math.sin(time * 15) * 0.05);
                 // Thigh muscles bulge at max exertion
                 bulgeMuscle('leftThigh', 0.8);
                 bulgeMuscle('rightThigh', 0.8);
            }

            highlightParts(['leftThigh', 'rightThigh', 'hips'], absSin);
            highlightJoints(['leftKnee', 'rightKnee', 'leftHipJoint', 'rightHipJoint'], absSin);
            
            const hipPos = getWorldPos('hips');
            const floorPos = hipPos.clone().setY(0);
            updateGuide(0, hipPos, floorPos);
            break;
  
          case 'lying_back': // CRUNCH
            mannequin.rotation.x = -Math.PI / 2;
            mannequin.position.y = 0.15;
            
            lLeg.hip.rotation.x = -1.5;
            rLeg.hip.rotation.x = -1.5;
            lLeg.knee.rotation.x = 1.6;
            rLeg.knee.rotation.x = 1.6;
            
            const crunch = Math.max(0, sinWave);
            spine.rotation.x = crunch * 0.6;
            // Neck follows with lag
            neckGroup.rotation.x = Math.max(0, sinLag) * 0.3;

            // Effort shake
            if (crunch > 0.5) {
                spine.rotation.y += tremor;
            }

            highlightParts(['abs'], crunch);
            highlightJoints(['neck'], crunch);
            break;

          case 'glute_bridge': 
            mannequin.rotation.x = -Math.PI / 2;
            mannequin.position.y = 0.15;
            lLeg.hip.rotation.x = -0.5; rLeg.hip.rotation.x = -0.5;
            lLeg.knee.rotation.x = 2.0; rLeg.knee.rotation.x = 2.0;

            const bridge = Math.max(0, sinWave);
            pelvis.position.y = 0.15 + (bridge * 0.3);
            pelvis.position.z = - (bridge * 0.1); 
            
            lLeg.hip.rotation.x = -0.5 + (bridge * 0.5); 
            rLeg.hip.rotation.x = -0.5 + (bridge * 0.5);
            
            if (bridge > 0.6) {
                bulgeMuscle('leftThigh', 0.5);
                bulgeMuscle('rightThigh', 0.5);
            }

            highlightParts(['hips', 'leftThigh', 'rightThigh'], bridge);
            highlightJoints(['leftHipJoint', 'rightHipJoint'], bridge);
            
            if (bridge > 0.5) {
                updateGuide(0, getWorldPos('leftKnee'), getWorldPos('leftShoulder'));
            }
            break;
  
          case 'all_fours': // CAT COW
            mannequin.rotation.x = -Math.PI / 2;
            mannequin.position.y = 0.45;
            
            lArm.shoulder.rotation.x = -1.57; rArm.shoulder.rotation.x = -1.57;
            lLeg.hip.rotation.x = -1.57; rLeg.hip.rotation.x = -1.57;
            lLeg.knee.rotation.x = 1.57; rLeg.knee.rotation.x = 1.57;
            
            spine.rotation.x = Math.sin(time) * 0.4;
            // Fluid spinal wave: Head lags behind spine
            headGroup.rotation.x = Math.sin(timeLag * 1.1) * 0.3; 
            chestGroup.rotation.x = Math.sin(time) * 0.2;
            
            highlightParts(['abs', 'chest'], Math.abs(Math.sin(time)));
            highlightJoints(['leftShoulder', 'rightShoulder', 'leftHipJoint', 'rightHipJoint'], 0.4 + (Math.abs(Math.sin(time)) * 0.3));
            break;

          case 'bird_dog': 
            mannequin.rotation.x = -Math.PI / 2;
            mannequin.position.y = 0.45;
            
            lArm.shoulder.rotation.x = -1.57; rArm.shoulder.rotation.x = -1.57;
            lLeg.hip.rotation.x = -1.57; rLeg.hip.rotation.x = -1.57;
            lLeg.knee.rotation.x = 1.57; rLeg.knee.rotation.x = 1.57;

            const extend = Math.max(0, sinWave);
            const extendLag = Math.max(0, sinLag);

            // Lag: Arm extends slightly after leg or vice-versa creates more natural "seeking" balance
            rArm.shoulder.rotation.x = -1.57 + (extendLag * 1.57);
            lLeg.hip.rotation.x = -1.57 - (extend * 0.4); 
            lLeg.knee.rotation.x = 1.57 - (extend * 1.57);
            
             // Instability in supporting limb
             if (extend > 0.5) {
                lArm.shoulder.rotation.z += tremor; 
             }

            highlightParts(['abs', 'rightUpperArm', 'leftThigh', 'leftShin'], extend);
            highlightJoints(['rightShoulder', 'leftHipJoint'], 1.0 - extend * 0.5);
            
            if (extend > 0.2) {
                updateGuide(0, getWorldPos('rightHand'), getWorldPos('leftFoot'));
            }
            break;
  
          case 'plank':
            mannequin.rotation.x = -Math.PI / 2;
            mannequin.position.y = 0.25;
            lArm.shoulder.rotation.x = -1.2; rArm.shoulder.rotation.x = -1.2;
            lArm.elbow.rotation.x = -1.5; rArm.elbow.rotation.x = -1.5;
            pelvis.position.y = 0.3 + (Math.sin(time * 8) * 0.005);
            
            // Core Tremor (Fatigue simulation - Physics)
            spine.position.y += tremor * 2;
            spine.rotation.z += tremor;
            lArm.shoulder.position.y += tremor;
            rArm.shoulder.position.y -= tremor; // Asymmetric shake

            highlightParts(['abs', 'leftThigh', 'rightThigh'], 0.9);
            highlightJoints(['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow'], 0.5 + (Math.sin(time * 2) * 0.2));
            updateGuide(0, getWorldPos('head'), getWorldPos('leftFoot'));
            break;

          case 'side_plank': 
            mannequin.rotation.x = -Math.PI / 2;
            mannequin.rotation.y = -Math.PI / 2;
            mannequin.position.y = 0.2;
            
            rArm.shoulder.rotation.z = -1.57; rArm.elbow.rotation.x = -1.57;
            
            const sideLift = Math.max(0, sinWave);
            pelvis.position.y = 0.2 + (sideLift * 0.2);
            spine.rotation.z = -sideLift * 0.1; 
            
            // Shoulder Instability during lift
            if (sideLift > 0.6) {
                rArm.shoulder.position.x += tremor;
                rArm.shoulder.position.z += tremor;
            }

            highlightParts(['abs', 'rightUpperArm'], sideLift);
            highlightJoints(['rightShoulder', 'rightElbow'], sideLift);
            updateGuide(0, getWorldPos('head'), getWorldPos('leftFoot'));
            break;
            
          case 'lunge': 
            lLeg.hip.rotation.x = 0.5 + (absSin * 0.5);
            lLeg.knee.rotation.x = 1.0 + (absSin * 0.5);
            lLeg.ankle.rotation.x = -0.3; 
            
            rLeg.hip.rotation.x = -0.5;
            rLeg.knee.rotation.x = 1.0 + (absSin * 0.8);
            rLeg.ankle.rotation.x = 1.0; 
            
            pelvis.position.y = 0.9 - (absSin * 0.25);
            spine.rotation.z = Math.sin(time) * 0.05; 
            
            // Balance challenge
            spine.rotation.y += noise * 3.0; // Balance wobble

            // Muscle physics
            if (absSin > 0.6) {
               bulgeMuscle('leftThigh', 0.7);
               bulgeMuscle('rightThigh', 0.6);
            }

            highlightParts(['leftThigh', 'rightThigh', 'hips'], absSin);
            highlightJoints(['leftKnee', 'rightKnee'], absSin);
            
            const kneePos = getWorldPos('leftKnee');
            const anklePos = getWorldPos('leftAnkle');
            updateGuide(0, kneePos, anklePos);
            break;
  
          case 'seated':
            pelvis.position.y = 0.55;
            lLeg.hip.rotation.x = -1.2; lLeg.hip.rotation.z = -0.5; lLeg.knee.rotation.x = 2.0;
            rLeg.hip.rotation.x = -1.2; rLeg.hip.rotation.z = 0.5; rLeg.knee.rotation.x = 2.0;

            const deepBreath = 1 + (sinWave * 0.08);
            const breathEffort = (sinWave + 1) * 0.5; 
            
            chestGroup.scale.set(deepBreath, deepBreath, deepBreath); 
            lArm.shoulder.position.y = 0.11 + (sinWave * 0.01);
            rArm.shoulder.position.y = 0.11 + (sinWave * 0.01);

            lArm.shoulder.rotation.z = 0.5; rArm.shoulder.rotation.z = -0.5;
            lArm.elbow.rotation.x = -0.5; rArm.elbow.rotation.x = -0.5;
            
            // Meditative sway
            spine.rotation.x = Math.sin(time * 0.5) * 0.05;
            spine.rotation.z += noise; // Seated balance
            
            highlightParts(['chest', 'abs'], breathEffort);
            highlightJoints(['leftHipJoint', 'rightHipJoint'], 0.3);
            break;
  
          default:
             spine.rotation.y = Math.sin(time) * 0.05;
        }
  
        renderer.render(scene, camera);
      };
  
      animate();
    } catch (err) {
      console.error("ThreeJS Initialization Error:", err);
      setHasError(true);
      setIsLoading(false);
      clearTimeout(loadTimeout);
    }

    return () => {
      clearTimeout(loadTimeout);
      cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      if (controlsRef.current) controlsRef.current.dispose();
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [visualTag, showGuides]);

  return (
    <div className="relative w-full h-full group bg-slate-900 rounded-lg overflow-hidden">
        {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20 transition-opacity">
                <Loader2 className="animate-spin text-rose-400 mb-2" size={32} />
                <span className="text-slate-400 text-xs font-medium">Loading 3D Engine...</span>
            </div>
        )}

        {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20 p-6 text-center">
                <AlertTriangle className="text-slate-500 mb-2 opacity-50" size={32} />
                <p className="text-slate-300 font-medium text-sm mb-1">Animation Unavailable</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                  aria-label="Reload page"
                >
                    <RotateCcw size={12} /> Reload Page
                </button>
            </div>
        )}

        <div ref={mountRef} className="w-full h-full cursor-move" title="Click and drag to rotate view" />
        
        {/* Camera View Controls - Hidden on Mobile */}
        <div className="hidden md:flex absolute top-4 right-4 flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-slate-900/60 backdrop-blur-md rounded-lg border border-white/10 p-1 shadow-xl">
                <div className="text-[10px] text-slate-400 font-bold uppercase px-2 py-1 flex items-center gap-1 border-b border-white/5 mb-1">
                   <Eye size={10} /> Views
                </div>
                <div className="flex flex-col gap-0.5">
                    <button onClick={() => changeView('iso')} className="px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:text-rose-300 hover:bg-white/10 rounded transition-colors text-left">Default</button>
                    <button onClick={() => changeView('front')} className="px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:text-rose-300 hover:bg-white/10 rounded transition-colors text-left">Front</button>
                    <button onClick={() => changeView('side')} className="px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:text-rose-300 hover:bg-white/10 rounded transition-colors text-left">Side</button>
                    <button onClick={() => changeView('top')} className="px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:text-rose-300 hover:bg-white/10 rounded transition-colors text-left">Top</button>
                </div>
            </div>
        </div>

        {/* Controls Overlay - Compact on Mobile */}
        {!isLoading && !hasError && (
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent flex flex-col gap-2 md:gap-3 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                {/* Exercise Info in Overlay */}
                {(exerciseName || description) && (
                  <div className="mb-1 text-white animate-fade-in-up md:block hidden">
                      {exerciseName && <h4 className="font-bold text-sm shadow-black drop-shadow-md text-rose-100">{exerciseName}</h4>}
                      {description && <p className="text-xs text-slate-200 line-clamp-2 shadow-black drop-shadow-md opacity-90">{description}</p>}
                  </div>
                )}

                <input 
                    ref={sliderRef}
                    type="range" 
                    min="0" 
                    max="100" 
                    defaultValue="0"
                    step="0.1"
                    onChange={handleScrub}
                    onMouseDown={handleScrubStart}
                    onMouseUp={handleScrubEnd}
                    onTouchStart={handleScrubStart}
                    onTouchEnd={handleScrubEnd}
                    className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    aria-label="Animation Timeline"
                />
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={togglePlay}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors border border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            aria-label={isPlaying ? "Pause animation" : "Play animation"}
                        >
                            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                        </button>
                        
                        <button 
                             onClick={() => {
                                 timeRef.current = 0;
                                 if(sliderRef.current) sliderRef.current.value = "0";
                             }}
                             className="p-1.5 text-slate-400 hover:text-white transition-colors focus:outline-none focus:text-white"
                             title="Restart"
                             aria-label="Restart animation"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setShowGuides(!showGuides)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 border ${showGuides ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' : 'bg-white/10 text-slate-400 border-white/5'}`}
                            title="Toggle Form Guides"
                        >
                            <Layers size={12} /> <span className="hidden md:inline">Guides</span>
                        </button>
                        <button 
                            onClick={toggleSpeed}
                            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-rose-300 backdrop-blur-sm transition-colors min-w-[2.5rem] border border-white/5 text-center focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            aria-label={`Playback speed: ${speed}x`}
                        >
                            {speed}x
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Badges - Hidden on Mobile */}
        <div className="hidden md:flex absolute top-4 left-4 flex-col gap-2">
            <div className="flex gap-2">
              <div className="bg-slate-900/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10 pointer-events-none">
                  Procedural 3D
              </div>
              <div className="bg-rose-900/50 backdrop-blur text-rose-200 px-2 py-1 rounded-full text-xs font-medium border border-rose-500/30 pointer-events-none flex items-center gap-1">
                  <Move3d size={10} /> 360°
              </div>
            </div>
             <div className="text-[10px] text-rose-400 font-medium px-2 py-0.5 rounded bg-rose-900/20 border border-rose-900/30 w-fit">
                Glow = Active Muscle
            </div>
        </div>
    </div>
  );
};

export default ExerciseAnimation;