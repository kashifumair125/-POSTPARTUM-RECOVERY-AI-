
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Loader2, AlertTriangle, Move3d, Layers, Eye } from 'lucide-react';
import { BodyRig, updateAnimationFrame, MaterialSet, calculateExertion } from '../services/animationEngine';

interface Props {
  visualTag: string;
  exerciseName?: string;
  description?: string;
}

const ExerciseAnimation: React.FC<Props> = ({ visualTag, exerciseName, description }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef(0);
  const breathTimeRef = useRef(0);
  const isPlayingRef = useRef(true);
  const speedRef = useRef(1);
  const isScrubbingRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  const nameRef = useRef(exerciseName);
  useEffect(() => { nameRef.current = exerciseName; }, [exerciseName]);
  
  const rigRef = useRef<BodyRig | null>(null);
  const matsRef = useRef<MaterialSet | null>(null);
  const guideLinesRef = useRef<THREE.Line[]>([]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    isPlayingRef.current = newState;
  };

  const toggleSpeed = () => {
    const newSpeed = speed === 1 ? 0.5 : speed === 0.5 ? 2 : 1;
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
  };
  
  const handleScrubStart = () => { isScrubbingRef.current = true; };
  const handleScrubEnd = () => { isScrubbingRef.current = false; };
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    timeRef.current = (val / 100) * (Math.PI * 2);
  };

  const changeView = (view: 'iso' | 'front' | 'side' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const target = new THREE.Vector3(0, 0.9, 0);
    switch(view) {
        case 'front': cameraRef.current.position.set(0, 1.4, 5.5); break;
        case 'side': cameraRef.current.position.set(5.5, 1.4, 0); break;
        case 'top': cameraRef.current.position.set(0, 6, 0.1); break;
        case 'iso': default: cameraRef.current.position.set(3, 2, 4); break;
    }
    cameraRef.current.lookAt(target);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
  };

  // Enhanced Procedural Texture Generator
  const createTexture = (type: 'skin' | 'fabric', mode: 'color' | 'bump' = 'bump') => {
    if (typeof document === 'undefined') return null;
    const size = 1024; // High res for detail
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    
    // Base Layer
    if (type === 'skin') {
       if (mode === 'color') {
           // Warm skin base
           ctx.fillStyle = '#ffdbac';
           ctx.fillRect(0, 0, size, size);

           // Add subtle radial gradient for depth (fake subsurface scattering/warmth)
           const gradient = ctx.createRadialGradient(size/2, size/2, size/4, size/2, size/2, size);
           gradient.addColorStop(0, 'rgba(255, 230, 210, 0.1)'); // Highlighting center
           gradient.addColorStop(1, 'rgba(200, 140, 130, 0.2)'); // Darker/redder edges
           ctx.fillStyle = gradient;
           ctx.fillRect(0, 0, size, size);

           // Imperfections: Varied pigmentation (Freckles/Spots)
           const spots = 300; 
           for(let i=0; i < spots; i++) {
               const x = Math.random() * size;
               const y = Math.random() * size;
               const r = Math.random() * 1.5 + 0.2;
               ctx.fillStyle = `rgba(130, 90, 80, ${Math.random() * 0.15})`; // Subtle brownish red
               ctx.beginPath();
               ctx.arc(x, y, r, 0, Math.PI * 2);
               ctx.fill();
           }

           // Noise for uneven skin tone
           const noiseData = ctx.getImageData(0,0,size,size);
           for(let i=0; i<noiseData.data.length; i+=4) {
               if(Math.random() > 0.8) {
                   const varC = (Math.random() - 0.5) * 8;
                   noiseData.data[i] += varC;   
                   noiseData.data[i+1] += varC; 
                   noiseData.data[i+2] += varC; 
               }
           }
           ctx.putImageData(noiseData, 0, 0);

       } else {
           // Bump Map
           // Middle grey for base bump
           ctx.fillStyle = '#808080';
           ctx.fillRect(0, 0, size, size);

           // High frequency noise for pores
           const imgData = ctx.getImageData(0, 0, size, size);
           const data = imgData.data;
           for(let i=0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 15; // Intensity of pore bump
                data[i] = Math.max(0, Math.min(255, data[i] + noise));
                data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
                data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
           }
           ctx.putImageData(imgData, 0, 0);

           // Random indentations (pores/moles)
           for(let i=0; i<200; i++) {
               const x = Math.random() * size;
               const y = Math.random() * size;
               const r = Math.random() * 1.0;
               ctx.fillStyle = 'rgba(0,0,0,0.15)';
               ctx.beginPath();
               ctx.arc(x,y,r,0,Math.PI*2);
               ctx.fill();
           }
       }
    } else {
       // Fabric base
       ctx.fillStyle = '#505050';
       ctx.fillRect(0, 0, size, size);
       
       // Simple Weave pattern noise
       const imgData = ctx.getImageData(0, 0, size, size);
       const data = imgData.data;
       for(let i=0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 25;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
            if(mode === 'color') data[i+3] = 255;
       }
       ctx.putImageData(imgData, 0, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    if (mode === 'color') texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Reset State
    setIsLoading(true);
    setHasError(false);
    timeRef.current = 0;
    breathTimeRef.current = 0;
    guideLinesRef.current = [];
    rigRef.current = null;

    let animationId: number;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let resizeObserver: ResizeObserver;
    let controls: any;

    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1e293b); 

      const initialWidth = mountRef.current.clientWidth || 300;
      const initialHeight = mountRef.current.clientHeight || 200;

      camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 100);
      camera.position.set(3, 2, 4);
      camera.lookAt(0, 0.9, 0);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(initialWidth, initialHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 0.9, 0);
      controlsRef.current = controls;

      // Lighting
      const ambient = new THREE.HemisphereLight(0xffffff, 0x2a3b55, 0.6); 
      scene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0xfff0e6, 1.2);
      keyLight.position.set(3, 6, 5);
      keyLight.castShadow = true;
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.6); 
      fillLight.position.set(-5, 2, 4);
      scene.add(fillLight);
      
      const gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
      gridHelper.position.y = 0.001;
      scene.add(gridHelper);

      // Materials
      const skinColorTex = createTexture('skin', 'color');
      const skinBumpTex = createTexture('skin', 'bump');
      const fabricTex = createTexture('fabric', 'bump'); 
      
      const mats: MaterialSet = {
        skin: new THREE.MeshPhysicalMaterial({
            color: 0xffeadd, 
            map: skinColorTex, 
            bumpMap: skinBumpTex, 
            bumpScale: 0.008, // Enhanced bump scale for pores
            roughness: 0.45,  // Slightly more matte
            clearcoat: 0.3,   // Sweat sheen capability
            clearcoatRoughness: 0.2
        }),
        clothesTop: new THREE.MeshPhysicalMaterial({
            color: 0xfce7f3, roughness: 0.9, bumpMap: fabricTex, bumpScale: 0.02
        }),
        clothesBot: new THREE.MeshPhysicalMaterial({
            color: 0x334155, roughness: 0.8, bumpMap: fabricTex, bumpScale: 0.015
        }),
        shoe: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 }),
        joint: new THREE.MeshPhysicalMaterial({ color: 0x64748b, roughness: 0.7 }),
        // Enhanced Joint Highlight (Bright Orange/Red)
        jointHighlight: new THREE.MeshPhysicalMaterial({
            color: 0xffaa00, 
            emissive: 0xff4400, 
            emissiveIntensity: 2.0, 
            roughness: 0.2
        }),
        // Enhanced Muscle Highlight (Glows through clothing/skin with High Contrast)
        highlight: new THREE.MeshPhysicalMaterial({
            color: 0xff3366, 
            emissive: 0xff0044, 
            emissiveIntensity: 2.0, 
            transparent: true, 
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.1
        })
      };
      matsRef.current = mats;

      // Construct Mannequin
      const mannequin = new THREE.Group();
      scene.add(mannequin);
      const parts: Record<string, THREE.Mesh> = {};

      const createPart = (name: string, geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D) => {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = name;
        parent.add(mesh);
        parts[name] = mesh;
        return mesh;
      };

      const pelvis = new THREE.Group();
      pelvis.position.y = 1.0;
      mannequin.add(pelvis);
      createPart('hips', new THREE.CylinderGeometry(0.11, 0.17, 0.22, 32), mats.clothesBot, pelvis);

      const spine = new THREE.Group();
      spine.position.y = 0.11;
      pelvis.add(spine);
      const waist = createPart('abs', new THREE.CapsuleGeometry(0.105, 0.20, 8, 32), mats.clothesTop, spine);
      waist.position.y = 0.12;

      const chestGroup = new THREE.Group();
      chestGroup.position.y = 0.32;
      spine.add(chestGroup);
      createPart('chest', new THREE.CylinderGeometry(0.15, 0.11, 0.28, 32), mats.clothesTop, chestGroup);

      const neckGroup = new THREE.Group();
      neckGroup.position.y = 0.14;
      chestGroup.add(neckGroup);
      const neck = createPart('neck', new THREE.CylinderGeometry(0.04, 0.05, 0.1, 24), mats.skin, neckGroup);
      neck.position.y = 0.05;

      const headGroup = new THREE.Group();
      headGroup.position.y = 0.1;
      neckGroup.add(headGroup);
      const head = createPart('head', new THREE.CapsuleGeometry(0.09, 0.14, 8, 32), mats.skin, headGroup);
      head.position.y = 0.09;
      const nose = createPart('nose', new THREE.ConeGeometry(0.012, 0.03, 16), mats.skin, headGroup);
      nose.position.set(0, 0.08, 0.095);
      nose.rotateX(Math.PI/2);

      const createLimb = (side: 'left' | 'right', isLeg: boolean) => {
         const sign = side === 'left' ? -1 : 1;
         const root = new THREE.Group();
         const mid = new THREE.Group();
         const end = new THREE.Group();
         
         let upperName = isLeg ? `${side}Thigh` : `${side}UpperArm`;
         let lowerName = isLeg ? `${side}Shin` : `${side}Forearm`;
         let upperMesh, lowerMesh;

         if (isLeg) {
             root.position.set(sign * 0.15, -0.05, 0);
             pelvis.add(root);
             createPart(`${side}HipJoint`, new THREE.SphereGeometry(0.075, 32, 32), mats.joint, root);
             
             const thighG = new THREE.Group(); root.add(thighG);
             upperMesh = createPart(upperName, new THREE.CapsuleGeometry(0.115, 0.38, 8, 32), mats.clothesBot, thighG);
             upperMesh.position.y = -0.22;
             
             mid.position.y = -0.44; thighG.add(mid);
             createPart(`${side}Knee`, new THREE.SphereGeometry(0.065, 32, 32), mats.joint, mid);
             lowerMesh = createPart(lowerName, new THREE.CapsuleGeometry(0.085, 0.38, 8, 32), mats.clothesBot, mid);
             lowerMesh.position.y = -0.22;
             
             end.position.y = -0.44; mid.add(end);
             createPart(`${side}Ankle`, new THREE.SphereGeometry(0.055, 32, 32), mats.joint, end);
             const foot = createPart(`${side}Foot`, new THREE.BoxGeometry(0.08, 0.05, 0.22), mats.shoe, end);
             foot.position.set(0, -0.04, 0.06);
         } else {
             root.position.set(sign * 0.18, 0.10, 0);
             chestGroup.add(root);
             createPart(`${side}Shoulder`, new THREE.SphereGeometry(0.065, 32, 32), mats.joint, root);
             
             upperMesh = createPart(upperName, new THREE.CapsuleGeometry(0.065, 0.28, 8, 32), mats.clothesTop, root);
             upperMesh.position.y = -0.16;
             
             mid.position.y = -0.32; root.add(mid);
             createPart(`${side}Elbow`, new THREE.SphereGeometry(0.055, 32, 32), mats.joint, mid);
             lowerMesh = createPart(lowerName, new THREE.CapsuleGeometry(0.055, 0.24, 8, 32), mats.skin, mid);
             lowerMesh.position.y = -0.15;
             
             end.position.y = -0.28; mid.add(end);
             createPart(`${side}Wrist`, new THREE.SphereGeometry(0.045, 32, 32), mats.joint, end);
             const hand = createPart(`${side}Hand`, new THREE.BoxGeometry(0.04, 0.10, 0.08), mats.skin, end);
             hand.position.y = -0.06;
         }
         return { root, mid, end, upperMeshName: upperName, lowerMeshName: lowerName };
      };

      const lLeg = createLimb('left', true);
      const rLeg = createLimb('right', true);
      const lArm = createLimb('left', false);
      const rArm = createLimb('right', false);

      // Rig Object
      rigRef.current = {
         main: mannequin,
         pelvis, spine, chest: chestGroup, neck: neckGroup, head: headGroup,
         legs: { l: lLeg, r: rLeg },
         arms: { l: lArm, r: rArm },
         parts // Critical: Pass the parts dictionary to the engine
      };

      // Guide Lines
      const guidesGroup = new THREE.Group();
      scene.add(guidesGroup);
      
      const guideMat = new THREE.LineDashedMaterial({ 
          color: 0x00ffff, 
          dashSize: 0.4,   
          gapSize: 0.2,    
          transparent: true, 
          opacity: 1.0,    
          depthTest: false 
      });

      for(let i=0; i<3; i++) {
        const g = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), guideMat);
        g.visible = false;
        guidesGroup.add(g);
        guideLinesRef.current.push(g);
      }

      setIsLoading(false);

      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
           const { width, height } = entry.contentRect;
           if (width > 0 && renderer && camera) {
             renderer.setSize(width, height);
             camera.aspect = width / height;
             camera.updateProjectionMatrix();
           }
        }
      });
      resizeObserver.observe(mountRef.current);

      const animate = () => {
        animationId = requestAnimationFrame(animate);
        controls.update();

        // Always update breathing time
        breathTimeRef.current += 0.015;

        if (isPlayingRef.current) {
           timeRef.current += 0.03 * speedRef.current;
           if (timeRef.current > Math.PI * 2) timeRef.current -= Math.PI * 2;
           if (sliderRef.current && !isScrubbingRef.current) {
              sliderRef.current.value = ((timeRef.current / (Math.PI * 2)) * 100).toString();
           }
        }

        if (rigRef.current && matsRef.current) {
           guidesGroup.visible = showGuides;
           updateAnimationFrame(rigRef.current, matsRef.current, {
               time: timeRef.current,
               breathTime: breathTimeRef.current,
               visualTag,
               name: nameRef.current?.toLowerCase() || '',
               guideLines: guideLinesRef.current,
           });
        }

        renderer.render(scene, camera);
      };
      animate();

    } catch (err) {
      console.error(err);
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      if (rendererRef.current) {
         mountRef.current?.removeChild(rendererRef.current.domElement);
         rendererRef.current.dispose();
      }
    };
  }, [visualTag, showGuides, exerciseName]);

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
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-800 text-white text-xs rounded-lg border border-slate-700">Reload</button>
            </div>
        )}

        <div ref={mountRef} className="w-full h-full cursor-move" />
        
        {/* Camera Views */}
        <div className="hidden md:flex absolute top-4 right-4 flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-slate-900/60 backdrop-blur-md rounded-lg border border-white/10 p-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase px-2 py-1 flex items-center gap-1 border-b border-white/5 mb-1"><Eye size={10} /> Views</div>
                <div className="flex flex-col gap-0.5">
                    {['iso', 'front', 'side', 'top'].map(v => (
                        <button key={v} onClick={() => changeView(v as any)} className="px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:text-rose-300 hover:bg-white/10 rounded text-left capitalize">{v === 'iso' ? 'Default' : v}</button>
                    ))}
                </div>
            </div>
        </div>

        {/* Controls */}
        {!isLoading && !hasError && (
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent flex flex-col gap-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                {(exerciseName || description) && (
                  <div className="mb-1 text-white md:block hidden">
                      {exerciseName && <h4 className="font-bold text-sm shadow-black drop-shadow-md text-rose-100">{exerciseName}</h4>}
                  </div>
                )}
                <input ref={sliderRef} type="range" min="0" max="100" defaultValue="0" step="0.1" onChange={handleScrub} onMouseDown={handleScrubStart} onMouseUp={handleScrubEnd} onTouchStart={handleScrubStart} onTouchEnd={handleScrubEnd} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors border border-white/10">{isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}</button>
                        <button onClick={() => { timeRef.current = 0; if(sliderRef.current) sliderRef.current.value = "0"; }} className="p-1.5 text-slate-400 hover:text-white transition-colors"><RotateCcw size={16} /></button>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => setShowGuides(!showGuides)} className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border ${showGuides ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' : 'bg-white/10 text-slate-400 border-white/5'}`}><Layers size={12} /> <span className="hidden md:inline">Guides</span></button>
                        <button onClick={toggleSpeed} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-rose-300 border border-white/5 min-w-[2.5rem]">{speed}x</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ExerciseAnimation;
