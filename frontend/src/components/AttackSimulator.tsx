'use client';
import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, RotateCcw, Radio, Activity, AlertTriangle, EyeOff, Key, Compass, Lock, Eye, AlertCircle } from 'lucide-react';
import ThreeSimulator from '@/components/ThreeSimulator';

interface SimulationStep {
  type: string;
  stage: number;
  text: string;
  threatLevel: 'MINIMAL' | 'LOW' | 'HIGH';
  isDefenseActive: boolean;
}

interface AttackSimulatorProps {
  onAttackStateChange?: (attack: string | null, stage: number) => void;
  socket?: any;
  backendConnected?: boolean;
}

export default function AttackSimulator({ onAttackStateChange, socket, backendConnected }: AttackSimulatorProps) {
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [logMessage, setLogMessage] = useState<string>('Select an attack scenario to begin simulation.');
  const [threatLevel, setThreatLevel] = useState<'MINIMAL' | 'LOW' | 'HIGH'>('MINIMAL');
  const [isDefenseActive, setIsDefenseActive] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(65);
  const [brakePressure, setBrakePressure] = useState<number>(0);

  // States for interactive car road animations
  const [carOffsetTranslateY, setCarOffsetTranslateY] = useState<number>(0); // for GPS drifting
  const [wheelSpinSpeed, setWheelSpinSpeed] = useState<number>(1); // for CAN bus speed manipulation
  const [ghostObstacleVisible, setGhostObstacleVisible] = useState<boolean>(false); // for sensor spoofing
  const [trafficLightState, setTrafficLightState] = useState<'GREEN' | 'RED'>('GREEN'); // V2X signal
  const [keyAlertPulse, setKeyAlertPulse] = useState<boolean>(false); // theft alert

  const attacks = [
    { id: 'gps_spoofing', label: 'GPS Spoofing', icon: Radio, desc: 'Fake satellite coordinates inject fake navigation drift.' },
    { id: 'can_bus', label: 'CAN Bus Injection', icon: Activity, desc: 'Corrupted hardware overrides transmission and locks doors.' },
    { id: 'sensor_spoofing', label: 'Sensor Blinding', icon: EyeOff, desc: 'Laser pointer floods LiDAR sensors creating ghost obstacles.' },
    { id: 'theft_attempt', label: 'Keyfob Relay Theft', icon: Key, desc: 'Amplified remote signals spoof vehicle entry systems.' },
    { id: 'fake_traffic_signal', label: 'V2X Signal Override', icon: AlertTriangle, desc: 'Compromised smart junction broadcasts fake high limits.' }
  ];

  // Attack consequences mapping to answer "How does this protect me and my family?"
  const consequencesData: {
    [key: string]: {
      parts: string;
      behavior: string;
      passenger: string;
    }
  } = {
    gps_spoofing: {
      parts: 'GPS Antennas, Navigation Display Unit, ADAS Autopilot Lane Guide.',
      behavior: 'Drifts car off-course into oncoming lanes or curbs due to coordinate mismatches.',
      passenger: '🔴 HIGH RISK: Car navigates off a bridge or into unfamiliar dangerous areas. Passenger loses control over routing.'
    },
    can_bus: {
      parts: 'Powertrain Control Module, Door Lock Actuators, Electronic Braking.',
      behavior: 'Forces speed override to 120km/h and deadlocks doors, disabling dashboard buttons.',
      passenger: '🔴 EXTREME RISK: Driver cannot brake. Occupants are trapped inside a runaway vehicle, leading to high-speed crashes.'
    },
    sensor_spoofing: {
      parts: 'LiDAR rangefinders, Proximity Cameras, Crash Avoidance module.',
      behavior: 'Injects dummy objects 1m ahead, triggering hard automated braking resets.',
      passenger: '🔴 HIGH RISK: Sudden full-brake stops on high-speed expressways lead to pileup rear-end collisions. Passengers sustain severe whiplash.'
    },
    theft_attempt: {
      parts: 'Keyless Passive entry, Smart Ignition Controller, Telematics tracker.',
      behavior: 'Simulates keyfob signature to unlock doors, start engine, and bypass garage alarms.',
      passenger: '🔴 CRITICAL RISK: Asset loss. Vehicle is driven away silently while you sleep. Navigation coordinates are blacked out to block recovery.'
    },
    fake_traffic_signal: {
      parts: 'V2X wireless transceiver, Traffic Sign recognition camera, Cruise control.',
      behavior: 'Intercepts street unit packets and overrides a red light, forcing high-speed intersection entry.',
      passenger: '🔴 EXTREME RISK: T-bone broadside crashes at smart street junctions. Threatens passenger lives due to signal overrides.'
    }
  };

  // Socket listener for backend simulation
  useEffect(() => {
    if (!socket) return;

    socket.on('simulation-step', (data: SimulationStep) => {
      setActiveAttack(data.type);
      setCurrentStage(data.stage);
      setLogMessage(data.text);
      setThreatLevel(data.threatLevel);
      setIsDefenseActive(data.isDefenseActive);
      
      // Calculate dynamic car road offsets based on backend stage
      triggerAnimationFeedback(data.type, data.stage);
      
      if (onAttackStateChange) {
        onAttackStateChange(data.type, data.stage);
      }
    });

    socket.on('simulation-reset', () => {
      resetLocalStates();
      if (onAttackStateChange) {
        onAttackStateChange(null, 1);
      }
    });

    return () => {
      socket.off('simulation-step');
      socket.off('simulation-reset');
    };
  }, [socket, onAttackStateChange]);

  // Handle visual shifts based on current stage
  const triggerAnimationFeedback = (type: string, stage: number) => {
    // Stage 1: Safe normal
    if (stage === 1) {
      resetLocalStates();
      return;
    }

    if (type === 'gps_spoofing') {
      if (stage === 2) {
        setCarOffsetTranslateY(-8); // slight drift left
        setSpeed(62);
        setBrakePressure(5);
      } else if (stage === 3) {
        setCarOffsetTranslateY(15); // extreme drift right off-lane
        setSpeed(52);
        setBrakePressure(18); // autopilot correction braking
      } else if (stage >= 4) {
        setCarOffsetTranslateY(0); // isolated/defended safe lane restore
        setSpeed(stage === 6 ? 0 : 30);
        setBrakePressure(stage === 6 ? 100 : 0);
      }
    } else if (type === 'can_bus') {
      if (stage === 2) {
        setWheelSpinSpeed(1.8);
        setBrakePressure(0);
      } else if (stage === 3) {
        setWheelSpinSpeed(3.5); // high-speed wheels spin
        setSpeed(120);
        setBrakePressure(0); // driver locks braking attempt
      } else if (stage >= 4) {
        setWheelSpinSpeed(stage === 6 ? 0 : 0.8);
        setSpeed(stage === 6 ? 0 : 40);
        setBrakePressure(stage === 6 ? 100 : 30); // safe mitigation braking
      }
    } else if (type === 'sensor_spoofing') {
      if (stage === 2) {
        setGhostObstacleVisible(true);
        setBrakePressure(0);
      } else if (stage === 3) {
        setGhostObstacleVisible(true);
        setSpeed(0); // sudden halt stop
        setBrakePressure(100); // 100% emergency brake!
      } else if (stage >= 4) {
        setGhostObstacleVisible(false); // filtered
        setSpeed(stage === 6 ? 60 : 45);
        setBrakePressure(0);
      }
    } else if (type === 'theft_attempt') {
      if (stage === 2) {
        setKeyAlertPulse(true);
        setBrakePressure(0);
      } else if (stage === 3) {
        setKeyAlertPulse(true);
        setSpeed(45);
        setBrakePressure(0);
      } else if (stage >= 4) {
        setKeyAlertPulse(false);
        setSpeed(stage === 6 ? 0 : 10);
        setBrakePressure(stage === 6 ? 100 : 45); // remote lock slowing down
      }
    } else if (type === 'fake_traffic_signal') {
      if (stage === 2) {
        setTrafficLightState('RED');
        setBrakePressure(0);
      } else if (stage === 3) {
        setTrafficLightState('RED');
        setSpeed(110); // ignores red light, speeds up
        setBrakePressure(0);
      } else if (stage >= 4) {
        setTrafficLightState('GREEN');
        setSpeed(stage === 6 ? 50 : 60);
        setBrakePressure(stage === 6 ? 100 : 15);
      }
    }
  };

  const resetLocalStates = () => {
    setCarOffsetTranslateY(0);
    setWheelSpinSpeed(1);
    setGhostObstacleVisible(false);
    setTrafficLightState('GREEN');
    setKeyAlertPulse(false);
    setSpeed(65);
    setBrakePressure(0);
  };

  // Local fallback simulation runner
  const runLocalSimulation = (attackType: string) => {
    setActiveAttack(attackType);
    let stage = 1;
    
    const runStep = () => {
      let text = '';
      let threat: 'MINIMAL' | 'LOW' | 'HIGH' = 'MINIMAL';
      let defense = false;

      switch (attackType) {
        case 'gps_spoofing':
          if (stage === 1) { text = 'Vehicle moving normally along GPS corridor.'; threat = 'MINIMAL'; }
          else if (stage === 2) { text = 'External GPS spoofing hardware transmitting signal noise.'; threat = 'LOW'; }
          else if (stage === 3) { text = 'Spoofing success. Vehicle navigation reports false location, drifting off-course.'; threat = 'HIGH'; }
          else if (stage === 4) { text = 'Guardian Engine detects telemetry contradiction. Secondary inertial sensor voting initialized.'; threat = 'HIGH'; defense = true; }
          else if (stage === 5) { text = 'Spoofed GPS signals filtered. Guardian locks guidance using local sensors.'; threat = 'LOW'; defense = true; }
          else if (stage === 6) { text = 'Safe landing. Driver alerted to verify GPS. Safe mode engaged.'; threat = 'MINIMAL'; defense = true; }
          break;
        case 'can_bus':
          if (stage === 1) { text = 'CAN Controller communicating with power train and steering.'; threat = 'MINIMAL'; }
          else if (stage === 2) { text = 'Suspicious frame injectors broadcasting anomalous node packets.'; threat = 'LOW'; }
          else if (stage === 3) { text = 'CAN injection overwrite: Acceleration throttle commands hijacked, doors locked.'; threat = 'HIGH'; }
          else if (stage === 4) { text = 'Intrusion Detection System (IDS) activates. Network isolation begins.'; threat = 'HIGH'; defense = true; }
          else if (stage === 5) { text = 'Compromised ECU segment quarantined. Drive-by-wire safely bypassed.'; threat = 'LOW'; defense = true; }
          else if (stage === 6) { text = 'Standard control restored. Vehicle diagnostic logs stored. Drive bypass complete.'; threat = 'MINIMAL'; defense = true; }
          break;
        case 'sensor_spoofing':
          if (stage === 1) { text = 'LiDAR and cameras scanning clear highway trajectory.'; threat = 'MINIMAL'; }
          else if (stage === 2) { text = 'External laser pointers painting fake obstacles on LiDAR receiver.'; threat = 'LOW'; }
          else if (stage === 3) { text = 'Vehicle brakes suddenly: Ghost obstacles detected 1m ahead.'; threat = 'HIGH'; }
          else if (stage === 4) { text = 'Multi-sensor sensor fusion validates ghost object against camera optical feed.'; threat = 'HIGH'; defense = true; }
          else if (stage === 5) { text = 'LiDAR validation mismatch. System switches autopilot routing to Camera + Radar.'; threat = 'LOW'; defense = true; }
          else if (stage === 6) { text = 'Autopilot operating on authenticated channels. Scanner calibration required.'; threat = 'MINIMAL'; defense = true; }
          break;
        case 'theft_attempt':
          if (stage === 1) { text = 'Vehicle locked in smart garage monitoring.'; threat = 'MINIMAL'; }
          else if (stage === 2) { text = 'Key-fob relay device replicating passive entry authentication.'; threat = 'LOW'; }
          else if (stage === 3) { text = 'Unlocks complete. Vehicle engine started, moving unauthorized.'; threat = 'HIGH'; }
          else if (stage === 4) { text = 'Geofence warning: Vehicle out of range. Remote lockout command transmitted.'; threat = 'HIGH'; defense = true; }
          else if (stage === 5) { text = 'Safe speed limiting active. Smart lock triggers fuel pump shutoff.'; threat = 'LOW'; defense = true; }
          else if (stage === 6) { text = 'Stolen vehicle locked and recovery dispatch triggered. Location: Smart City Core.'; threat = 'MINIMAL'; defense = true; }
          break;
        case 'fake_traffic_signal':
          if (stage === 1) { text = 'Approaching signal junction with speed limit 80.'; threat = 'MINIMAL'; }
          else if (stage === 2) { text = 'Hacked roadside unit broadcasting fake speed limit (140km/h) override.'; threat = 'LOW'; }
          else if (stage === 3) { text = 'Autopilot accelerates, matching fake speed override on public network.'; threat = 'HIGH'; }
          else if (stage === 4) { text = 'Guardian matches signs from camera optical text recognition with V2X speed commands.'; threat = 'HIGH'; defense = true; }
          else if (stage === 5) { text = 'Visual verification conflicts with network data. Network sign packet blocked.'; threat = 'LOW'; defense = true; }
          else if (stage === 6) { text = 'Vehicle resumes safe cruise speed, reporting corrupted local signal tower to city backend.'; threat = 'MINIMAL'; defense = true; }
          break;
      }

      setCurrentStage(stage);
      setLogMessage(text);
      setThreatLevel(threat);
      setIsDefenseActive(defense);
      triggerAnimationFeedback(attackType, stage);

      if (onAttackStateChange) {
        onAttackStateChange(attackType, stage);
      }

      if (stage < 6) {
        stage++;
        const timer = setTimeout(runStep, 3500);
        return () => clearTimeout(timer);
      }
    };

    runStep();
  };

  const triggerAttack = async (attackType: string) => {
    if (backendConnected) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        await fetch(`${backendUrl}/api/simulation/attack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attackType })
        });
      } catch (err) {
        console.error('Failed to trigger API attack, falling back to local simulation:', err);
        runLocalSimulation(attackType);
      }
    } else {
      runLocalSimulation(attackType);
    }
  };

  const triggerReset = async () => {
    if (backendConnected) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        await fetch(`${backendUrl}/api/simulation/reset`, { method: 'POST' });
      } catch (err) {
        console.error('Failed API reset, resetting locally:', err);
      }
    }
    setActiveAttack(null);
    setCurrentStage(1);
    setLogMessage('Select an attack scenario to begin simulation.');
    setThreatLevel('MINIMAL');
    setIsDefenseActive(false);
    resetLocalStates();
    if (onAttackStateChange) {
      onAttackStateChange(null, 1);
    }
  };

  const getThreatColor = (level: string) => {
    if (level === 'HIGH') return 'text-brand-danger bg-brand-danger/10 border-brand-danger/30';
    if (level === 'LOW') return 'text-brand-warning bg-brand-warning/10 border-brand-warning/30';
    return 'text-brand-secondary bg-brand-secondary/10 border-brand-secondary/30';
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 1. Attack selection controls (Left) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xl font-display font-bold text-brand-text mb-4 flex items-center gap-2">
            <ShieldAlert className="text-brand-primary h-5 w-5" /> Threat Catalog
          </h3>
          
          {attacks.map((att) => {
            const IconComp = att.icon;
            const isCurrent = activeAttack === att.id;
            return (
              <button
                key={att.id}
                onClick={() => triggerAttack(att.id)}
                disabled={activeAttack !== null}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 shadow-sm ${
                  isCurrent
                    ? 'bg-white border-brand-danger shadow-[0_0_20px_rgba(220,38,38,0.15)] ring-1 ring-brand-danger/20'
                    : 'bg-white/95 hover:bg-white border-brand-primary/15 hover:border-brand-primary/45 disabled:opacity-50'
                }`}
              >
                <div className={`p-2.5 rounded-lg border ${isCurrent ? 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger animate-pulse' : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'}`}>
                  <IconComp className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-brand-text text-sm md:text-base">{att.label}</span>
                    {isCurrent && (
                      <span className="text-xs uppercase tracking-widest text-brand-danger font-mono font-bold animate-pulse">
                        Injecting...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-subtext mt-1 line-clamp-2">{att.desc}</p>
                </div>
              </button>

            );
          })}

          {activeAttack && (
            <button
              onClick={triggerReset}
              className="w-full bg-brand-danger hover:bg-brand-danger/90 border border-brand-danger text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold shadow-md shadow-brand-danger/20 hover:shadow-brand-danger/35"
            >
              <RotateCcw className="h-4 w-4" /> Reset Simulation
            </button>
          )}
        </div>

        {/* 2. Simulation visualization canvas (Right) */}
        <div className="lg:col-span-7 bg-white/95 border border-brand-primary/15 rounded-2xl p-6 relative overflow-hidden shadow-lg">
          {/* Subtle background gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="flex justify-between items-center border-b border-brand-primary/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Activity className="text-brand-secondary h-5 w-5 animate-pulse" />
              <div>
                <h4 className="font-display font-semibold text-brand-text text-sm md:text-base">System Telemetry Stream</h4>
                <p className="text-[10px] md:text-xs text-brand-subtext font-mono">CAR-2035 // Live telemetry</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full border font-mono font-semibold uppercase ${getThreatColor(threatLevel)}`}>
                Threat Level: {threatLevel}
              </span>
            </div>
          </div>


          {/* 3D WebGL Live Road Simulation */}
          <div className="relative bg-slate-900 rounded-xl h-72 overflow-hidden border border-brand-primary/15 flex items-center justify-center shadow-inner">
            <ThreeSimulator
              activeAttack={activeAttack}
              currentStage={currentStage}
              speed={speed}
              wheelSpinSpeed={wheelSpinSpeed}
              brakePressure={brakePressure}
            />

            {/* HUD Dashboard Overlays */}
            <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 flex flex-col gap-1.5 pointer-events-none select-none text-[10px] font-mono text-white shadow-md z-10 w-28">
              <span className="text-[8.5px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-0.5 mb-0.5 font-bold">Telemetry</span>
              <div className="flex justify-between items-center">
                <span>SPEED:</span>
                <span className={`font-bold ${speed > 100 ? 'text-brand-danger font-black animate-pulse' : 'text-brand-secondary'}`}>
                  {speed} km/h
                </span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${speed > 100 ? 'bg-brand-danger' : 'bg-brand-secondary'}`}
                  style={{ width: `${Math.min(100, (speed / 140) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <span>BRAKE:</span>
                <span className={`font-bold ${brakePressure > 0 ? 'text-brand-danger animate-pulse' : 'text-white'}`}>
                  {brakePressure}%
                </span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-danger transition-all duration-300"
                  style={{ width: `${brakePressure}%` }}
                />
              </div>
            </div>

            {/* Overlays on 3D canvas */}
            {activeAttack === 'gps_spoofing' && currentStage === 3 && (
              <div className="absolute top-4 left-4 bg-brand-danger/90 text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/20 animate-pulse">
                ⚠️ NAVIGATION GPS DRIFT WARNING: SATELLITE COHERENCE CRITICAL
              </div>
            )}

            {/* CAN Bus speed highlight */}
            {activeAttack === 'can_bus' && currentStage === 3 && (
              <div className="absolute top-4 left-4 bg-brand-danger/90 text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/20 animate-bounce">
                🚨 UNAUTHORIZED POWERTRAIN INJECTION: BUS ISOLATION ENGAGED
              </div>
            )}

            {/* Sensor barrier alert */}
            {activeAttack === 'sensor_spoofing' && currentStage >= 2 && currentStage <= 3 && (
              <div className="absolute top-4 left-4 bg-brand-danger/90 text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/20 animate-pulse">
                🛑 LIDAR PROXIMITY EVENT: DETECTED GHOST BARRIER 1M
              </div>
            )}

            {/* Keyfob theft signal alert */}
            {activeAttack === 'theft_attempt' && currentStage >= 2 && currentStage <= 3 && (
              <div className="absolute top-4 left-4 bg-brand-danger/90 text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/20 animate-pulse">
                🔑 KEYFOB RF SIGNAL AMPLIFICATION RELAY HIJACK DETECTED
              </div>
            )}

            {/* V2X signal override status */}
            {activeAttack === 'fake_traffic_signal' && currentStage >= 2 && currentStage <= 3 && (
              <div className="absolute top-4 left-4 bg-brand-danger/90 text-white font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/20 animate-pulse">
                📶 SMART INTERSECTION SPEED CORRUPTION: IGNORING V2X SIGNALS
              </div>
            )}

            {/* Emergency alert notification */}
            {isDefenseActive && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none animate-fade-in z-20">
                <div className="bg-brand-secondary/95 border border-brand-secondary text-white font-mono text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 animate-spin" /> Guardian firewall isolating nodes
                </div>
              </div>
            )}
          </div>


          {/* Logging Feed Console output */}
          <div className="mt-6 space-y-4">
            <div className="bg-brand-bg p-4 rounded-xl border border-brand-primary/10 font-mono text-xs md:text-sm text-brand-primary flex items-start gap-3 shadow-inner">
              <span className="text-brand-secondary font-bold select-none">&gt;&gt;</span>
              <p className="text-brand-text leading-relaxed">{logMessage}</p>
            </div>

            {/* Step Timeline Indicator */}
            <div>
              <div className="flex justify-between items-center text-xs text-brand-subtext mb-2">
                <span>Simulation Stages</span>
                <span className="font-mono font-semibold text-brand-text">Stage {activeAttack ? currentStage : 0} of 6</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((stg) => {
                  const isActive = activeAttack !== null && currentStage >= stg;
                  const isCurrent = activeAttack !== null && currentStage === stg;
                  let stepColor = 'bg-brand-primary/10';

                  if (isActive) {
                    if (stg >= 4) {
                      stepColor = 'bg-brand-secondary shadow-[0_0_8px_#00d084]';
                    } else if (stg >= 2) {
                      stepColor = 'bg-brand-danger shadow-[0_0_8px_#ff3b30]';
                    } else {
                      stepColor = 'bg-brand-primary/80';
                    }
                  }

                  return (
                    <div key={stg} className="relative flex flex-col items-center">
                      <div className={`h-2 w-full rounded-full transition-all duration-300 ${stepColor} ${isCurrent ? 'animate-pulse' : ''}`} />
                      <span className="text-[9px] text-brand-subtext font-mono mt-1">S{stg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SAFETY CONSEQUENCES DASHBOARD SECTION */}
      {activeAttack && (
        <div className="bg-white/95 border border-brand-danger/30 rounded-2xl p-6 shadow-lg animate-fade-in space-y-4">
          <div className="flex items-center gap-2 border-b border-brand-danger/15 pb-3">
            <AlertCircle className="text-brand-danger h-5 w-5 animate-pulse" />
            <h4 className="font-display font-bold text-brand-text text-sm md:text-base">
              Threat Consequence Analysis: <span className="text-brand-danger">{attacks.find((a) => a.id === activeAttack)?.label}</span>
            </h4>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-brand-text">
            {/* Parts column */}
            <div className="bg-brand-bg/40 p-4 rounded-xl border border-brand-primary/5 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-mono text-brand-subtext block uppercase tracking-wider font-semibold">🔧 Target Car Parts</span>
              <p className="font-bold text-brand-text">{consequencesData[activeAttack].parts}</p>
            </div>

            {/* Behavior column */}
            <div className="bg-brand-bg/40 p-4 rounded-xl border border-brand-primary/5 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-mono text-brand-subtext block uppercase tracking-wider font-semibold">⚙️ Part Malfunction Behavior</span>
              <p className="text-brand-text font-medium">{consequencesData[activeAttack].behavior}</p>
            </div>

            {/* Passenger impact column */}
            <div className="bg-brand-danger/5 p-4 rounded-xl border border-brand-danger/20 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-mono text-brand-danger block uppercase tracking-wider font-bold">👤 Human/Passenger Impact</span>
              <p className="text-brand-text font-semibold">{consequencesData[activeAttack].passenger}</p>
            </div>
          </div>

          <div className="bg-brand-secondary/5 border border-brand-secondary/20 p-3 rounded-xl flex items-center gap-3 text-xs">
            <Shield className="text-brand-secondary h-4.5 w-4.5 shrink-0" />
            <p className="text-brand-text font-medium">
              <strong>Guardian Protection:</strong> The secondary filter quarantines data on these buses, blocking the hijack within <strong>100 milliseconds</strong> and protecting the passengers from collision risks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
