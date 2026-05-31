'use client';
import { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Radio,
  Network,
  Zap,
  Lock,
  ArrowRight,
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
  Navigation,
  Smartphone,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

import Particles from '@/components/Particles';
import ThreeVehicle from '@/components/ThreeVehicle';
import ECEIntegration from '@/components/ECEIntegration';

export default function Home() {
  // Global simulation states
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [timelineStep, setTimelineStep] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(65);
  const [trustScores, setTrustScores] = useState({ camera: 98, lidar: 98, radar: 98, gps: 98 });
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'HIGH'>('LOW');
  const [systemStatus, setSystemStatus] = useState<'SAFE' | 'ATTACKED' | 'DEFENDED'>('SAFE');
  const [emergencySystem, setEmergencySystem] = useState<'ONLINE' | 'TRIGGERED'>('ONLINE');
  const [sensorStatus, setSensorStatus] = useState<'NORMAL' | 'ANOMALY' | 'ISOLATED'>('NORMAL');
  
  // Section 2 Interactive States
  const [sensorMode, setSensorMode] = useState<'normal' | 'failure' | 'attack' | 'weather'>('normal');
  const [sec2Processing, setSec2Processing] = useState<boolean>(false);

  // Section 5 Interactive Scenario state
  const [activeTelegramScenario, setActiveTelegramScenario] = useState<number>(1);
  const [remoteLockState, setRemoteLockState] = useState<'UNLOCKED' | 'LOCKED'>('UNLOCKED');

  // Floating Auto Demo Mode state
  const [autoDemoActive, setAutoDemoActive] = useState<boolean>(false);
  const [autoDemoStep, setAutoDemoStep] = useState<number>(0);
  const autoDemoTimer = useRef<any>(null);

  // Sensor Live Data mapping for Section 2
  const sensorDataValues = {
    normal: {
      camera: '20 m',
      lidar: '21 m',
      radar: '19 m',
      gps: 'Valid (12 Satellites)',
      trust: { camera: 98, lidar: 98, radar: 98, gps: 98 },
      status: 'NORMAL' as const
    },
    failure: {
      camera: 'OFFLINE (Error 0x4)',
      lidar: '21 m',
      radar: '19 m',
      gps: 'Valid (12 Satellites)',
      trust: { camera: 0, lidar: 95, radar: 96, gps: 98 },
      status: 'ANOMALY' as const
    },
    attack: {
      camera: '150 m (Spoofed)',
      lidar: '20 m',
      radar: '19 m',
      gps: 'Valid (12 Satellites)',
      trust: { camera: 12, lidar: 95, radar: 96, gps: 98 },
      status: 'ISOLATED' as const
    },
    weather: {
      camera: 'Obstructed (Rain/Water)',
      lidar: '8 m (Scatter)',
      radar: '19 m (Penetrating)',
      gps: 'Degraded Accuracy',
      trust: { camera: 68, lidar: 54, radar: 95, gps: 88 },
      status: 'NORMAL' as const
    }
  };

  const attackConsequences: Record<string, string[]> = {
    'camera_spoofing': [
      'Blind spot introduced in front perception cone, blinding the vehicle to lane markings.',
      'Vehicle veers slightly due to immediate loss of lane-keeping assist (LKA) feedback.',
      'Trust engine flags severe conflict: camera pixel arrays contradict LiDAR structural map.',
      'System isolates camera feed; vehicle relies on LiDAR/Radar fusion to regain centering.'
    ],
    'gps_spoofing': [
      'Coordinate drift injected via malicious satellite pings causes abrupt navigational shift.',
      'Vehicle interprets drift as off-road deviation; emergency braking algorithms engaged.',
      'Trust score plummets as dead-reckoning (IMU/Wheel Odometry) severely mismatches GPS.',
      'GPS node disconnected; navigation defaults to localized SLAM and HD map matching.'
    ],
    'radar_manipulation': [
      'False distances injected via RF flooding cause rapid forward/backward suspension jitter.',
      'Adaptive Cruise Control (ACC) disengages forcefully to prevent phantom collisions.',
      'Visual sensors (Camera/LiDAR) report empty road, contradicting the RF wave returns.',
      'Radar data discarded; velocity control hands over to LiDAR depth estimation.'
    ],
    'fake_obstacle': [
      'Suspension bounce effect triggered as the vehicle reacts to a projected phantom obstacle.',
      'Automatic Emergency Braking (AEB) engaged to prioritize stopping over ride smoothness.',
      'LiDAR structural scan confirms a clear path, overriding the injected radar/camera phantom.',
      'Threat neutralized; vehicle resumes safe speed while maintaining heightened sensor vigilance.'
    ],
    'v2v_spoofing': [
      'Vehicle wobbles as forged roadside limits/steering commands conflict with internal HD map.',
      'Rogue speed limit broadcast via mesh network (DSRC/C-V2X) ignored by autonomous drive.',
      'Consensus protocol fails; cryptographic signature of the transmitting node is rejected.',
      'Network isolated to ignore rogue broadcast; Telegram alert dispatched for infrastructure review.'
    ]
  };

  // Section 3: Cyberattack flow execution
  const triggerAttack = (attackType: string) => {
    setActiveAttack(attackType);
    setTimelineStep(1);

    // Initial state: Attack starts
    setSystemStatus('SAFE');
    setSensorStatus('NORMAL');
    setThreatLevel('LOW');

    const steps = [
      () => { setTimelineStep(2); setSensorStatus('ANOMALY'); }, // Sensor Data Manipulated
      () => { setTimelineStep(3); }, // Trust Engine Activated
      () => { setTimelineStep(4); setThreatLevel('HIGH'); setSystemStatus('ATTACKED'); }, // Threat Detected
      () => { setTimelineStep(5); setSensorStatus('ISOLATED'); setSystemStatus('DEFENDED'); }, // Sensor Isolated
      () => { 
        setTimelineStep(6); 
        setSystemStatus('SAFE');
        // Slow vehicle down in Safe Mode
        let curSpeed = 65;
        const decay = setInterval(() => {
          curSpeed = Math.max(15, curSpeed - 10);
          setSpeed(curSpeed);
          if (curSpeed === 15) clearInterval(decay);
        }, 150);
        
        // Update trust scores
        if (attackType === 'camera_spoofing') setTrustScores({ camera: 12, lidar: 95, radar: 96, gps: 98 });
        if (attackType === 'gps_spoofing') setTrustScores({ camera: 98, lidar: 95, radar: 96, gps: 14 });
        if (attackType === 'radar_manipulation') setTrustScores({ camera: 98, lidar: 95, radar: 8, gps: 98 });
        if (attackType === 'fake_obstacle') setTrustScores({ camera: 15, lidar: 98, radar: 98, gps: 98 });
        if (attackType === 'v2v_spoofing') setTrustScores({ camera: 98, lidar: 98, radar: 98, gps: 98 });
        
        // Set scenario to 1 (Cybersecurity warning)
        setActiveTelegramScenario(1);
      }
    ];

    steps.forEach((fn, idx) => {
      setTimeout(fn, (idx + 1) * 1200);
    });
  };

  // Automated Review Demo Mode
  const runAutoDemo = () => {
    if (autoDemoTimer.current) clearInterval(autoDemoTimer.current);
    setAutoDemoActive(true);
    setAutoDemoStep(1);

    // Reset values for start
    setSpeed(65);
    setTrustScores({ camera: 98, lidar: 98, radar: 98, gps: 98 });
    setThreatLevel('LOW');
    setSystemStatus('SAFE');
    setEmergencySystem('ONLINE');
    setSensorStatus('NORMAL');
    setSec1Choice(null);

    let step = 1;
    autoDemoTimer.current = setInterval(() => {
      step += 1;
      setAutoDemoStep(step);

      if (step === 2) {
        // Trigger GPS spoofing attack
        triggerAttack('gps_spoofing');
      } else if (step === 5) {
        // Show safe response deceleration in progress
        setSystemStatus('DEFENDED');
      } else if (step === 6) {
        // Telegram notification triggered
        setActiveTelegramScenario(1);
      } else if (step === 7) {
        // End demo
        clearInterval(autoDemoTimer.current);
        setAutoDemoActive(false);
        setAutoDemoStep(0);
        triggerReset();
      }
    }, 4500);
  };

  const triggerReset = () => {
    if (autoDemoTimer.current) clearInterval(autoDemoTimer.current);
    setAutoDemoActive(false);
    setAutoDemoStep(0);
    setActiveAttack(null);
    setTimelineStep(0);
    setSpeed(65);
    setTrustScores({ camera: 98, lidar: 98, radar: 98, gps: 98 });
    setThreatLevel('LOW');
    setSystemStatus('SAFE');
    setEmergencySystem('ONLINE');
    setSensorStatus('NORMAL');
    setSensorMode('normal');
    setSec2Processing(false);
    setSec1Choice(null);
    setRemoteLockState('UNLOCKED');
  };

  // Section 2 execute consensus runner
  const executeConsensusCalculation = () => {
    setSec2Processing(true);
    setTimeout(() => {
      setSec2Processing(false);
    }, 1800);
  };

  // Scenario choice in Section 1 (Cinematic Problem)
  const [sec1Choice, setSec1Choice] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-white/5 text-slate-100 overflow-hidden font-body z-10 antialiased selection:bg-cyan-500 selection:text-slate-900">
      <Particles />

      {/* COMPACT STICKY HEADER */}
      <nav className="sticky top-0 z-50 bg-white/5/85 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-cyan-400 animate-pulse" />
          <span className="font-display font-extrabold text-sm tracking-wider text-white uppercase">
            ADAS <span className="text-cyan-400">Guardian</span>
          </span>
          <span className="px-2 py-0.5 text-[8px] font-mono rounded bg-white/5 border border-white/10 text-slate-300 font-semibold tracking-widest uppercase">
            Engineering Prototype
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            <RefreshCw className="h-3 w-3" /> Reset Lab
          </button>
          <div className="flex items-center gap-2 bg-white/5/90 border border-white/10 px-3 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${threatLevel === 'HIGH' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
            <span className="text-[9px] uppercase tracking-widest font-mono text-slate-200 font-bold">
              {threatLevel === 'HIGH' ? 'THREAT DETECTED' : 'SECURE'}
            </span>
          </div>
        </div>
      </nav>

      {/* SECTION 1: LIVE AUTONOMOUS VEHICLE DIGITAL TWIN (HOMEPAGE) */}
      <header className="relative min-h-[92vh] flex items-center justify-center px-6 lg:px-12 py-12">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left: Headlines & Dynamic Overlays */}
          <div className="lg:col-span-6 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-400 font-mono uppercase tracking-widest font-bold">
              <Zap className="h-3.5 w-3.5 animate-pulse" /> Active Simulation Environment
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-display font-black leading-tight text-white tracking-tight">
              Cyberattack Detection and Safe Response System for <span className="text-cyan-400">Autonomous Vehicles</span>
            </h1>
            
            <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
              Protecting autonomous vehicles using trust-based sensor validation and intelligent threat detection.
            </p>

            {/* Simple HUD stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-inner flex flex-col justify-between min-h-[80px]">
                <span className="text-[8.5px] uppercase font-mono tracking-widest text-slate-400 font-bold">Vehicle Status</span>
                <span className={`text-xs font-bold font-mono tracking-wide ${systemStatus === 'SAFE' ? 'text-emerald-400' : systemStatus === 'ATTACKED' ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                  ● {systemStatus}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-inner flex flex-col justify-between min-h-[80px]">
                <span className="text-[8.5px] uppercase font-mono tracking-widest text-slate-400 font-bold">Threat Level</span>
                <span className={`text-xs font-bold font-mono tracking-wide ${threatLevel === 'HIGH' ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                  {threatLevel}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-inner flex flex-col justify-between min-h-[80px]">
                <span className="text-[8.5px] uppercase font-mono tracking-widest text-slate-400 font-bold">Trust Score</span>
                <span className={`text-sm font-black font-mono tracking-tight ${trustScores.camera > 70 ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`}>
                  {trustScores.camera}%
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-inner flex flex-col justify-between min-h-[80px]">
                <span className="text-[8.5px] uppercase font-mono tracking-widest text-slate-400 font-bold">Emergency System</span>
                <span className="text-xs font-bold font-mono text-emerald-400 tracking-wide uppercase">
                  {emergencySystem}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-inner flex flex-col justify-between min-h-[80px]">
                <span className="text-[8.5px] uppercase font-mono tracking-widest text-slate-400 font-bold">Sensor Status</span>
                <span className={`text-xs font-bold font-mono tracking-wide ${sensorStatus === 'NORMAL' ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`}>
                  {sensorStatus}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-inner flex flex-col justify-between min-h-[80px]">
                <span className="text-[8.5px] uppercase font-mono tracking-widest text-slate-400 font-bold">Velocity telemetry</span>
                <span className="text-xs font-bold font-mono text-cyan-400 tracking-wide">
                  {speed} km/h
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={runAutoDemo}
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105"
              >
                Launch Demonstration
              </button>
            </div>
          </div>

          {/* Hero Right: 3D Digital Twin Viewer with Live Sensor data cards */}
          <div className="lg:col-span-6 h-[420px] lg:h-[500px] relative bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-transparent to-rose-950/10 pointer-events-none rounded-3xl" />
            
            <div className="flex justify-between items-center z-10 border-b border-white/10 pb-3">
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-bold block">
                ● 3D Digital Twin Loop
              </span>
              <span className="text-[9px] font-mono text-cyan-400 animate-pulse">
                DRIVING ACTIVE
              </span>
            </div>

            <div className="flex-1 w-full relative">
              <ThreeVehicle
                scrollRotation={true}
                attackMode={activeAttack}
                attackStage={timelineStep}
              />
            </div>

            {/* Live sensor readout mini-cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 z-10 relative">
              {[
                { name: 'Camera', val: activeAttack === 'camera_spoofing' ? '150 m' : '20 m' },
                { name: 'LiDAR', val: '21 m' },
                { name: 'Radar', val: '19 m' },
                { name: 'GPS', val: activeAttack === 'gps_spoofing' ? 'Spoofed' : 'Locked' }
              ].map((s) => (
                <div key={s.name} className="bg-white/5/80 border border-white/10 rounded-lg p-2 font-mono text-[9px] flex justify-between items-center shadow-md">
                  <span className="text-slate-400 font-bold">{s.name}:</span>
                  <span className={s.val.includes('Spoofed') || s.val.includes('150 m') ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-200'}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 1B: THE PROBLEM (CINEMATIC SENSOR DISPUTE) */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold block">Section 01 // The Problem</span>
          <h3 className="text-2xl md:text-3xl font-display font-black text-white">
            What Happens When A Self-Driving Car Gets Hacked?
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            The vehicle driving normally faces sudden, conflicting sensor reports. Everything freezes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#000000]/40 p-4 rounded-xl border border-white/10 space-y-1 text-center font-mono">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Camera says:</span>
                <span className="text-xs font-bold text-emerald-400 tracking-wide">Road Clear</span>
              </div>
              <div className="bg-[#000000]/40 p-4 rounded-xl border border-white/10 space-y-1 text-center font-mono">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">LiDAR says:</span>
                <span className="text-xs font-bold text-rose-500 animate-pulse tracking-wide">Obstacle Ahead</span>
              </div>
              <div className="bg-[#000000]/40 p-4 rounded-xl border border-white/10 space-y-1 text-center font-mono">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Radar says:</span>
                <span className="text-xs font-bold text-rose-500 animate-pulse tracking-wide">Obstacle Ahead</span>
              </div>
            </div>

            <div className="text-center font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider py-2">
              Which Sensor Should The Vehicle Trust?
            </div>

            <div className="grid grid-cols-3 gap-3">
              {['Trust Camera', 'Trust LiDAR', 'Trust Radar'].map((choice) => (
                <button
                  key={choice}
                  onClick={() => setSec1Choice(choice)}
                  className={`py-3 rounded-lg border text-xs font-mono font-bold tracking-wider transition ${
                    sec1Choice === choice 
                      ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow' 
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-center">
            {sec1Choice ? (
              sec1Choice === 'Trust Camera' ? (
                <div className="text-center space-y-3 animate-fade-in">
                  <XCircle className="h-14 w-14 text-rose-500 mx-auto animate-bounce" />
                  <h4 className="text-base font-bold text-rose-500 uppercase tracking-widest font-mono">🔴 Collision Occurred!</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                    The vehicle trusted the spoofed Camera feed and crashed into the obstacle at 60 km/h.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3 animate-fade-in">
                  <CheckCircle className="h-14 w-14 text-emerald-400 mx-auto animate-pulse" />
                  <h4 className="text-base font-bold text-emerald-400 uppercase tracking-widest font-mono">🟢 Safe Stop Complete!</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                    Radar and LiDAR consensus correctly identified the obstacle, quarantining the compromised Camera.
                  </p>
                </div>
              )
            ) : (
              <div className="text-center text-xs text-slate-400 font-mono">
                Select a trust option to verify the physical consequences.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: SENSOR FUSION AND TRUST SCORE ENGINE */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold block">Section 02 // Core Innovation</span>
          <h2 className="text-2xl md:text-4xl font-display font-black text-white">
            Sensor Fusion & Trust Score Engine
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            This engine aggregates continuous streams, matches measurement values, and applies consensus algorithms to flag malicious sensor streams.
          </p>
        </div>

        {/* Lab mode buttons */}
        <div className="flex flex-wrap gap-2.5 justify-center mb-8">
          {[
            { id: 'normal', label: 'Normal Mode' },
            { id: 'failure', label: 'Sensor Failure' },
            { id: 'attack', label: 'Cyber Attack' },
            { id: 'weather', label: 'Weather Disturbance' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                const modeKey = mode.id as keyof typeof sensorDataValues;
                setSensorMode(modeKey);
                setTrustScores(sensorDataValues[modeKey].trust);
                setSensorStatus(sensorDataValues[modeKey].status);
              }}
              className={`px-5 py-2.5 rounded-lg border text-xs font-mono font-bold tracking-wider transition ${
                sensorMode === mode.id
                  ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-md'
                  : 'bg-white/5 border-white/10 hover:bg-slate-850 text-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Active Sensor Data Values (Left) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-1">🔍 Live Sensor Feeds</span>
            
            {[
              { id: 'camera', name: 'Camera Range', val: sensorDataValues[sensorMode].camera },
              { id: 'lidar', name: 'LiDAR Range', val: sensorDataValues[sensorMode].lidar },
              { id: 'radar', name: 'Radar Range', val: sensorDataValues[sensorMode].radar },
              { id: 'gps', name: 'GPS Status', val: sensorDataValues[sensorMode].gps }
            ].map((s) => (
              <div key={s.id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 font-mono text-xs">
                <span className="text-slate-300">{s.name}</span>
                <span className={`font-bold ${s.val.includes('Spoofed') || s.val.includes('OFFLINE') ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>{s.val}</span>
              </div>
            ))}

            <button
              onClick={executeConsensusCalculation}
              disabled={sec2Processing}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-800 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest font-mono shadow transition"
            >
              {sec2Processing ? 'Comparing Consensus Matrix...' : 'Verify Sensor Consensus'}
            </button>
          </div>

          {/* Trust Score Gauges & Verdict (Right) */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest block border-b border-white/10 pb-2">📊 Consensus Score Predictions</span>

              <div className="space-y-3">
                {[
                  { name: 'Camera Trust', val: trustScores.camera },
                  { name: 'LiDAR Trust', val: trustScores.lidar },
                  { name: 'Radar Trust', val: trustScores.radar },
                  { name: 'GPS Trust', val: trustScores.gps }
                ].map((s) => (
                  <div key={s.name} className="space-y-1.5 font-mono">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-200">{s.name}</span>
                      <span className={`font-bold ${s.val > 70 ? 'text-emerald-400' : s.val > 30 ? 'text-amber-400' : 'text-rose-500 animate-pulse'}`}>{s.val}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                      <div className={`h-full transition-all duration-700 ${s.val > 70 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : s.val > 30 ? 'bg-amber-400' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} style={{ width: `${s.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostics Verdict box */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Diagnosis Verdict:</span>
              <span className={`font-bold uppercase ${sensorMode === 'attack' ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                {sensorMode === 'attack' ? '⚠️ Camera flagged as suspicious' : sensorMode === 'failure' ? '⚠️ Camera Offline (Degraded)' : '✅ All sensors congruent'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <ECEIntegration />

      {/* SECTION 4: CYBERATTACK SIMULATOR */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold block">Section 04 // Active Exploitation</span>
          <h2 className="text-2xl md:text-4xl font-display font-black text-white">
            Cyberattack Simulator
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Actively inject malicious spoof overrides to trigger the automated cybersecurity validation pipeline.
          </p>
        </div>
        
        {/* TOP ROW: Car Visualization + Attack Chain Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* 3D Car Live Viewport */}
          <div className="lg:col-span-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden flex flex-col" style={{ minHeight: '360px' }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/10">
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-bold">🚗 Live Vehicle Digital Twin</span>
              <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                activeAttack && timelineStep >= 4
                  ? 'bg-rose-950/40 border border-rose-500/40 text-rose-400 animate-pulse'
                  : activeAttack && timelineStep >= 1
                  ? 'bg-amber-950/40 border border-amber-500/40 text-amber-400'
                  : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-400'
              }`}>
                {activeAttack && timelineStep >= 4 ? '⚠ THREAT DETECTED' : activeAttack && timelineStep >= 1 ? '● ANALYZING...' : '● SECURE'}
              </span>
            </div>
            <div className="flex-1 w-full relative" style={{ minHeight: '280px' }}>
              <ThreeVehicle
                scrollRotation={false}
                attackMode={activeAttack}
                attackStage={timelineStep}
                speed={speed}
              />
              {activeAttack && (
                <div className="absolute bottom-3 left-3 right-3 flex gap-2 z-10">
                  <div className={`flex-1 bg-[#000000]/60 backdrop-blur border rounded-lg px-2 py-1.5 text-center font-mono ${timelineStep >= 4 ? 'border-rose-500/50' : 'border-white/10'}`}>
                    <div className="text-[8px] text-slate-400 uppercase tracking-wider">Speed</div>
                    <div className={`text-xs font-bold ${timelineStep >= 6 ? 'text-amber-400' : 'text-cyan-400'}`}>{speed} km/h</div>
                  </div>
                  <div className={`flex-1 bg-[#000000]/60 backdrop-blur border rounded-lg px-2 py-1.5 text-center font-mono ${timelineStep >= 5 ? 'border-rose-500/50' : 'border-white/10'}`}>
                    <div className="text-[8px] text-slate-400 uppercase tracking-wider">Threat</div>
                    <div className={`text-xs font-bold ${threatLevel === 'HIGH' ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>{threatLevel}</div>
                  </div>
                  <div className={`flex-1 bg-[#000000]/60 backdrop-blur border rounded-lg px-2 py-1.5 text-center font-mono ${timelineStep >= 6 ? 'border-emerald-500/50' : 'border-white/10'}`}>
                    <div className="text-[8px] text-slate-400 uppercase tracking-wider">System</div>
                    <div className={`text-xs font-bold ${systemStatus === 'DEFENDED' ? 'text-emerald-400' : systemStatus === 'ATTACKED' ? 'text-rose-500 animate-pulse' : 'text-slate-200'}`}>{systemStatus}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Threat timeline map */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">🛡️ Attack Chain Timeline</span>
              {activeAttack && timelineStep === 6 && (
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest animate-pulse">● DEFENSE COMPLETE</span>
              )}
              {activeAttack && timelineStep < 6 && timelineStep > 0 && (
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest animate-pulse">● PROCESSING...</span>
              )}
            </div>
            <div className="flex-1 space-y-3 relative z-10">
              <div className="absolute left-4 top-1 w-0.5 bg-slate-800 h-[92%] pointer-events-none" />
              {[
                { step: 1, text: 'Attack Initiated', sub: 'Threat injected into satellite/transceiver channels.' },
                { step: 2, text: 'Sensor Data Manipulated', sub: 'Affected receiver begins capturing malicious frames.' },
                { step: 3, text: 'Trust Engine Activated', sub: 'Variance analysis matches feeds against active neighbors.' },
                { step: 4, text: 'Threat Detected', sub: 'Anomaly flagged in calculation matrix (mismatch threshold reached).' },
                { step: 5, text: 'Sensor Isolated', sub: 'Compromised node decoupled from powertrain controllers.' },
                { step: 6, text: 'Safe Response Triggered', sub: 'Safe Mode activated. Speed reduced. Alerts dispatched.' }
              ].map((node) => {
                const isPassed = timelineStep >= node.step;
                const isCurrent = timelineStep === node.step;
                return (
                  <div key={node.step} className="flex gap-4 items-start relative z-10 transition duration-300">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono text-[10.5px] font-bold transition duration-300 shrink-0 ${
                      isCurrent ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                      : isPassed ? 'bg-cyan-500 border-cyan-500 text-slate-950 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>0{node.step}</div>
                    <div>
                      <h5 className={`text-xs font-bold font-mono uppercase ${isPassed ? 'text-white font-extrabold' : 'text-slate-400'}`}>{node.text}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono leading-tight">{node.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-white/10 pt-3 text-[9px] font-mono text-slate-400 mt-2">
              💡 Visualizes the precise lifecycle steps required to process and quarantine network threats.
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Attack Vector Cards + Reset */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-bold">⚡ Select Attack Vector</span>
            {activeAttack && (
              <button
                onClick={triggerReset}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition duration-300 ${
                  timelineStep >= 6 
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950'
                }`}
              >
                <RefreshCw className="h-3 w-3" />
                Reset Simulation — Try Another Attack
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { id: 'camera_spoofing', label: 'Camera Spoofing', icon: '📷', desc: 'Overwrites front pixel array with empty road feed.', color: 'rose' },
              { id: 'gps_spoofing', label: 'GPS Spoofing', icon: '🛰️', desc: 'Injects coordinate offsets to drift guidance.', color: 'amber' },
              { id: 'radar_manipulation', label: 'Radar Manipulation', icon: '📡', desc: 'RF frequencies flooded to blind adaptive braking.', color: 'purple' },
              { id: 'fake_obstacle', label: 'Fake Obstacle Injection', icon: '🚧', desc: 'Paints dummy reflection targets to trigger brake drops.', color: 'orange' },
              { id: 'v2v_spoofing', label: 'V2V Spoofing', icon: '📶', desc: 'Broadcasts forged roadside limits over mesh channels.', color: 'blue' }
            ].map((att) => {
              const isCurrent = activeAttack === att.id;
              const isDisabled = activeAttack !== null && !isCurrent;
              const colorMap: Record<string, string> = {
                rose: 'border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] bg-rose-950/20',
                amber: 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-amber-950/20',
                purple: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)] bg-purple-950/20',
                orange: 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.25)] bg-orange-950/20',
                blue: 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)] bg-blue-950/20',
              };
              return (
                <button
                  key={att.id}
                  onClick={() => triggerAttack(att.id)}
                  disabled={isDisabled}
                  className={`text-left p-4 rounded-2xl border transition duration-300 flex flex-col gap-2 ${
                    isCurrent ? colorMap[att.color]
                    : isDisabled ? 'bg-white/5/20 border-white/10 opacity-40 cursor-not-allowed'
                    : 'bg-white/5 hover:bg-white/5 border-white/10 hover:border-white/10 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{att.icon}</span>
                    {isCurrent && (
                      <span className="text-[7px] uppercase tracking-widest font-bold font-mono text-rose-400 animate-pulse bg-rose-950/40 px-1.5 py-0.5 rounded-full border border-rose-500/30">ACTIVE</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 font-mono text-[11px] leading-tight">{att.label}</div>
                    <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">{att.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Consequences Panel */}
          {activeAttack ? (
            <div className="mt-6 p-5 bg-[#000000]/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
              <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Physical Consequences on Vehicle
              </h4>
              <ul className="space-y-2">
                {attackConsequences[activeAttack]?.map((conseq, idx) => (
                  <li key={idx} className="text-xs text-slate-300 font-mono flex gap-3 items-start">
                    <span className="text-rose-500 font-bold mt-0.5">→</span>
                    <span className="leading-relaxed">{conseq}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-center text-[10px] text-slate-500 font-mono mt-4">↑ Click any attack card above to begin the simulation</p>
          )}
        </div>
      </section>

      {/* SECTION 4: SAFE RESPONSE SYSTEM */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold block">Section 04 // Adaptive Action</span>
          <h2 className="text-2xl md:text-4xl font-display font-black text-white">
            Safe Response System
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Decisive safety controls activate following threat detection, locking down steering controllers, limiting speeds, and notifying dispatch channels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Reaction Stepper (Left) */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest block mb-4">● Mitigation Stepper Flow</span>

            <div className="space-y-4 relative z-10">
              <div className="absolute left-4 top-2 w-0.5 bg-slate-800 h-[88%] pointer-events-none" />

              {[
                { title: 'Threat Detected', sub: 'Intrusion verified by trust engine matrix.' },
                { title: 'Trust Analysis Complete', sub: 'Weights compiled. Variance index finalized.' },
                { title: 'Unsafe Sensor Isolated', sub: 'Sensor feeds dynamically decoupled from ADAS cruise controllers.' },
                { title: 'Vehicle Safe Mode Activated', sub: 'Throttle input capped. Target deceleration to 15km/h locked.' },
                { title: 'Driver Notified', sub: 'HUD warning alerts and Telegram logs dispatched.' },
                { title: 'Monitoring Continues', sub: 'Zero-trust secondary loop checks remains active.' }
              ].map((step, idx) => {
                const isActive = timelineStep >= (idx + 1);
                return (
                  <div key={idx} className="flex gap-4 items-start relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono text-[10px] transition duration-300 ${
                      isActive ? 'bg-cyan-500 border-cyan-500 text-slate-950 font-bold' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className={`text-xs font-bold font-mono uppercase ${isActive ? 'text-white' : 'text-slate-400'}`}>{step.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono leading-tight">{step.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Safe Mode Dashboard Indicators (Right) */}
          <div className="lg:col-span-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-between text-center space-y-6">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest block">📊 Safe Mode Dashboard</span>

            {/* Velocity dial */}
            <div className="inline-flex items-center justify-center relative w-40 h-40 rounded-full border border-white/10 bg-white/5 mx-auto">
              <div className="text-center font-mono">
                <span className="text-3xl font-black tracking-tight text-cyan-400 block leading-none">{speed}</span>
                <span className="text-[7.5px] text-slate-400 font-bold tracking-wider uppercase block mt-1">KM/H</span>
              </div>
              <div className={`absolute inset-0 rounded-full border-2 transition duration-500 ${
                speed === 15 ? 'border-rose-500 animate-pulse' : 'border-cyan-500/20'
              }`} />
            </div>

            {/* Suspended sensor warning grid */}
            <div className="space-y-2">
              <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Quarantined Receivers</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${activeAttack === 'camera_spoofing' ? 'bg-rose-950/20 border-rose-500/50 text-rose-400 font-bold' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                  <span>Camera Node</span>
                  <span>{activeAttack === 'camera_spoofing' ? 'OFF 🛑' : 'ACTIVE'}</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${activeAttack === 'gps_spoofing' ? 'bg-rose-950/20 border-rose-500/50 text-rose-400 font-bold' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                  <span>GPS Receiver</span>
                  <span>{activeAttack === 'gps_spoofing' ? 'OFF 🛑' : 'ACTIVE'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: EMERGENCY ALERT AND TELEGRAM RESPONSE */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold block">Section 05 // Real-World Action</span>
          <h2 className="text-2xl md:text-4xl font-display font-black text-white">
            Emergency Alert & Telegram Response
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Practical emergency notification loops transmit telemetry reports and theft maps straight to Telegram consoles during alerts.
          </p>
        </div>

        {/* Scenario Select tab */}
        <div className="flex gap-2 justify-center mb-8">
          {[
            { id: 1, label: 'Scenario 1: Cybersecurity Attack Alert' },
            { id: 2, label: 'Scenario 2: Accident Collision Alert' }
          ].map((scen) => (
            <button
              key={scen.id}
              onClick={() => setActiveTelegramScenario(scen.id)}
              className={`px-5 py-2.5 rounded-lg border text-xs font-mono font-bold tracking-wider transition ${
                activeTelegramScenario === scen.id
                  ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-md'
                  : 'bg-white/5 border-white/10 hover:bg-slate-850 text-slate-200'
              }`}
            >
              {scen.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Interactive Trigger (Left) */}
          <div className="lg:col-span-6 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between min-h-[350px]">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase block">💬 Emergency Dispatch Control</span>
              
              {activeTelegramScenario === 1 ? (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 font-mono text-xs text-slate-300">
                  <p>Executing cybersecurity alerts simulates receiver overrides.</p>
                  <div><strong>Simulated Target:</strong> AV-01 (Mahindra BE 6e)</div>
                  <div><strong>Remote lockout status:</strong> {remoteLockState}</div>
                </div>
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 font-mono text-xs text-slate-300">
                  <p>Executing impact triggers simulates airbag sensor deployment.</p>
                  <div><strong>Deceleration Metric:</strong> 24.5 G</div>
                  <div><strong>Emergency Status:</strong> TRIGGERED</div>
                </div>
              )}
            </div>

            {activeTelegramScenario === 1 ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerAttack('camera_spoofing')}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition"
                >
                  Trigger Spoof Attack
                </button>
                <button
                  onClick={() => {
                    setRemoteLockState('LOCKED');
                    setSystemStatus('SAFE');
                  }}
                  disabled={remoteLockState === 'LOCKED'}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition"
                >
                  Remote Lock Vehicle
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEmergencySystem('TRIGGERED');
                  setSpeed(0);
                  setActiveTelegramScenario(2);
                }}
                disabled={emergencySystem === 'TRIGGERED'}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition"
              >
                Trigger Collision Event
              </button>
            )}
          </div>

          {/* Telegram mockup window (Right) */}
          <div className="lg:col-span-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">💬 Telegram Interface Mockup</span>

            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 mt-4 text-[10px] font-mono max-h-[220px] overflow-y-auto">
              <div className="flex gap-2">
                <span className="text-cyan-400 font-bold shrink-0">&gt;&gt;</span>
                <span className="text-slate-400">Awaiting alert signals...</span>
              </div>

              {activeTelegramScenario === 1 && activeAttack && (
                <div className="p-3.5 bg-rose-950/20 border border-rose-800/30 rounded-xl space-y-1 text-rose-300 animate-fade-in">
                  <span className="font-bold text-xs uppercase block border-b border-rose-800/20 pb-1 mb-1">🚨 CYBERSECURITY ALERT</span>
                  <div><strong>Vehicle:</strong> AV-01 (Mahindra BE 6e)</div>
                  <div><strong>Threat detected:</strong> {activeAttack === 'camera_spoofing' ? 'Camera Spoofing' : activeAttack === 'gps_spoofing' ? 'GPS Spoofing' : 'Sensor Manipulation'}</div>
                  <div><strong>Consensus Trust Score:</strong> {trustScores.camera}%</div>
                  <div><strong>Action:</strong> Safe Mode Activated (Throttle limited)</div>
                  <div className="font-extrabold text-emerald-400 mt-1">● STATUS: VEHICLE SHIELDED & SAFE</div>
                </div>
              )}

              {activeTelegramScenario === 2 && emergencySystem === 'TRIGGERED' && (
                <div className="space-y-2 animate-fade-in">
                  <div className="p-3.5 bg-rose-950/20 border border-rose-800/30 rounded-xl space-y-1 text-rose-300">
                    <span className="font-bold text-xs uppercase block border-b border-rose-800/20 pb-1 mb-1">🚨 EMERGENCY ALERT DETECTED</span>
                    <div><strong>Vehicle:</strong> AV-01 (Mahindra BE 6e)</div>
                    <div><strong>Status:</strong> Possible Collision Detected</div>
                    <div><strong>Location coordinates:</strong> 17.3850° N, 78.4867° E</div>
                    <div className="font-bold text-emerald-400">● Emergency Contacts Notified</div>
                    <div className="font-bold text-emerald-400">● Nearest Trauma Center: Apollo (2.1 km)</div>
                  </div>
                </div>
              )}

              {remoteLockState === 'LOCKED' && (
                <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-emerald-300 animate-fade-in font-bold">
                  🔐 REMOTE LOCK COMMAND RECEIVED: DRIVETRAIN LOCKED DOWN SUCCESS
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-3 mt-4 text-[9px] font-mono text-slate-400">
              💡 Dispatch webhook loops run autonomously on the background server, connecting API channels.
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING AUTO DEMO PROCESS WINDOW */}
      {autoDemoActive && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-white/5/95 backdrop-blur-md border-2 border-cyan-500 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">🤖 REVIEW DEMO ONGOINGS</span>
            </div>
            <button
              onClick={triggerReset}
              className="text-[10px] font-mono text-rose-500 hover:underline uppercase"
            >
              Stop
            </button>
          </div>

          <div className="space-y-3 font-mono text-[10.5px]">
            <div className="flex justify-between items-center text-slate-300">
              <span>Demo Step:</span>
              <span className="font-bold text-cyan-400">Step {autoDemoStep} / 7</span>
            </div>
            
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${(autoDemoStep / 7) * 100}%` }} />
            </div>

            <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-200">
              {autoDemoStep === 1 && '🟢 Vehicle driving normally at 65 km/h. Trust score is high (98%).'}
              {autoDemoStep === 2 && '⚠️ Injecting Satellites coordinates GPS Spoofing attack...'}
              {autoDemoStep === 3 && '📉 GPS Trust score drops to 14%. System detects high-variance anomaly.'}
              {autoDemoStep === 4 && '⚡ Intrusion Detection System triggers network node isolation.'}
              {autoDemoStep === 5 && '🛡️ Vehicle Safe Mode activated. Speed reducing smoothly to 15 km/h.'}
              {autoDemoStep === 6 && '📲 Telegram Warning Alert dispatched with geolocation logs.'}
              {autoDemoStep === 7 && '✅ Safe stop verification complete. Vehicle fully protected.'}
            </div>
          </div>
        </div>
      )}

      {/* FLOAT DEMO BUTTON BOTTOM RIGHT */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={runAutoDemo}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center transition hover:scale-110 group relative"
          title="Review 2 Demonstration"
        >
          <Activity className="h-6 w-6" />
          <span className="absolute right-14 bg-white/5 border border-white/10 text-white text-[10px] font-mono px-3 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none select-none tracking-widest uppercase whitespace-nowrap">
            🤖 Review 2 Demonstration
          </span>
        </button>
      </div>

      {/* FINAL IMPACT SECTION & FOOTER */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center border-t border-white/10 space-y-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/10 via-transparent to-transparent pointer-events-none" />

        <h2 className="text-3xl md:text-5xl font-display font-black leading-tight text-white">
          Cybersecurity Is Not About Protecting Vehicles.<br />
          <span className="text-cyan-400">It Is About Protecting Human Lives.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-6 text-left">
          {[
            { id: '1', title: 'Prevent Accidents', desc: 'Isolates spoofed sensors before collision occurs.' },
            { id: '2', title: 'Detect Cyberattacks', desc: 'Flags node anomalies in less than 100ms.' },
            { id: '3', title: 'Improve Safety', desc: 'Cuts speeds proactively during warning signals.' },
            { id: '4', title: 'Protect Smart Cities', desc: 'Funnels authenticated signals to prevent grid jams.' },
            { id: '5', title: 'Protect Transportation', desc: 'Builds secure framework for passenger transport.' }
          ].map((card) => (
            <div key={card.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 flex flex-col justify-between shadow-lg">
              <span className="font-display font-black text-xl text-cyan-500/20 block">0{card.id}</span>
              <h5 className="text-[10px] font-bold text-white uppercase font-mono">{card.title}</h5>
              <p className="text-[9px] text-slate-400 leading-relaxed font-mono">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-6">
          <button
            onClick={runAutoDemo}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-8 py-3.5 rounded-xl font-bold transition-all shadow-md text-sm uppercase tracking-wider hover:scale-105"
          >
            Launch Complete Cybersecurity Demonstration <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>

        <footer className="pt-16 text-xs text-slate-400 font-mono">
          &copy; {new Date().getFullYear()} ADAS Guardian Platform. Rebuilt for Review 2 Engineering demonstration standards.
        </footer>
      </section>
    </div>
  );
}
