'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSimulatorProps {
  activeAttack: string | null;
  currentStage: number;
  speed: number;
  wheelSpinSpeed: number;
  brakePressure: number;
}

export default function ThreeSimulator({
  activeAttack,
  currentStage,
  speed,
  wheelSpinSpeed,
  brakePressure
}: ThreeSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Refs to sync prop values dynamically without re-creating the WebGL context
  const activeAttackRef = useRef(activeAttack);
  const currentStageRef = useRef(currentStage);
  const speedRef = useRef(speed);
  const wheelSpinSpeedRef = useRef(wheelSpinSpeed);
  const brakePressureRef = useRef(brakePressure);

  useEffect(() => {
    activeAttackRef.current = activeAttack;
  }, [activeAttack]);

  useEffect(() => {
    currentStageRef.current = currentStage;
  }, [currentStage]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    wheelSpinSpeedRef.current = wheelSpinSpeed;
  }, [wheelSpinSpeed]);

  useEffect(() => {
    brakePressureRef.current = brakePressure;
  }, [brakePressure]);
  
  // Ref handles for animations
  const carGroupRef = useRef<THREE.Group | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);
  const roadLinesRef = useRef<THREE.Mesh[]>([]);
  const guardrailsRef = useRef<THREE.Group[]>([]);
  const underglowReflectionRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const smokeParticlesRef = useRef<THREE.Points | null>(null);
  const barrierRef = useRef<THREE.Mesh | null>(null);
  const signalPostRef = useRef<THREE.Group | null>(null);
  const signalLightsRef = useRef<{ red: THREE.Mesh; green: THREE.Mesh } | null>(null);
  const keyRingsRef = useRef<THREE.Mesh[]>([]);
  const v2xGridRef = useRef<THREE.GridHelper | null>(null);
  const headlightLBeamRef = useRef<THREE.SpotLight | null>(null);
  const headlightRBeamRef = useRef<THREE.SpotLight | null>(null);
  const alarmLightRef = useRef<THREE.PointLight | null>(null);
  const bridgePylonsRef = useRef<THREE.Group[]>([]);

  // Dynamic attack graphics and physics state refs
  const hackBeamRef = useRef<THREE.Line | null>(null);
  const packetSpheresRef = useRef<THREE.Mesh[]>([]);
  const dustParticlesRef = useRef<THREE.Points | null>(null);
  const dustVelsRef = useRef<number[]>([]);
  
  // Track previous frame values for acceleration/turning derivatives in physics
  const prevSpeedRef = useRef<number>(speed);
  const prevYawRef = useRef<number>(0);
  
  // Spring-mass suspension physics state
  const suspensionRef = useRef({
    pitch: 0,
    pitchVel: 0,
    roll: 0,
    rollVel: 0,
    yOffset: 0,
    yVel: 0
  });

  // Simulation parameters (smooth values)
  const animStates = useRef({
    carX: 0,
    carPitch: 0,
    carYaw: 0,
    carRoll: 0,
    carYOffset: 0,
    roadOffset: 0,
    shakeIntensity: 0,
    exhaustIntensity: 0,
    smokeIntensity: 0,
    barrierX: 12, // off road far away by default
    barrierOpacity: 0,
    signalZ: 15,
    keyRingScale: 0,
    keyRingOpacity: 0,
    v2xGridOpacity: 0,
    wheelTurnAngle: 0,
    guardrailOffset: 0,
    pylonOffset: 0
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 280;

    // 1. Scene setup: Scenic Sunset Sky Bridge (fixes dark rendering issue)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xff9e7d); // Beautiful warm sunset sky pastel orange
    scene.fog = new THREE.FogExp2(0xff9e7d, 0.022); // Warm sunset haze

    // 2. Camera setup - premium close-up diagonal chase camera view
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(-4.0, 2.3, 6.2);
    camera.lookAt(new THREE.Vector3(0.3, 0.45, -0.4));
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.borderRadius = '12px';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Dual-Tone Studio Lighting (brightens metallic car panels & adds premium highlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25); // Strong bright fill light
    scene.add(ambientLight);

    // Warm Sunset Key Light (low angle)
    const sunLight = new THREE.DirectionalLight(0xffab7a, 2.5);
    sunLight.position.set(-8, 5, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 30;
    const d = 5;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Cool Sky-Blue Fill Light (opposite angle to create beautiful specular gradients)
    const skyLight = new THREE.DirectionalLight(0xb0e0e6, 1.8);
    skyLight.position.set(8, 8, -5);
    scene.add(skyLight);

     // Pinkish sunset horizon backlight
    const tailReflectLight = new THREE.DirectionalLight(0xff7a8a, 0.85);
    tailReflectLight.position.set(2, 3, -8);
    scene.add(tailReflectLight);

    // Glowing Sunset Sun in the background
    const sunGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffa07a, fog: false });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(28, 8, -48);
    scene.add(sun);

    // Procedural Road Texture Canvas
    const createRoadTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Base concrete grey
        ctx.fillStyle = '#e4e4e7'; // Light zinc-200 concrete
        ctx.fillRect(0, 0, 512, 1024);
        
        // Add noise/grain for concrete texture
        ctx.fillStyle = '#cbcbcd';
        for (let i = 0; i < 25000; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 1024;
          const size = Math.random() * 1.5;
          ctx.fillRect(x, y, size, size);
        }

        // Add longitudinal concrete slab grooves
        ctx.strokeStyle = '#a1a1aa';
        ctx.lineWidth = 3;
        for (let x = 64; x < 512; x += 128) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 1024);
          ctx.stroke();
        }

        // Add dark tire skid marks for realism
        ctx.fillStyle = 'rgba(9, 9, 11, 0.05)';
        // Center-left and center-right tire tracks
        ctx.fillRect(96, 0, 40, 1024);
        ctx.fillRect(376, 0, 40, 1024);

        // Subtly darken edges (vignette gradient)
        const gradient = ctx.createLinearGradient(0, 0, 512, 0);
        gradient.addColorStop(0, 'rgba(0,0,0,0.18)');
        gradient.addColorStop(0.12, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.88, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.18)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 1024);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 6);
      return texture;
    };

    const roadTexture = createRoadTexture();

    // 5. Road Ground Plane: Textured Light Concrete Highway
    const roadGeo = new THREE.PlaneGeometry(12, 100);
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.52,
      metalness: 0.12
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    road.receiveShadow = true;
    scene.add(road);

    // Shoulders
    const shoulderLGeo = new THREE.PlaneGeometry(10, 100);
    const shoulderLMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa, // zinc-400 slightly darker concrete
      roughness: 0.5,
      metalness: 0.1
    });
    const shoulderL = new THREE.Mesh(shoulderLGeo, shoulderLMat);
    shoulderL.rotation.x = -Math.PI / 2;
    shoulderL.position.set(-11, -0.01, 0);
    scene.add(shoulderL);

    const shoulderR = new THREE.Mesh(shoulderLGeo, shoulderLMat);
    shoulderR.rotation.x = -Math.PI / 2;
    shoulderR.position.set(11, -0.01, 0);
    scene.add(shoulderR);

    // 6. Dashed road divider lines (yellow center)
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    const laneDashGeo = new THREE.PlaneGeometry(0.12, 2.5);
    const laneDashMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });

    const totalLines = 14;
    const localRoadLines: THREE.Mesh[] = [];
    for (let i = 0; i < totalLines; i++) {
      const lineMesh = new THREE.Mesh(laneDashGeo, laneDashMat);
      lineMesh.rotation.x = -Math.PI / 2;
      const zPos = -50 + (i * (70 / totalLines));
      lineMesh.position.set(0, 0.01, zPos);
      lineGroup.add(lineMesh);
      localRoadLines.push(lineMesh);
    }
    roadLinesRef.current = localRoadLines;

    // Solid white side lines
    const sideLineGeo = new THREE.PlaneGeometry(0.08, 100);
    const sideLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const sideLineL = new THREE.Mesh(sideLineGeo, sideLineMat);
    sideLineL.rotation.x = -Math.PI / 2;
    sideLineL.position.set(-2.0, 0.008, 0);
    scene.add(sideLineL);

    const sideLineR = new THREE.Mesh(sideLineGeo, sideLineMat);
    sideLineR.rotation.x = -Math.PI / 2;
    sideLineR.position.set(2.0, 0.008, 0);
    scene.add(sideLineR);

    // 7. BUILD EXTREMELY DETAILED MAHINDRA BE 6e (CRIMSON RED & GLOSS BLACK DUAL-TONE COUPE-SUV)
    const carGroup = new THREE.Group();
    carGroup.position.set(0, 0.12, 0);
    scene.add(carGroup);
    carGroupRef.current = carGroup;

    // Materials Configuration
    // Primary Body Paint: Vibrant Crimson Red-Orange EV Paint (BE 6e look)
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: 0xfa3a10, // Sunset red-orange
      metalness: 0.8,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    // Secondary Accent Paint: Gloss Black (Dual-tone floating roof, pillars, side claddings, diffusers)
    const blackGlossMat = new THREE.MeshPhysicalMaterial({
      color: 0x09090b, // zinc-950
      metalness: 0.95,
      roughness: 0.04,
      clearcoat: 1.0
    });

    // Under-chassis & Cladding trim: Matte Dark Charcoal
    const claddingMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
      metalness: 0.1
    });

    // Chrome Trim
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      metalness: 1.0,
      roughness: 0.03
    });

    // Glowing LED lights
    const ledCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ledRedMat = new THREE.MeshBasicMaterial({ color: 0xff1040 });
    const ledAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const ledWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Glass Windows
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x01040a,
      metalness: 0.98,
      roughness: 0.01,
      transparent: true,
      opacity: 0.85
    });

    // 7a. Under-chassis cladding base plate
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.12, 3.4), claddingMat);
    basePlate.position.y = 0.08;
    basePlate.castShadow = true;
    basePlate.receiveShadow = true;
    carGroup.add(basePlate);

    const bodyGroup = new THREE.Group();
    carGroup.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    // Alarm interior light (pulses on threat)
    const alarmLight = new THREE.PointLight(0xff0000, 0, 3.5);
    alarmLight.position.set(0, 0.65, -0.3);
    carGroup.add(alarmLight);
    alarmLightRef.current = alarmLight;

    // 7b. Passenger Cabin Tub (Rounded Central EV Fuselage)
    const centralTub = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 16), paintMat);
    centralTub.scale.set(0.98, 0.55, 2.3);
    centralTub.position.set(0, 0.28, -0.1);
    centralTub.castShadow = true;
    centralTub.receiveShadow = true;
    bodyGroup.add(centralTub);

    // 7c. Tapered EV Hood (slopes down smoothly to nose)
    const hoodCapsule = new THREE.Mesh(new THREE.SphereGeometry(0.68, 32, 16), paintMat);
    hoodCapsule.scale.set(0.96, 0.44, 1.4);
    hoodCapsule.position.set(0, 0.26, 0.7);
    hoodCapsule.castShadow = true;
    bodyGroup.add(hoodCapsule);

    // Muscular fender ridges scaled to create smooth side arches
    const fenderL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), paintMat);
    fenderL.scale.set(0.8, 1.0, 3.0);
    fenderL.position.set(-0.55, 0.36, 0.75);
    fenderL.castShadow = true;
    bodyGroup.add(fenderL);

    const fenderR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), paintMat);
    fenderR.scale.set(0.8, 1.0, 3.0);
    fenderR.position.set(0.55, 0.36, 0.75);
    fenderR.castShadow = true;
    bodyGroup.add(fenderR);

    // 7d. Curved Closed EV Front Nose
    const noseCurve = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.32, 24), paintMat);
    noseCurve.rotation.z = Math.PI / 2;
    noseCurve.position.set(0, 0.24, 1.34);
    noseCurve.castShadow = true;
    bodyGroup.add(noseCurve);

    // Front spoiler splitter (sculpted gloss-black bottom tray)
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.05, 0.32), blackGlossMat);
    splitter.position.set(0, 0.08, 1.38);
    bodyGroup.add(splitter);

    // Front EV mask panel overlay
    const frontMask = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.04), blackGlossMat);
    frontMask.position.set(0, 0.26, 1.42);
    bodyGroup.add(frontMask);

    // 7e. Seamless Glass Canopy Bubble (Unified transparent canopy)
    const canopyBubble = new THREE.Mesh(new THREE.SphereGeometry(0.68, 32, 24), glassMat);
    canopyBubble.scale.set(0.85, 0.58, 2.2);
    canopyBubble.position.set(0, 0.52, -0.3);
    canopyBubble.castShadow = true;
    bodyGroup.add(canopyBubble);

    // Floating black roof plate matching the canopy curve
    const roofPlate = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.03, 1.3), blackGlossMat);
    roofPlate.position.set(0, 0.80, -0.4);
    roofPlate.rotation.x = -0.05;
    roofPlate.castShadow = true;
    bodyGroup.add(roofPlate);

    // Sleek windshield framing pillars (Thinner & premium)
    const pillarRadius = 0.008;

    const pillarFrontL = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius, pillarRadius, 0.76, 8), blackGlossMat);
    pillarFrontL.position.set(-0.50, 0.58, 0.3);
    pillarFrontL.rotation.x = -0.65;
    pillarFrontL.rotation.z = -0.15;
    bodyGroup.add(pillarFrontL);

    const pillarFrontR = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius, pillarRadius, 0.76, 8), blackGlossMat);
    pillarFrontR.position.set(0.50, 0.58, 0.3);
    pillarFrontR.rotation.x = -0.65;
    pillarFrontR.rotation.z = 0.15;
    bodyGroup.add(pillarFrontR);

    const pillarRearL = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius * 1.5, pillarRadius * 1.5, 0.9, 8), blackGlossMat);
    pillarRearL.position.set(-0.46, 0.52, -1.0);
    pillarRearL.rotation.x = 0.5;
    pillarRearL.rotation.z = -0.08;
    bodyGroup.add(pillarRearL);

    const pillarRearR = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius * 1.5, pillarRadius * 1.5, 0.9, 8), blackGlossMat);
    pillarRearR.position.set(0.46, 0.52, -1.0);
    pillarRearR.rotation.x = 0.5;
    pillarRearR.rotation.z = 0.08;
    bodyGroup.add(pillarRearR);

    // 7f. Tapered Rounded Rear Tailgate & Spoiler
    const rearTail = new THREE.Mesh(new THREE.SphereGeometry(0.66, 32, 16), paintMat);
    rearTail.scale.set(0.96, 0.46, 1.1);
    rearTail.position.set(0, 0.24, -1.2);
    rearTail.castShadow = true;
    bodyGroup.add(rearTail);

    // Aerodynamic Rear Sport Spoiler (floating double wing style)
    const spoilerBaseL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.08), blackGlossMat);
    spoilerBaseL.position.set(-0.45, 0.56, -1.45);
    spoilerBaseL.rotation.x = 0.2;
    bodyGroup.add(spoilerBaseL);

    const spoilerBaseR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.08), blackGlossMat);
    spoilerBaseR.position.set(0.45, 0.56, -1.45);
    spoilerBaseR.rotation.x = 0.2;
    bodyGroup.add(spoilerBaseR);

    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.02, 0.22), blackGlossMat);
    spoilerWing.position.set(0, 0.63, -1.48);
    spoilerWing.rotation.x = 0.15;
    spoilerWing.castShadow = true;
    bodyGroup.add(spoilerWing);

    // Black taillight backing plate
    const tailPlate = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.18, 0.04), blackGlossMat);
    tailPlate.position.set(0, 0.32, -1.62);
    bodyGroup.add(tailPlate);

    // 7g. Signature Front C-DRLs & Bumper Skid LEDs
    // Front Left Headlight
    const cHeadLGroup = new THREE.Group();
    cHeadLGroup.position.set(-0.65, 0.28, 1.42);
    bodyGroup.add(cHeadLGroup);
    cHeadLGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), ledCyanMat));
    const headTopL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), ledCyanMat);
    headTopL.position.set(0.04, 0.09, 0);
    cHeadLGroup.add(headTopL);
    const headBotL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), ledCyanMat);
    headBotL.position.set(0.04, -0.09, 0);
    cHeadLGroup.add(headBotL);

    // Front Right Headlight
    const cHeadRGroup = new THREE.Group();
    cHeadRGroup.position.set(0.65, 0.28, 1.42);
    bodyGroup.add(cHeadRGroup);
    cHeadRGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), ledCyanMat));
    const headTopR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), ledCyanMat);
    headTopR.position.set(-0.04, 0.09, 0);
    cHeadRGroup.add(headTopR);
    const headBotR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), ledCyanMat);
    headBotR.position.set(-0.04, -0.09, 0);
    cHeadRGroup.add(headBotR);

    // Front Bumper Skid LED Bar
    const skidBar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.03), ledCyanMat);
    skidBar.position.set(0, 0.08, 1.44);
    bodyGroup.add(skidBar);

    // 7h. Rear C-Taillights & LED Center Strip
    // Rear Left Taillight
    const cTailLGroup = new THREE.Group();
    cTailLGroup.position.set(-0.64, 0.34, -1.67);
    bodyGroup.add(cTailLGroup);
    cTailLGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), ledRedMat));
    const tailTopL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), ledRedMat);
    tailTopL.position.set(0.04, 0.08, 0);
    cTailLGroup.add(tailTopL);
    const tailBotL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), ledRedMat);
    tailBotL.position.set(0.04, -0.08, 0);
    cTailLGroup.add(tailBotL);

    // Rear Right Taillight
    const cTailRGroup = new THREE.Group();
    cTailRGroup.position.set(0.64, 0.34, -1.67);
    bodyGroup.add(cTailRGroup);
    cTailRGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), ledRedMat));
    const tailTopR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), ledRedMat);
    tailTopR.position.set(-0.04, 0.08, 0);
    cTailRGroup.add(tailTopR);
    const tailBotR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), ledRedMat);
    tailBotR.position.set(-0.04, -0.08, 0);
    cTailRGroup.add(tailBotR);

    // Horizontal tail light linking strip
    const rearStrip = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.015, 0.015), ledRedMat);
    rearStrip.position.set(0, 0.42, -1.68);
    bodyGroup.add(rearStrip);

    // 7i. Rear Diffuser & Side Skirts
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.12, 0.25), blackGlossMat);
    diffuser.position.set(0, 0.08, -1.58);
    bodyGroup.add(diffuser);

    const sideSkirtL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 2.0), blackGlossMat);
    sideSkirtL.position.set(-0.71, 0.08, -0.1);
    bodyGroup.add(sideSkirtL);

    const sideSkirtR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 2.0), blackGlossMat);
    sideSkirtR.position.set(0.71, 0.08, -0.1);
    bodyGroup.add(sideSkirtR);

    // 7j. Curved Hollow Wheel Arch Claddings (wrap over tires cleanly!)
    const archShape = new THREE.Shape();
    archShape.absarc(0, 0, 0.42, 0, Math.PI, false); // Outer curve
    archShape.absarc(0, 0, 0.36, Math.PI, 0, true);  // Inner cutout for wheel
    
    const archGeo = new THREE.ExtrudeGeometry(archShape, {
      depth: 0.16, // Protrusion width
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.01
    });
    archGeo.center();

    const archPositions = [
      [-0.7, 0.26, 1.05],  // Front Left
      [0.7, 0.26, 1.05],   // Front Right
      [-0.7, 0.26, -1.05], // Rear Left
      [0.7, 0.26, -1.05]   // Rear Right
    ];

    archPositions.forEach((pos) => {
      const arch = new THREE.Mesh(archGeo, blackGlossMat);
      arch.rotation.y = Math.PI / 2; // Face side of car
      arch.position.set(pos[0], pos[1], pos[2]);
      bodyGroup.add(arch);
    });

    // 7k. Aerodynamic Side Mirrors
    const mirrorLGroup = new THREE.Group();
    mirrorLGroup.position.set(-0.74, 0.62, 0.15);
    bodyGroup.add(mirrorLGroup);
    mirrorLGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), claddingMat));
    const mCapL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.08), paintMat);
    mCapL.position.set(-0.08, 0.01, 0);
    mirrorLGroup.add(mCapL);

    const mirrorRGroup = new THREE.Group();
    mirrorRGroup.position.set(0.74, 0.62, 0.15);
    bodyGroup.add(mirrorRGroup);
    mirrorRGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), claddingMat));
    const mCapR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.08), paintMat);
    mCapR.position.set(0.08, 0.01, 0);
    mirrorRGroup.add(mCapR);

    // 7l. High-Fidelity Rounded EV Alloy Wheels (Torus shoulder edges + 5-spoke Turbine covers)
    const tireTreadGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.14, 24);
    const tireTreadMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.85 });
    const shoulderGeo = new THREE.TorusGeometry(0.31, 0.04, 8, 24);
    const rimBaseGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.16, 16);
    const chromeAeroGeo = new THREE.TorusGeometry(0.22, 0.008, 4, 24);
    const spokeGeo = new THREE.BoxGeometry(0.055, 0.17, 0.015);
    const wedgeGeo = new THREE.BoxGeometry(0.045, 0.13, 0.01);
    const innerRingGeo = new THREE.TorusGeometry(0.05, 0.006, 4, 12);

    const wheelPositions = [
      [-0.67, 0.26, 1.05],  // Front Left (tucked inward slightly from 0.75)
      [0.67, 0.26, 1.05],   // Front Right
      [-0.67, 0.26, -1.05], // Rear Left
      [0.67, 0.26, -1.05]   // Rear Right
    ];

    const localWheels: THREE.Mesh[] = [];

    wheelPositions.forEach((pos) => {
      // Base rolling assembly
      const wheelAssembly = new THREE.Mesh(tireTreadGeo, tireTreadMat);
      wheelAssembly.rotation.z = Math.PI / 2;
      wheelAssembly.position.set(pos[0], pos[1], pos[2]);
      wheelAssembly.castShadow = true;

      // Rounded outer shoulder tire tread
      const shL = new THREE.Mesh(shoulderGeo, tireTreadMat);
      shL.position.y = -0.07;
      shL.rotation.x = Math.PI / 2;
      wheelAssembly.add(shL);

      // Rounded inner shoulder tire tread
      const shR = new THREE.Mesh(shoulderGeo, tireTreadMat);
      shR.position.y = 0.07;
      shR.rotation.x = Math.PI / 2;
      wheelAssembly.add(shR);

      // Dark Rim insert
      const rim = new THREE.Mesh(rimBaseGeo, blackGlossMat);
      rim.rotation.x = Math.PI / 2;
      // Align rim to face the exterior side of the car
      rim.position.y = pos[0] > 0 ? 0.075 : -0.075;
      wheelAssembly.add(rim);

      // Silver alloy border ring
      const alloyBorder = new THREE.Mesh(chromeAeroGeo, chromeMat);
      alloyBorder.position.y = 0.081;
      alloyBorder.rotation.x = Math.PI / 2;
      rim.add(alloyBorder);

      // 5 turbine silver spokes
      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(spokeGeo, chromeMat);
        const angle = (s * Math.PI * 2) / 5;
        spoke.position.x = Math.cos(angle) * 0.12;
        spoke.position.z = Math.sin(angle) * 0.12;
        spoke.rotation.y = -angle + 0.28; // Turbine blade twist
        spoke.position.y = 0.082;
        rim.add(spoke);
      }

      // 5 black gloss aerodynamical accent wedges
      for (let s = 0; s < 5; s++) {
        const wedge = new THREE.Mesh(wedgeGeo, blackGlossMat);
        const angle = (s * Math.PI * 2) / 5 + (Math.PI / 5);
        wedge.position.x = Math.cos(angle) * 0.12;
        wedge.position.z = Math.sin(angle) * 0.12;
        wedge.rotation.y = -angle + 0.28;
        wedge.position.y = 0.0815;
        rim.add(wedge);
      }

      // Cyber center hub highlight ring
      const cyberRing = new THREE.Mesh(innerRingGeo, ledCyanMat);
      cyberRing.position.y = 0.083;
      cyberRing.rotation.x = Math.PI / 2;
      rim.add(cyberRing);

      carGroup.add(wheelAssembly);
      localWheels.push(wheelAssembly);
    });
    wheelsRef.current = localWheels;

    // 8. EV Cyber blue Underglow reflection on concrete road
    const reflectGeo = new THREE.PlaneGeometry(1.7, 3.8);
    const reflectMat = new THREE.MeshBasicMaterial({
      color: 0x00d0ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const underglowReflect = new THREE.Mesh(reflectGeo, reflectMat);
    underglowReflect.rotation.x = -Math.PI / 2;
    underglowReflect.position.set(0, 0.006, 0);
    scene.add(underglowReflect);
    underglowReflectionRef.current = underglowReflect;

    // Headlight Spotlights projecting onto road
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.5, 0, 8);
    carGroup.add(targetL);

    const targetR = new THREE.Object3D();
    targetR.position.set(0.5, 0, 8);
    carGroup.add(targetR);

    const headlightL = new THREE.SpotLight(0x00f0ff, 4.0, 16, Math.PI / 4.8, 0.45, 1);
    headlightL.position.set(-0.5, 0.28, 1.5);
    headlightL.target = targetL;
    headlightL.castShadow = true;
    carGroup.add(headlightL);
    headlightLBeamRef.current = headlightL;

    const headlightR = new THREE.SpotLight(0x00f0ff, 4.0, 16, Math.PI / 4.8, 0.45, 1);
    headlightR.position.set(0.5, 0.28, 1.5);
    headlightR.target = targetR;
    headlightR.castShadow = true;
    carGroup.add(headlightR);
    headlightRBeamRef.current = headlightR;

    // 8.5. BUILD MASSIVE SUNSET BRIDGE PYLONS & PARALLAX SUSPENSION CABLES
    const totalPylons = 3;
    const localPylons: THREE.Group[] = [];
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x1f1f23, // Dark grey concrete
      roughness: 0.65,
      metalness: 0.75
    });
    const cableLedMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 }); // Glowing red cables matching sunset vibe

    for (let i = 0; i < totalPylons; i++) {
      const pylonGroup = new THREE.Group();
      const zPos = -45 + (i * 35);
      pylonGroup.position.set(0, 0, zPos);

      // Left Pillar (leaning slightly inwards)
      const leftCol = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9.0, 0.5), pylonMat);
      leftCol.position.set(-5.6, 4.5, 0);
      leftCol.rotation.z = 0.05;
      pylonGroup.add(leftCol);

      // Right Pillar (leaning slightly inwards)
      const rightCol = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9.0, 0.5), pylonMat);
      rightCol.position.set(5.6, 4.5, 0);
      rightCol.rotation.z = -0.05;
      pylonGroup.add(rightCol);

      // High crossbeam
      const beam1 = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.4, 0.4), pylonMat);
      beam1.position.set(0, 8.0, 0);
      pylonGroup.add(beam1);

      // Middle crossbeam
      const beam2 = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.4, 0.4), pylonMat);
      beam2.position.set(0, 4.5, 0);
      pylonGroup.add(beam2);

      // Glowing Neon Cable lines on pylon legs
      const ledCableL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 9.05, 0.04), cableLedMat);
      ledCableL.position.set(-5.6, 4.5, 0.02);
      ledCableL.rotation.z = 0.05;
      pylonGroup.add(ledCableL);

      const ledCableR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 9.05, 0.04), cableLedMat);
      ledCableR.position.set(5.6, 4.5, 0.02);
      ledCableR.rotation.z = -0.05;
      pylonGroup.add(ledCableR);

      // Thin diagonal suspension cables going to the road deck
      const cablePoints = [];
      cablePoints.push(new THREE.Vector3(-5.5, 8.0, 0));
      cablePoints.push(new THREE.Vector3(-3.2, 0, 15));
      cablePoints.push(new THREE.Vector3(-5.5, 8.0, 0));
      cablePoints.push(new THREE.Vector3(-3.2, 0, -15));
      cablePoints.push(new THREE.Vector3(5.5, 8.0, 0));
      cablePoints.push(new THREE.Vector3(3.2, 0, 15));
      cablePoints.push(new THREE.Vector3(5.5, 8.0, 0));
      cablePoints.push(new THREE.Vector3(3.2, 0, -15));

      const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
      const cableLineMat = new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.35 });
      const cables = new THREE.LineSegments(cableGeo, cableLineMat);
      pylonGroup.add(cables);

      scene.add(pylonGroup);
      localPylons.push(pylonGroup);
    }
    bridgePylonsRef.current = localPylons;

    // 9. Side safety concrete guardrails zipping past (sunset design)
    const totalGuardrails = 8;
    const localGuardrails: THREE.Group[] = [];
    const guardrailPostGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6);
    const guardrailBeamGeo = new THREE.BoxGeometry(0.1, 0.09, 10.0);
    
    // Light grey concrete material for guardrails
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, roughness: 0.4, metalness: 0.1 });

    for (let i = 0; i < totalGuardrails; i++) {
      // Left rail segment
      const railGroupL = new THREE.Group();
      const zPos = -50 + (i * (70 / totalGuardrails));
      railGroupL.position.set(-3.2, 0, zPos);
      
      const postL = new THREE.Mesh(guardrailPostGeo, railMat);
      postL.position.y = 0.27;
      postL.castShadow = true;
      railGroupL.add(postL);

      const beamL = new THREE.Mesh(guardrailBeamGeo, railMat);
      beamL.position.y = 0.42;
      beamL.castShadow = true;
      railGroupL.add(beamL);

      // Neon glowing yellow indicator tube on rails
      const neonL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 10.0), ledAmberMat);
      neonL.position.set(0.06, 0.42, 0);
      railGroupL.add(neonL);

      scene.add(railGroupL);
      localGuardrails.push(railGroupL);

      // Right rail segment
      const railGroupR = new THREE.Group();
      railGroupR.position.set(3.2, 0, zPos);

      const postR = new THREE.Mesh(guardrailPostGeo, railMat);
      postR.position.y = 0.27;
      postR.castShadow = true;
      railGroupR.add(postR);

      const beamR = new THREE.Mesh(guardrailBeamGeo, railMat);
      beamR.position.y = 0.42;
      beamR.castShadow = true;
      railGroupR.add(beamR);

      const neonR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 10.0), ledAmberMat);
      neonR.position.set(-0.06, 0.42, 0);
      railGroupR.add(neonR);

      scene.add(railGroupR);
      localGuardrails.push(railGroupR);
    }
    guardrailsRef.current = localGuardrails;

    // 10. Spark Particles (electric power surge emitter)
    const particleCount = 75;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.2;
      positions[i * 3 + 1] = 0.06 + (Math.random() - 0.5) * 0.03;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      velocities.push(
        (Math.random() - 0.5) * 1.5,
        0.3 + Math.random() * 1.2,
        5.0 + Math.random() * 8.0
      );
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.15,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 11. Tire Lockup Smoke Particles (Thicker & Faster for 100x realism)
    const smokeCount = 120;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    const smokeVels: number[] = [];

    for (let i = 0; i < smokeCount; i++) {
      smokePos[i * 3] = (Math.random() - 0.5) * 1.6;
      smokePos[i * 3 + 1] = 0.08 + Math.random() * 0.15;
      smokePos[i * 3 + 2] = -0.5 + (Math.random() - 0.5) * 1.5;

      smokeVels.push(
        (Math.random() - 0.5) * 1.2, // wider drift
        0.5 + Math.random() * 1.2,   // faster drift up
        0.8 + Math.random() * 3.0    // faster drift back
      );
    }

    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0xd1d5db, // Light grey smoke
      size: 0.45,     // Puffy smoke clouds
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending
    });
    const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    scene.add(smokeParticles);
    smokeParticlesRef.current = smokeParticles;

    // 12. LiDAR Warning Red hologram obstacle wall
    const barrierGeo = new THREE.BoxGeometry(4.2, 1.4, 0.4);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0,
      roughness: 0.05,
      metalness: 0.1,
      emissive: 0xdc2626,
      emissiveIntensity: 0.7
    });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.set(0, 0.7, -4.5);
    scene.add(barrier);
    barrierRef.current = barrier;

    const barrierEdges = new THREE.EdgesGeometry(barrierGeo);
    const barrierLineMat = new THREE.LineBasicMaterial({ color: 0xff3b30, linewidth: 2.5, transparent: true, opacity: 0 });
    const barrierLine = new THREE.LineSegments(barrierEdges, barrierLineMat);
    barrier.add(barrierLine);

    // 13. Smart Traffic Light structure (V2X signals)
    const trafficLightGroup = new THREE.Group();
    trafficLightGroup.position.set(2.6, 0, -8);
    scene.add(trafficLightGroup);
    signalPostRef.current = trafficLightGroup;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), claddingMat);
    post.position.y = 1.2;
    post.castShadow = true;
    trafficLightGroup.add(post);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), claddingMat);
    arm.position.set(-0.35, 2.2, 0);
    trafficLightGroup.add(arm);

    const sigHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.65, 0.22), claddingMat);
    sigHead.position.set(-0.7, 2.1, 0);
    trafficLightGroup.add(sigHead);

    const bulbR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0x450a0a }));
    bulbR.position.set(-0.7, 2.28, 0.1);
    trafficLightGroup.add(bulbR);

    const bulbG = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0x064e3b }));
    bulbG.position.set(-0.7, 1.92, 0.1);
    trafficLightGroup.add(bulbG);

    signalLightsRef.current = { red: bulbR, green: bulbG };

    // 14. V2X intersection red alarm grid lines
    const v2xGrid = new THREE.GridHelper(12, 10, 0xdc2626, 0xdc2626);
    v2xGrid.position.set(0, 0.015, -8);
    (v2xGrid.material as THREE.Material).transparent = true;
    (v2xGrid.material as THREE.Material).opacity = 0;
    scene.add(v2xGrid);
    v2xGridRef.current = v2xGrid;

    // 15. Keyfob Expanding Signal waves
    const keyRingsGroup = new THREE.Group();
    scene.add(keyRingsGroup);

    const ringGeo = new THREE.RingGeometry(0.1, 0.12, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    const localRings: THREE.Mesh[] = [];
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(ringGeo, ringMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.06;
      keyRingsGroup.add(ring);
      localRings.push(ring);
    }
    keyRingsRef.current = localRings;

    // 15.5. Hacking Laser Beam & Floating Data Packets (V2X signals)
    const beamPoints = [new THREE.Vector3(), new THREE.Vector3()];
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
    const beamMat = new THREE.LineBasicMaterial({
      color: 0xff0055,
      linewidth: 3,
      transparent: true,
      opacity: 0
    });
    const hackBeam = new THREE.Line(beamGeo, beamMat);
    scene.add(hackBeam);
    hackBeamRef.current = hackBeam;

    const packetGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xff0044, transparent: true, opacity: 0 });
    const localPackets: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Mesh(packetGeo, packetMat.clone());
      scene.add(p);
      localPackets.push(p);
    }
    packetSpheresRef.current = localPackets;

    // 15.6. Off-road Dirt/Dust Particles Emitter
    const dustCount = 50;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVels: number[] = [];
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = 0;
      dustPositions[i * 3 + 1] = -100; // hide
      dustPositions[i * 3 + 2] = 0;
      dustVels.push(
        (Math.random() - 0.5) * 1.2, // wide dispersion
        0.4 + Math.random() * 0.8,   // upward dispersion
        2.0 + Math.random() * 3.5    // backward dispersion
      );
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x9f7a5c, // sandy brown/dirt
      size: 0.35,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);
    dustParticlesRef.current = dustParticles;
    dustVelsRef.current = dustVels;

    // 16. ANIMATION LOOP WITH HIGH FIDELITY PHYSICS
    let lastTime = 0;
    const animate = (time: number) => {
      // Clamped delta integration step to prevent first-frame/lag numerical explosions!
      let delta = (time - lastTime) * 0.001;
      if (lastTime === 0 || delta > 0.1) {
        delta = 0.016; // default 60fps frame delta
      }
      lastTime = time;

      // Target physics variables
      let targetX = 0;
      let targetPitch = 0;
      let targetYaw = 0;
      let targetRoll = 0;
      let targetSpeedMultiplier = speedRef.current / 65.0;
      let shakeVal = 0;
      let exhaustVal = 0;
      let smokeVal = 0;
      let barrierTargetX = 12;
      let barrierTargetOpacity = 0;
      let signalTargetZ = animStates.current.signalZ;
      let signalRedActive = false;
      let v2xGridTargetOpacity = 0;
      let ringScaleTarget = 0;
      let ringOpacityTarget = 0;
      let steeringAngle = 0;
      let underglowColorHex = 0x00d0ff; // Cyan underglow normally
      let underglowGlowOpacity = 0.15;

      // Pitch dip derived directly from brakePressure spikes (slam braking effect)
      targetPitch = -0.16 * (brakePressureRef.current / 100);

      // Handle attacks and visual cues
      if (activeAttackRef.current === 'gps_spoofing') {
        if (currentStageRef.current === 2) {
          targetX = -0.8;
          targetYaw = 0.08;
          targetRoll = 0.04;
          steeringAngle = -0.15; // turn wheels left
        } else if (currentStageRef.current === 3) {
          // erratically swerve across road lanes
          targetX = Math.sin(time * 0.0055) * 1.8;
          targetYaw = Math.cos(time * 0.0055) * 0.28;
          targetRoll = Math.cos(time * 0.0055) * 0.12;
          steeringAngle = Math.cos(time * 0.0055) * 0.45;
          underglowColorHex = 0xff9f00; // Orange warning underglow
        } else if (currentStageRef.current >= 4) {
          targetX = 0;
        }
      } else if (activeAttackRef.current === 'can_bus') {
        if (currentStageRef.current === 2) {
          targetSpeedMultiplier = 1.7;
          exhaustVal = 0.45; 
        } else if (currentStageRef.current === 3) {
          targetSpeedMultiplier = 3.0;
          shakeVal = 0.065; // vibrate chassis
          exhaustVal = 1.0;  // fire electric sparks
          underglowColorHex = 0xff0044; // Red hot underglow
          underglowGlowOpacity = 0.35;
        } else if (currentStageRef.current >= 4) {
          targetSpeedMultiplier = currentStageRef.current === 6 ? 0.3 : 0.8;
          exhaustVal = 0.05;
        }
      } else if (activeAttackRef.current === 'sensor_spoofing') {
        if (currentStageRef.current === 2) {
          barrierTargetX = 0;
          barrierTargetOpacity = 0.7;
        } else if (currentStageRef.current === 3) {
          barrierTargetX = 0;
          barrierTargetOpacity = 1.0;
          targetSpeedMultiplier = 0.0;
          smokeVal = 1.0; // heavy tyre smoke
          underglowColorHex = 0xdc2626; // solid Red underglow
          underglowGlowOpacity = 0.4;
        } else if (currentStageRef.current >= 4) {
          barrierTargetX = 12;
          barrierTargetOpacity = 0;
        }
      } else if (activeAttackRef.current === 'theft_attempt') {
        if (currentStageRef.current >= 2 && currentStageRef.current <= 3) {
          ringScaleTarget = 1 + (time * 0.004) % 4.5;
          ringOpacityTarget = 1.0 - (ringScaleTarget / 5.5);
          shakeVal = 0.012;
          underglowColorHex = 0xdc2626;
          underglowGlowOpacity = 0.3;
        }
      } else if (activeAttackRef.current === 'fake_traffic_signal') {
        if (currentStageRef.current >= 2) {
          signalRedActive = true;
          v2xGridTargetOpacity = 0.4;
        }
        if (currentStageRef.current === 3) {
          targetSpeedMultiplier = 2.4; 
          v2xGridTargetOpacity = 0.85; 
          underglowColorHex = 0xff0044;
        }
      }

      // Force straight-centered targets for Stage 6 to prevent visual misalignment across all attacks
      if (currentStageRef.current === 6) {
        targetX = 0;
        targetYaw = 0;
        targetRoll = 0;
        steeringAngle = 0;
      }

      // Smoothly interpolate values
      animStates.current.carX += (targetX - animStates.current.carX) * 0.08;
      animStates.current.carPitch += (targetPitch - animStates.current.carPitch) * 0.15;
      animStates.current.carYaw += (targetYaw - animStates.current.carYaw) * 0.08;
      animStates.current.carRoll += (targetRoll - animStates.current.carRoll) * 0.08;
      animStates.current.shakeIntensity += (shakeVal - animStates.current.shakeIntensity) * 0.15;
      animStates.current.exhaustIntensity += (exhaustVal - animStates.current.exhaustIntensity) * 0.08;
      animStates.current.smokeIntensity += (smokeVal - animStates.current.smokeIntensity) * 0.15;
      animStates.current.barrierX += (barrierTargetX - animStates.current.barrierX) * 0.15;
      animStates.current.barrierOpacity += (barrierTargetOpacity - animStates.current.barrierOpacity) * 0.15;
      animStates.current.v2xGridOpacity += (v2xGridTargetOpacity - animStates.current.v2xGridOpacity) * 0.1;
      animStates.current.wheelTurnAngle += (steeringAngle - animStates.current.wheelTurnAngle) * 0.15;

      // 1. Move road center dashes (forward direction)
      const roadSpeed = 28 * targetSpeedMultiplier * delta;
      animStates.current.roadOffset += roadSpeed;
      if (animStates.current.roadOffset > (70 / totalLines)) {
        animStates.current.roadOffset -= (70 / totalLines);
      }

      roadLinesRef.current.forEach((line, idx) => {
        let currentZ = -50 + (idx * (70 / totalLines)) + animStates.current.roadOffset;
        if (currentZ < -50) currentZ += 70;
        if (currentZ > 20) currentZ -= 70;
        line.position.z = currentZ;
      });

      // 2. Rotate and Turn Wheels
      const spinAngle = wheelSpinSpeedRef.current * 18 * targetSpeedMultiplier * delta;
      wheelsRef.current.forEach((w, idx) => {
        if (idx < 2) {
          w.rotation.y = animStates.current.wheelTurnAngle;
        }
        w.rotation.x -= spinAngle;
      });

      // 3. Move and Posture Car Group
      if (carGroupRef.current) {
        carGroupRef.current.position.x = animStates.current.carX;
        
        // 2D Mass-Spring-Damper Suspension Physics Euler Integration
        const kSpring = 160.0; 
        const cDamping = 10.0;  
        
        // Derivatives for speed changes
        let rawSpeedDelta = speedRef.current - prevSpeedRef.current;
        // Clamp speedDelta to a physical limit to prevent sudden stage transitions from blowing up the spring
        let speedDelta = Math.max(-10, Math.min(10, rawSpeedDelta));
        prevSpeedRef.current = speedRef.current;
        
        // Derivatives for steering changes
        let rawYawDelta = animStates.current.carYaw - prevYawRef.current;
        // Clamp yawDelta to a physical limit to prevent sudden swerve resets from blowing up the spring
        let yawDelta = Math.max(-0.05, Math.min(0.05, rawYawDelta));
        prevYawRef.current = animStates.current.carYaw;

        // Reset derivatives when car is fully stopped in Stage 6 to guarantee settling
        if (currentStageRef.current === 6 && speedRef.current === 0) {
          speedDelta = 0;
          yawDelta = 0;
        }
        
        // Target offsets based on braking force and centrifugal turning roll
        // Use a speed-factor multiplier to fade suspension pitch/roll compression to 0 when car is stationary (0 km/h)
        const speedFactor = Math.min(1.0, speedRef.current / 10.0);
        const targetPitchOffset = (-0.16 * (brakePressureRef.current / 100) + (speedDelta * 0.008)) * speedFactor;
        const targetRollOffset = (-yawDelta * 1.2 - (animStates.current.wheelTurnAngle * 0.05)) * speedFactor;
        const targetYOffset = (-0.02 * (brakePressureRef.current / 100)) * speedFactor; // compression
        
        // Sub-stepping to guarantee mathematical stability under any rendering stutters
        const substeps = 4;
        const subDelta = delta / substeps;
        
        for (let step = 0; step < substeps; step++) {
          // Pitch solver
          const pitchForce = -kSpring * (suspensionRef.current.pitch - targetPitchOffset) - cDamping * suspensionRef.current.pitchVel;
          suspensionRef.current.pitchVel += pitchForce * subDelta;
          suspensionRef.current.pitch += suspensionRef.current.pitchVel * subDelta;
          
          // Solve roll spring
          const rollForce = -kSpring * (suspensionRef.current.roll - targetRollOffset) - cDamping * suspensionRef.current.rollVel;
          suspensionRef.current.rollVel += rollForce * subDelta;
          suspensionRef.current.roll += suspensionRef.current.rollVel * subDelta;
          
          // Y vertical bounce solver
          const yForce = -kSpring * (suspensionRef.current.yOffset - targetYOffset) - cDamping * suspensionRef.current.yVel;
          suspensionRef.current.yVel += yForce * subDelta;
          suspensionRef.current.yOffset += suspensionRef.current.yVel * subDelta;
        }

        // Catch and recover from any NaN/Infinity overflows to prevent visual freezing
        if (isNaN(suspensionRef.current.pitch) || !isFinite(suspensionRef.current.pitch)) {
          suspensionRef.current.pitch = targetPitchOffset;
          suspensionRef.current.pitchVel = 0;
        }
        if (isNaN(suspensionRef.current.roll) || !isFinite(suspensionRef.current.roll)) {
          suspensionRef.current.roll = targetRollOffset;
          suspensionRef.current.rollVel = 0;
        }
        if (isNaN(suspensionRef.current.yOffset) || !isFinite(suspensionRef.current.yOffset)) {
          suspensionRef.current.yOffset = targetYOffset;
          suspensionRef.current.yVel = 0;
        }
        
        const idleBounce = Math.sin(time * 0.015) * 0.006;
        const speedRumble = (Math.random() - 0.5) * animStates.current.shakeIntensity;
        carGroupRef.current.position.y = 0.12 + suspensionRef.current.yOffset + idleBounce + speedRumble;

        // Apply pitch/roll directly to bodyGroup (wheels remain planted!)
        if (bodyGroupRef.current) {
          bodyGroupRef.current.rotation.x = suspensionRef.current.pitch;
          bodyGroupRef.current.rotation.z = suspensionRef.current.roll;
        }
        
        // Yaw rotation on carGroup
        carGroupRef.current.rotation.y = animStates.current.carYaw;

        // Cabin interior alert glow pulse
        let alarmIntensity = 0;
        if (activeAttackRef.current) {
          alarmIntensity = (Math.sin(time * 0.012) + 1.0) * 1.5;
        }
        if (alarmLightRef.current) {
          alarmLightRef.current.intensity = alarmIntensity;
          if (activeAttackRef.current) {
            const isCritical = currentStageRef.current >= 2 && currentStageRef.current <= 3;
            alarmLightRef.current.color.setHex(isCritical ? 0xff0000 : 0x00f0ff);
          }
        }
      }

      // Update headlight direction sways
      if (headlightLBeamRef.current && headlightRBeamRef.current) {
        headlightLBeamRef.current.target.position.x = -0.5 + animStates.current.carYaw * 4.0;
        headlightRBeamRef.current.target.position.x = 0.5 + animStates.current.carYaw * 4.0;
      }

      // Update road reflection underglow mesh
      if (underglowReflectionRef.current) {
        underglowReflectionRef.current.position.x = animStates.current.carX;
        (underglowReflectionRef.current.material as THREE.MeshBasicMaterial).color.setHex(underglowColorHex);
        (underglowReflectionRef.current.material as THREE.MeshBasicMaterial).opacity = underglowGlowOpacity;
      }

      // Update camera follow
      if (cameraRef.current) {
        const camShakeX = (Math.random() - 0.5) * animStates.current.shakeIntensity * 0.65;
        const camShakeY = (Math.random() - 0.5) * animStates.current.shakeIntensity * 0.65;
        cameraRef.current.position.x = -4.0 + (animStates.current.carX * 0.25) + camShakeX;
        cameraRef.current.position.y = 2.3 + camShakeY;
        cameraRef.current.lookAt(new THREE.Vector3(animStates.current.carX * 0.7 + 0.3, 0.45, -0.4));
      }

      // 4. Update Zipping Neon Guardrails (forward direction)
      animStates.current.guardrailOffset += roadSpeed;
      if (animStates.current.guardrailOffset > (70 / totalGuardrails)) {
        animStates.current.guardrailOffset -= (70 / totalGuardrails);
      }

      guardrailsRef.current.forEach((rail, idx) => {
        let currentZ = -50 + (Math.floor(idx / 2) * (70 / (totalGuardrails / 2))) + animStates.current.guardrailOffset;
        if (currentZ < -50) currentZ += 70;
        if (currentZ > 20) currentZ -= 70;
        rail.position.z = currentZ;

        // Pulse orange neon signals on side barriers
        const neonBar = rail.children[2] as THREE.Mesh;
        if (neonBar && neonBar.material) {
          (neonBar.material as THREE.MeshBasicMaterial).color.setHex(activeAttack ? 0xef4444 : 0xf59e0b);
        }
      });

      // 4.5. Update Parallax Bridge Pylons (forward direction)
      animStates.current.pylonOffset += roadSpeed;
      if (animStates.current.pylonOffset > 35) {
        animStates.current.pylonOffset -= 35;
      }

      bridgePylonsRef.current.forEach((pylon, idx) => {
        let currentZ = -45 + (idx * 35) + animStates.current.pylonOffset;
        if (currentZ < -45) currentZ += 105;
        if (currentZ > 60) currentZ -= 105;
        pylon.position.z = currentZ;
      });

      // 5. Update LiDAR hologram wall position
      if (barrierRef.current) {
        barrierRef.current.position.z = -4.5;
        barrierRef.current.position.x = animStates.current.barrierX;
        (barrierRef.current.material as THREE.MeshStandardMaterial).opacity = animStates.current.barrierOpacity;
        const wire = barrierRef.current.children[0] as THREE.LineSegments;
        if (wire && wire.material) {
          (wire.material as THREE.LineBasicMaterial).opacity = animStates.current.barrierOpacity;
          (wire.material as THREE.LineBasicMaterial).transparent = true;
        }
      }

      // 6. Move Smart V2X Traffic Light post
      if (signalPostRef.current) {
        signalTargetZ += roadSpeed;
        if (signalTargetZ > 20) {
          signalTargetZ = -50;
        }
        animStates.current.signalZ = signalTargetZ;
        signalPostRef.current.position.z = signalTargetZ;

        if (signalLightsRef.current) {
          const redBulb = signalLightsRef.current.red;
          const greenBulb = signalLightsRef.current.green;
          if (signalRedActive) {
            (redBulb.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
            (greenBulb.material as THREE.MeshBasicMaterial).color.setHex(0x064e3b);
          } else {
            (redBulb.material as THREE.MeshBasicMaterial).color.setHex(0x450a0a);
            (greenBulb.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
          }
        }
      }

      // 7. Update V2X Intersection Warning Grid overlay
      if (v2xGridRef.current) {
        v2xGridRef.current.position.z = animStates.current.signalZ;
        (v2xGridRef.current.material as THREE.Material).opacity = animStates.current.v2xGridOpacity;
      }

      // 8. EV Electric & Scraping Sparks (sparks particle emitter)
      const isScraping = Math.abs(animStates.current.carX) >= 2.8;
      const scrapSide = animStates.current.carX > 0 ? 1.0 : -1.0;
      if (particlesRef.current) {
        const positionsArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const mat = particlesRef.current.material as THREE.PointsMaterial;
        const activeSparks = animStates.current.exhaustIntensity > 0.05 || isScraping;

        if (activeSparks) {
          mat.opacity = isScraping ? 1.0 : animStates.current.exhaustIntensity;
          mat.color.setHex(isScraping ? 0xffbf00 : 0x00f0ff); // yellow sparks for scraping rails
          
          for (let i = 0; i < particleCount; i++) {
            positionsArr[i * 3 + 2] += velocities[i * 3 + 2] * (isScraping ? 1.5 : targetSpeedMultiplier) * delta;
            positionsArr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
            positionsArr[i * 3] += velocities[i * 3] * delta;

            if (positionsArr[i * 3 + 2] > 12 || positionsArr[i * 3 + 1] < -0.2) {
              if (isScraping) {
                // emit from side of car scraping guardrail
                positionsArr[i * 3] = animStates.current.carX + (scrapSide * 0.4) + (Math.random() - 0.5) * 0.1;
                positionsArr[i * 3 + 1] = 0.42 + (Math.random() - 0.5) * 0.15;
                positionsArr[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
              } else {
                // standard exhaust sparks
                positionsArr[i * 3] = animStates.current.carX + (Math.random() - 0.5) * 1.2;
                positionsArr[i * 3 + 1] = 0.05 + (Math.random() - 0.5) * 0.03;
                positionsArr[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 0.5;
              }
            }
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          mat.opacity = 0;
        }
      }

      // 9. Tire Lockup Smoke (heavy braking emitter - 100x thicker & faster)
      if (smokeParticlesRef.current) {
        const smokeArr = smokeParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const mat = smokeParticlesRef.current.material as THREE.PointsMaterial;

        if (animStates.current.smokeIntensity > 0.05) {
          mat.opacity = animStates.current.smokeIntensity * 0.85;
          for (let i = 0; i < smokeCount; i++) {
            // multiply smoke speed
            smokeArr[i * 3 + 2] += smokeVels[i * 3 + 2] * 1.6 * delta;
            smokeArr[i * 3 + 1] += smokeVels[i * 3 + 1] * 1.4 * delta;
            smokeArr[i * 3] += smokeVels[i * 3] * 1.4 * delta;

            if (smokeArr[i * 3 + 2] > 5 || smokeArr[i * 3 + 1] > 1.4) {
              const wheelIdx = Math.floor(Math.random() * 4);
              const wheelPos = wheelPositions[wheelIdx];
              smokeArr[i * 3] = animStates.current.carX + wheelPos[0] + (Math.random() - 0.5) * 0.2;
              smokeArr[i * 3 + 1] = 0.08;
              smokeArr[i * 3 + 2] = wheelPos[2] + (Math.random() - 0.5) * 0.3;
            }
          }
          smokeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          mat.opacity = 0;
        }
      }

      // 9.5. Off-road Dirt/Dust Particles Emitter
      const isOffRoad = Math.abs(animStates.current.carX) > 2.0 && targetSpeedMultiplier > 0.05;
      if (dustParticlesRef.current && dustVelsRef.current.length > 0) {
        const dustArr = dustParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const dMat = dustParticlesRef.current.material as THREE.PointsMaterial;

        if (isOffRoad) {
          dMat.opacity = Math.min(0.8, (Math.abs(animStates.current.carX) - 2.0) * 0.7);
          for (let i = 0; i < dustCount; i++) {
            dustArr[i * 3 + 2] += dustVelsRef.current[i * 3 + 2] * targetSpeedMultiplier * delta;
            dustArr[i * 3 + 1] += dustVelsRef.current[i * 3 + 1] * delta;
            dustArr[i * 3] += dustVelsRef.current[i * 3] * delta;

            if (dustArr[i * 3 + 2] > 6 || dustArr[i * 3 + 1] > 1.8) {
              // emit from behind rear wheels
              const rWheelPos = wheelPositions[2 + Math.floor(Math.random() * 2)];
              dustArr[i * 3] = animStates.current.carX + rWheelPos[0] + (Math.random() - 0.5) * 0.25;
              dustArr[i * 3 + 1] = 0.04;
              dustArr[i * 3 + 2] = rWheelPos[2] - 0.3;
            }
          }
          dustParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          dMat.opacity = 0;
        }
      }

      // 9.6. V2X Wireless Hacking Beam & Data Packet Anim
      if (hackBeamRef.current && packetSpheresRef.current.length > 0) {
        const startPt = new THREE.Vector3();
        const endPt = new THREE.Vector3(animStates.current.carX, 0.12 + 0.8, -0.9); // Target antenna
        let beamActive = false;
        let beamColor = 0xff0055;

        if (activeAttackRef.current === 'fake_traffic_signal') {
          startPt.set(2.6, 2.1, animStates.current.signalZ);
          beamActive = currentStageRef.current >= 2;
          beamColor = 0xff0044;
        } else if (activeAttackRef.current === 'gps_spoofing') {
          startPt.set(animStates.current.carX + 2.0, 6.0, -4.0);
          beamActive = currentStageRef.current >= 2;
          beamColor = 0xa855f7; // Purple GPS spoof beam
        } else if (activeAttackRef.current === 'theft_attempt') {
          startPt.set(animStates.current.carX - 1.6, 0.45, 0.2);
          beamActive = currentStageRef.current >= 2;
          beamColor = 0xef4444; // Red keyfob clone beam
        }

        if (beamActive) {
          // Update beam points
          const posArr = hackBeamRef.current.geometry.attributes.position.array as Float32Array;
          posArr[0] = startPt.x;
          posArr[1] = startPt.y;
          posArr[2] = startPt.z;
          posArr[3] = endPt.x;
          posArr[4] = endPt.y;
          posArr[5] = endPt.z;
          hackBeamRef.current.geometry.attributes.position.needsUpdate = true;
          (hackBeamRef.current.material as THREE.LineBasicMaterial).color.setHex(beamColor);
          (hackBeamRef.current.material as THREE.LineBasicMaterial).opacity = 0.8 + Math.sin(time * 0.015) * 0.15;
          hackBeamRef.current.visible = true;

          // Update packet spheres traveling along the beam
          packetSpheresRef.current.forEach((p, idx) => {
            const pMat = p.material as THREE.MeshBasicMaterial;
            pMat.color.setHex(beamColor);
            pMat.opacity = 0.95;
            
            const offset = idx * 0.33;
            const t = ((time * 0.0012) + offset) % 1.0;
            p.position.lerpVectors(startPt, endPt, t);
            const scale = 1.0 - Math.abs(t - 0.5) * 0.6;
            p.scale.set(scale, scale, scale);
          });
        } else {
          hackBeamRef.current.visible = false;
          packetSpheresRef.current.forEach((p) => {
            (p.material as THREE.MeshBasicMaterial).opacity = 0;
          });
        }
      }

      // 10. Keyfob Expanding Signal Waves
      keyRingsRef.current.forEach((ring, idx) => {
        if (ringScaleTarget > 0) {
          const scale = Math.max(0.1, ringScaleTarget - (idx * 0.9));
          ring.scale.set(scale, scale, scale);
          ring.position.x = animStates.current.carX;
          const rMat = ring.material as THREE.MeshBasicMaterial;
          rMat.opacity = Math.max(0, ringOpacityTarget * (1.0 - (scale / 5.5)));
        } else {
          const rMat = ring.material as THREE.MeshBasicMaterial;
          rMat.opacity = 0;
        }
      });

      // Render step
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    let animationFrameId = requestAnimationFrame(animate);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height || 280;
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full min-h-[220px] md:min-h-[280px] overflow-hidden" />
      
      {/* HUD diagnostic tags bottom left */}
      <div className="absolute bottom-3 left-3 bg-slate-950/80 text-white/90 font-mono text-[8px] px-2 py-1 rounded border border-white/10 uppercase tracking-widest flex gap-2 pointer-events-none select-none">
        <span>MODEL: MAHINDRA BE 6E (COUPE SUV)</span>
        <span className="text-brand-secondary">● ACTIVE</span>
      </div>

      <div className="absolute bottom-3 right-3 bg-slate-950/80 text-white/90 font-mono text-[8px] px-2 py-1 rounded border border-white/10 uppercase tracking-widest flex gap-2 pointer-events-none select-none">
        <span>Yaw: {animStates.current.carYaw.toFixed(2)} rad</span>
        <span>X-Pos: {animStates.current.carX.toFixed(2)}m</span>
      </div>
    </div>
  );
}
