'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeVehicleProps {
  activeHotspot?: string | null;
  onHotspotClick?: (hotspot: string) => void;
  scrollRotation?: boolean;
  attackMode?: string | null;
  attackStage?: number;
  speed?: number;
}

export default function ThreeVehicle({
  activeHotspot,
  onHotspotClick,
  scrollRotation = false,
  attackMode,
  attackStage = 1,
  speed = 0
}: ThreeVehicleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);
  const lidarBeamRef = useRef<THREE.LineLoop | null>(null);
  const gpsLightRef = useRef<THREE.PointLight | null>(null);
  const alarmLightRef = useRef<THREE.PointLight | null>(null);
  const hotspotSpheresRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const ledCyanMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const ledRedMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Advanced Visual Attack Refs
  const cameraConeRef = useRef<THREE.Mesh | null>(null);
  const radarRingsRef = useRef<THREE.Group | null>(null);
  const fakeObstacleRef = useRef<THREE.LineSegments | null>(null);
  const v2vPacketsRef = useRef<THREE.Group | null>(null);

  // Smooth scroll interpolation variables
  const targetRotationY = useRef<number>(0);
  const targetRotationX = useRef<number>(0);

  const hotspotsData = [
    { id: 'Camera', pos: [0, 0.64, 0.4] },
    { id: 'LiDAR', pos: [0, 0.98, 0.0] },
    { id: 'Radar', pos: [0, 0.22, 1.45] },
    { id: 'GPS', pos: [0, 0.86, -0.9] },
    { id: 'ECU', pos: [0, 0.35, 1.1] },
    { id: 'CAN Network', pos: [0, 0.05, 0] },
    { id: 'Cloud Server', pos: [0, 1.8, -0.4] }
  ];

  const speedRef = useRef<number>(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const attackModeRef = useRef<string | null | undefined>(attackMode);
  const attackStageRef = useRef<number | undefined>(attackStage);
  useEffect(() => { 
    attackModeRef.current = attackMode; 
    attackStageRef.current = attackStage;
  }, [attackMode, attackStage]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = null; 

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 6);
    cameraRef.current = camera;

    // 3. Renderer Setup (Performance optimized)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimized scaling
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Enhanced Cinematic Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Darker ambient
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x38bdf8, 1.5); // Cool electric blue rim light
    directionalLight1.position.set(5, 5, -5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2.5); // Stark white key light
    directionalLight2.position.set(-5, 4, 3);
    scene.add(directionalLight2);

    const spotLight = new THREE.SpotLight(0xffffff, 3.0, 15, Math.PI / 4, 0.8, 1.5); // Dramatic overhead spotlight
    spotLight.position.set(0, 5, 0);
    scene.add(spotLight);

    // 5. Build Car Group (Procedural Futuristic Vehicle)
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;
    scene.add(carGroup);

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

    // Store in refs for dynamic color updates without traversal
    ledCyanMatRef.current = ledCyanMat;
    ledRedMatRef.current = ledRedMat;

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

    // 5e. LiDAR Dome
    const lidarDomeGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.15, 12);
    const lidarDomeMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.9 });
    const lidarDome = new THREE.Mesh(lidarDomeGeo, lidarDomeMat);
    lidarDome.position.set(0, 0.92, 0.0);
    carGroup.add(lidarDome);

    const beamPoints = [];
    for (let i = 0; i <= 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      beamPoints.push(new THREE.Vector3(Math.cos(theta) * 2.5, -0.3, Math.sin(theta) * 2.5));
    }
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x00d084,
      transparent: true,
      opacity: 0.3
    });
    const lidarBeam = new THREE.LineLoop(beamGeo, beamMat);
    lidarDome.add(lidarBeam);
    lidarBeamRef.current = lidarBeam;

    // 5f. GPS Receiver Node
    const gpsGeo = new THREE.BoxGeometry(0.15, 0.08, 0.25);
    const gpsNode = new THREE.Mesh(gpsGeo, lidarDomeMat);
    gpsNode.position.set(0, 0.78, -0.9);
    carGroup.add(gpsNode);

    const gpsLight = new THREE.PointLight(0x00d084, 1.5, 2);
    gpsLight.position.set(0, 0.1, 0);
    gpsNode.add(gpsLight);
    gpsLightRef.current = gpsLight;

    // 6. Draw Hotspot Markers (Refined & Smaller for professional layout)
    const hotspotGeo = new THREE.SphereGeometry(0.05, 16, 16);
    hotspotSpheresRef.current = {};

    hotspotsData.forEach((hs) => {
      const hsMat = new THREE.MeshBasicMaterial({
        color: 0x0066ff,
        transparent: true,
        opacity: 0.75
      });
      const sphere = new THREE.Mesh(hotspotGeo, hsMat);
      sphere.position.set(hs.pos[0], hs.pos[1], hs.pos[2]);

      const glowShellGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const glowShellMat = new THREE.MeshBasicMaterial({
        color: 0x0066ff,
        transparent: true,
        opacity: 0.2,
        wireframe: true
      });
      const shell = new THREE.Mesh(glowShellGeo, glowShellMat);
      sphere.add(shell);

      carGroup.add(sphere);
      hotspotSpheresRef.current[hs.id] = sphere;
    });

    // 7. Ground Grid (Adapted for Light Theme)
    const gridHelper = new THREE.GridHelper(100, 100, 0x0066ff, 0xe2e8f0);
    gridHelper.position.y = -0.15;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.15;
    scene.add(gridHelper);

    // Dark Road Plane to emphasize movement
    const roadGeo = new THREE.PlaneGeometry(8, 100);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const roadPlane = new THREE.Mesh(roadGeo, roadMat);
    roadPlane.rotation.x = -Math.PI / 2;
    roadPlane.position.y = -0.16;
    scene.add(roadPlane);

    // Road Lines Group
    const roadLinesGroup = new THREE.Group();
    scene.add(roadLinesGroup);

    // Center Dashed Lines
    const dashGeo = new THREE.PlaneGeometry(0.15, 2);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 });
    for (let i = -50; i < 50; i += 4) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, -0.15, i);
      roadLinesGroup.add(dash);
    }

    // Side Solid Lines
    const solidLineGeo = new THREE.PlaneGeometry(0.15, 100);
    const solidLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const leftLine = new THREE.Mesh(solidLineGeo, solidLineMat);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-3.8, -0.15, 0);
    roadLinesGroup.add(leftLine);
    
    const rightLine = new THREE.Mesh(solidLineGeo, solidLineMat);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(3.8, -0.15, 0);
    roadLinesGroup.add(rightLine);

    // Advanced Attack Visuals
    // 1. Camera Spoofing Cone
    const coneGeo = new THREE.ConeGeometry(0.8, 4, 16);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.15, wireframe: true });
    const cameraCone = new THREE.Mesh(coneGeo, coneMat);
    cameraCone.rotation.x = Math.PI / 2;
    cameraCone.position.set(0, 0.64, 3.0);
    cameraCone.visible = false;
    carGroup.add(cameraCone);
    cameraConeRef.current = cameraCone;

    // 2. Radar Rings
    const radarRings = new THREE.Group();
    radarRings.position.set(0, 0.22, 1.45);
    radarRings.visible = false;
    carGroup.add(radarRings);
    radarRingsRef.current = radarRings;
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.3 + i * 0.3, 0.03, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 })
      );
      radarRings.add(ring);
    }

    // 3. Fake Obstacle
    const obsGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1, 1));
    const obsMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    const fakeObstacle = new THREE.LineSegments(obsGeo, obsMat);
    fakeObstacle.position.set(0, 0.5, 4.0);
    fakeObstacle.visible = false;
    carGroup.add(fakeObstacle);
    fakeObstacleRef.current = fakeObstacle;

    // 4. V2V Packets
    const v2vPackets = new THREE.Group();
    v2vPackets.position.set(0, 1.8, -0.4);
    v2vPackets.visible = false;
    carGroup.add(v2vPackets);
    v2vPacketsRef.current = v2vPackets;
    for (let i = 0; i < 5; i++) {
      const pkt = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      pkt.position.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
      v2vPackets.add(pkt);
    }

    // 8. Animation Loop with smooth rotation interpolation (lerping)
    let lastTime = 0;
    const animate = (time: number) => {
      const delta = (time - lastTime) * 0.001;
      lastTime = time;

      if (lidarBeamRef.current) {
        lidarBeamRef.current.rotation.y += 1.5 * delta;
      }

      // Animate Attack Visuals
      if (cameraConeRef.current && cameraConeRef.current.visible) {
        cameraConeRef.current.rotation.y += delta * 2;
        cameraConeRef.current.scale.setScalar(1 + Math.sin(time * 0.01) * 0.1);
      }
      
      if (radarRingsRef.current && radarRingsRef.current.visible) {
        radarRingsRef.current.children.forEach((ring, idx) => {
          const s = (time * 0.005 + idx * 0.3) % 1;
          ring.scale.setScalar(1 + s * 2);
          (ring as THREE.Mesh).material.opacity = 1 - s;
        });
      }
      
      if (fakeObstacleRef.current && fakeObstacleRef.current.visible) {
        fakeObstacleRef.current.position.x = Math.sin(time * 0.02) * 0.2;
        fakeObstacleRef.current.scale.y = 1 + Math.random() * 0.2;
      }
      
      if (v2vPacketsRef.current && v2vPacketsRef.current.visible) {
        v2vPacketsRef.current.children.forEach((pkt) => {
          pkt.position.y -= delta * 2;
          if (pkt.position.y < -1) pkt.position.y = 1;
        });
      }

      // Wheel rotation based on speed
      const currentSpeed = speedRef.current || 0;
      const metersPerSec = currentSpeed / 3.6; 
      
      wheelsRef.current.forEach((w) => {
        w.rotation.x += (metersPerSec * 0.5) * delta;
      });

      // Animate road/grid to simulate movement
      if (currentSpeed > 0) {
        gridHelper.position.z += metersPerSec * delta;
        roadLinesGroup.position.z += metersPerSec * delta;
        if (gridHelper.position.z > 4) {
          gridHelper.position.z -= 4;
          roadLinesGroup.position.z -= 4;
        }
      }

      if (carGroupRef.current) {
        if (scrollRotation && !activeHotspot) {
          // Smoothly interpolate (lerp) towards targeted scroll values
          carGroupRef.current.rotation.y += (targetRotationY.current - carGroupRef.current.rotation.y) * 0.08;
          carGroupRef.current.rotation.x += (targetRotationX.current - carGroupRef.current.rotation.x) * 0.08;
        } else if (!activeHotspot) {
          // Reset rotation instead of spinning wildly
          carGroupRef.current.rotation.y += (0 - carGroupRef.current.rotation.y) * 0.1;
          carGroupRef.current.rotation.x += (0 - carGroupRef.current.rotation.x) * 0.1;
          
          // Basic suspension bobbing
          let bobbing = Math.sin(time * 0.005) * 0.01;
          let lateralDrift = 0;
          let tiltZ = 0;

          // Attack Visual Effects
          const aMode = attackModeRef.current;
          if (aMode) {
             if (aMode === 'camera_spoofing') {
               lateralDrift = Math.sin(time * 0.002) * 0.3; // drifting left and right
               tiltZ = Math.sin(time * 0.002) * 0.05;
             } else if (aMode === 'gps_spoofing') {
               // Hard braking effect if speed is reducing
               if (currentSpeed < 30) {
                 bobbing = Math.sin(time * 0.05) * 0.05; // shuddering
                 tiltZ = 0;
               }
             } else if (aMode === 'radar_manipulation') {
               lateralDrift = (Math.random() - 0.5) * 0.05; // jitter
             } else if (aMode === 'fake_obstacle') {
               // sudden swerve
               lateralDrift = Math.sin(time * 0.01) * 0.5;
             }
          }

          carGroupRef.current.position.x += (lateralDrift - carGroupRef.current.position.x) * 0.1;
          carGroupRef.current.position.y = bobbing;
          carGroupRef.current.rotation.z += (tiltZ - carGroupRef.current.rotation.z) * 0.1;
        }
      }

      // Pulse hotspots
      Object.keys(hotspotSpheresRef.current).forEach((key) => {
        const sphere = hotspotSpheresRef.current[key];
        const scale = 1 + Math.sin(time * 0.006) * 0.15;
        if (key === activeHotspot) {
          sphere.scale.set(scale * 1.4, scale * 1.4, scale * 1.4);
          (sphere.material as THREE.MeshBasicMaterial).color.setHex(0x00d084);
        } else {
          sphere.scale.set(1, 1, 1);
          (sphere.material as THREE.MeshBasicMaterial).color.setHex(0x0066ff);
        }
      });

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    let animationFrameId = requestAnimationFrame(animate);

    // Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height || 450;
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // Optimized Scroll Listener (Decoupled from state renders, sets raw Y target values)
    const handleScroll = () => {
      if (!scrollRotation) return;
      const scrollRatio = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      targetRotationY.current = scrollRatio * Math.PI * 2;
      targetRotationX.current = scrollRatio * 0.25;
    };

    if (scrollRotation) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [scrollRotation]);

  const animateCamera = (tx: number, ty: number, tz: number, lookTarget: THREE.Vector3) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const startPos = camera.position.clone();
    const targetPos = new THREE.Vector3(tx, ty, tz);
    const duration = 800; // Optimized duration
    const startTime = performance.now();

    const updateCam = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, targetPos, ease);
      camera.lookAt(lookTarget);

      if (progress < 1) {
        requestAnimationFrame(updateCam);
      }
    };

    requestAnimationFrame(updateCam);
  };

  // Handle Hotspot camera focus transitions
  useEffect(() => {
    const camera = cameraRef.current;
    const carGroup = carGroupRef.current;
    if (!camera || !carGroup) return;

    if (activeHotspot) {
      const hs = hotspotsData.find((h) => h.id === activeHotspot);
      if (hs) {
        let lookAtTarget = new THREE.Vector3(hs.pos[0], hs.pos[1], hs.pos[2]);
        
        if (activeHotspot === 'LiDAR') animateCamera(0, 2.5, 2.5, lookAtTarget);
        else if (activeHotspot === 'GPS') animateCamera(0, 2.5, -2.5, lookAtTarget);
        else if (activeHotspot === 'Camera') animateCamera(0, 1.2, 3.0, lookAtTarget);
        else if (activeHotspot === 'Radar') animateCamera(0, 0.5, 3.2, lookAtTarget);
        else if (activeHotspot === 'ECU') animateCamera(0.8, 0.8, 2.0, lookAtTarget);
        else if (activeHotspot === 'CAN Network') animateCamera(2.5, 1.2, 0, lookAtTarget);
        else if (activeHotspot === 'Cloud Server') animateCamera(-1.5, 3.5, 1.5, lookAtTarget);
      }
    } else {
      animateCamera(0, 1.5, 6, new THREE.Vector3(0, 0.3, 0));
    }
  }, [activeHotspot]);

  // Attack visual alerts
  useEffect(() => {
    const gpsLight = gpsLightRef.current;
    const carGroup = carGroupRef.current;
    if (!carGroup) return;

    const isCritical = attackMode && attackStage >= 2 && attackStage <= 4;

    // Advanced Visuals Toggles
    if (cameraConeRef.current) cameraConeRef.current.visible = attackMode === 'camera_spoofing' && isCritical;
    if (radarRingsRef.current) radarRingsRef.current.visible = attackMode === 'radar_manipulation' && isCritical;
    if (fakeObstacleRef.current) fakeObstacleRef.current.visible = attackMode === 'fake_obstacle' && isCritical;
    if (v2vPacketsRef.current) v2vPacketsRef.current.visible = attackMode === 'v2v_spoofing' && isCritical;

    if (attackMode) {
      const themeColor = isCritical ? 0xff3b30 : 0x00d084;

      if (alarmLightRef.current) {
        alarmLightRef.current.color.setHex(isCritical ? 0xff0000 : 0x00f0ff);
        alarmLightRef.current.intensity = isCritical ? 2.5 : 1.25;
      }

      if (ledCyanMatRef.current) {
        ledCyanMatRef.current.color.setHex(themeColor);
      }

      // Sync hotspots with page.tsx attacks
      if (attackMode === 'gps_spoofing') {
        const gpsSphere = hotspotSpheresRef.current['GPS'];
        if (gpsSphere) (gpsSphere.material as THREE.MeshBasicMaterial).color.setHex(isCritical ? 0xff3b30 : 0x00d084);
        if (gpsLight) gpsLight.color.setHex(isCritical ? 0xff3b30 : 0x00d084);
      } else if (attackMode === 'camera_spoofing') {
        const camSphere = hotspotSpheresRef.current['Camera'];
        if (camSphere) (camSphere.material as THREE.MeshBasicMaterial).color.setHex(isCritical ? 0xff3b30 : 0x00d084);
      } else if (attackMode === 'radar_manipulation') {
        const radarSphere = hotspotSpheresRef.current['Radar'];
        if (radarSphere) (radarSphere.material as THREE.MeshBasicMaterial).color.setHex(isCritical ? 0xff3b30 : 0x00d084);
      } else if (attackMode === 'fake_obstacle') {
        const lidarSphere = hotspotSpheresRef.current['LiDAR'];
        if (lidarSphere) (lidarSphere.material as THREE.MeshBasicMaterial).color.setHex(isCritical ? 0xff3b30 : 0x00d084);
        if (lidarBeamRef.current) (lidarBeamRef.current.material as THREE.LineBasicMaterial).color.setHex(isCritical ? 0xff3b30 : 0x00d084);
      } else if (attackMode === 'v2v_spoofing') {
        const cloudSphere = hotspotSpheresRef.current['Cloud Server'];
        if (cloudSphere) (cloudSphere.material as THREE.MeshBasicMaterial).color.setHex(isCritical ? 0xff3b30 : 0x00d084);
      }

      // Cinematic Camera Zoom
      if (isCritical) {
        let lookAtTarget = new THREE.Vector3(0, 0, 0);
        if (attackMode === 'camera_spoofing') { lookAtTarget.set(0, 0.64, 0.4); animateCamera(0, 1.2, 3.0, lookAtTarget); }
        else if (attackMode === 'gps_spoofing') { lookAtTarget.set(0, 0.86, -0.9); animateCamera(0, 2.5, -2.5, lookAtTarget); }
        else if (attackMode === 'radar_manipulation') { lookAtTarget.set(0, 0.22, 1.45); animateCamera(0, 0.5, 3.2, lookAtTarget); }
        else if (attackMode === 'fake_obstacle') { lookAtTarget.set(0, 0.3, 2.0); animateCamera(-1.5, 1.0, 5.0, lookAtTarget); }
        else if (attackMode === 'v2v_spoofing') { lookAtTarget.set(0, 1.8, -0.4); animateCamera(2.5, 2.0, 0, lookAtTarget); }
      } else if (attackStage >= 5) {
        animateCamera(0, 1.5, 6, new THREE.Vector3(0, 0.3, 0));
      }

    } else {
      if (alarmLightRef.current) {
        alarmLightRef.current.intensity = 0;
      }
      if (gpsLight) gpsLight.color.setHex(0x00d084);
      if (lidarBeamRef.current) (lidarBeamRef.current.material as THREE.LineBasicMaterial).color.setHex(0x00d084);
      Object.keys(hotspotSpheresRef.current).forEach((key) => {
        const sphere = hotspotSpheresRef.current[key];
        (sphere.material as THREE.MeshBasicMaterial).color.setHex(0x0066ff);
      });
      if (ledCyanMatRef.current) {
        ledCyanMatRef.current.color.setHex(0x00f0ff);
      }
      // Reset camera
      animateCamera(0, 1.5, 6, new THREE.Vector3(0, 0.3, 0));
    }
  }, [attackMode, attackStage]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div ref={containerRef} className="relative w-full h-full min-h-[350px] md:min-h-[450px]" />
      
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-sm">
        <span className={`w-2 h-2 rounded-full ${attackMode && attackStage >= 2 && attackStage <= 4 ? 'bg-rose-500 animate-pulse' : attackStage >= 5 ? 'bg-emerald-500' : 'bg-cyan-500 animate-ping'}`} />
        <span className="text-[10px] uppercase tracking-widest font-mono text-white/80 font-semibold">
          {attackMode && attackStage >= 6 ? 'SYSTEM SECURE: SAFE MODE' : attackMode ? `SIMULATOR: STAGE ${attackStage}/6` : 'TELEMETRY: STANDBY'}
        </span>
      </div>

      {attackMode && attackStage >= 6 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in fade-in zoom-in duration-500">
          <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-6 text-center max-w-sm shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 mx-auto flex items-center justify-center mb-4 text-emerald-400 text-xl font-bold">
              ✓
            </div>
            <h3 className="text-emerald-400 font-mono font-bold uppercase tracking-widest mb-2">Threat Neutralized</h3>
            <p className="text-white/60 text-xs font-mono">The autonomous trust engine has successfully quarantined the compromised subsystem and secured the vehicle.</p>
          </div>
        </div>
      )}
    </div>
  );
}
