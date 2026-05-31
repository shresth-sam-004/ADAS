'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Radio, MapPin, Activity, ShieldAlert, CheckCircle, ArrowRight, Zap, Network, Lock, Server, AlertTriangle, Info } from 'lucide-react';

export default function ECEIntegration() {
  const [isAttackActive, setIsAttackActive] = useState(false);
  const [lidarJitter, setLidarJitter] = useState(19.8);
  const [camJitter, setCamJitter] = useState(20.4);

  // Simulate live sensor jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setLidarJitter(19.8 + (Math.random() * 0.2 - 0.1));
      if (!isAttackActive) {
        setCamJitter(20.4 + (Math.random() * 0.2 - 0.1));
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isAttackActive]);

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
      <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold block">Section 03 // Hardware Architecture</span>
          <h2 className="text-2xl md:text-4xl font-display font-black text-white">
            Physical Prototype & ECE Integration
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Real-world sensor data powering the cybersecurity decision engine. Demonstrating the critical bridge between physical embedded systems and algorithmic threat detection.
          </p>
        </div>

        {/* Plain English Explanation Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left max-w-3xl mx-auto flex gap-5 items-start shadow-xl hover:border-cyan-400/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-1">
            <Info className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
              How it Works
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Think of this section as the <strong>eyes and ears</strong> of the self-driving car. We built a physical mini-computer (the ESP32) connected to real sensors that measure distance and movement.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Instead of relying entirely on software simulations, this hardware prototype actively scans its physical surroundings and sends that real data to our cybersecurity brain. If a hacker tries to physically tamper with or blind these sensors (which you can simulate using the attack button below), the brain instantly notices the fake data and stops the car safely.
            </p>
          </div>
        </div>
      </div>

      {/* SPLIT SCREEN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        
        {/* LEFT: HARDWARE DIGITAL TWIN */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
          <div className="absolute top-6 left-6 text-[10px] font-mono text-white/60 uppercase tracking-widest font-bold">
            Hardware Digital Twin
          </div>
          
          {/* Animated Background Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
            <line x1="50%" y1="20%" x2="50%" y2="80%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" className="animate-[highway-scroll_3s_linear_infinite]" />
            <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" className="animate-[highway-scroll_3s_linear_infinite]" />
          </svg>

          {/* Center Hub: ESP32 */}
          <div className="relative z-10 group">
            <div className="w-24 h-24 bg-slate-900 border border-white/20 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.15)] cursor-pointer hover:border-cyan-400 transition-colors">
              <Cpu className="text-cyan-400 h-8 w-8 mb-2" />
              <span className="text-xs font-mono font-bold text-white">ESP32 Core</span>
            </div>
            {/* Tooltip */}
            <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 bg-black/90 border border-white/10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">Function</span>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed">Collects raw analog/digital sensor data and acts as the central IoT gateway to the cybersecurity platform.</p>
            </div>
          </div>

          {/* Surrounding Nodes */}
          {/* Top Left: Ultra 1 */}
          <div className="absolute top-[15%] left-[15%] group">
            <div className={`w-20 h-20 bg-slate-900 border ${isAttackActive ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse' : 'border-white/20'} rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors`}>
              <Radio className={isAttackActive ? 'text-rose-500 h-6 w-6 mb-1' : 'text-slate-300 h-6 w-6 mb-1'} />
              <span className="text-[10px] font-mono font-bold text-white text-center leading-tight">Ultra 1<br/>(Camera)</span>
            </div>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-40 bg-black/90 border border-white/10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">Function</span>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed">Simulates optical proximity detection. Prime target for spoofing attacks.</p>
            </div>
          </div>

          {/* Top Right: Ultra 2 */}
          <div className="absolute top-[15%] right-[15%] group">
            <div className="w-20 h-20 bg-slate-900 border border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
              <Radio className="text-emerald-400 h-6 w-6 mb-1" />
              <span className="text-[10px] font-mono font-bold text-white text-center leading-tight">Ultra 2<br/>(LiDAR)</span>
            </div>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-40 bg-black/90 border border-white/10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">Function</span>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed">Provides high-fidelity structural depth mapping to verify structural integrity.</p>
            </div>
          </div>

          {/* Bottom Left: GPS */}
          <div className="absolute bottom-[15%] left-[15%] group">
            <div className="w-20 h-20 bg-slate-900 border border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors">
              <MapPin className="text-amber-400 h-6 w-6 mb-1" />
              <span className="text-[10px] font-mono font-bold text-white text-center leading-tight">NEO-6M<br/>GPS</span>
            </div>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-black/90 border border-white/10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">Function</span>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed">Provides global coordinates for emergency alerts and trajectory tracking.</p>
            </div>
          </div>

          {/* Bottom Right: MPU */}
          <div className="absolute bottom-[15%] right-[15%] group">
            <div className="w-20 h-20 bg-slate-900 border border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors">
              <Activity className="text-purple-400 h-6 w-6 mb-1" />
              <span className="text-[10px] font-mono font-bold text-white text-center leading-tight">MPU6050<br/>IMU</span>
            </div>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-black/90 border border-white/10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">Function</span>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed">Detects sudden acceleration changes, impacts, and collision events.</p>
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE SENSOR STREAM & ATTACK */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col">
          <div className="text-[10px] font-mono text-white/60 uppercase tracking-widest font-bold mb-6">
            Live Telemetry Feed
          </div>

          <div className="space-y-4 flex-grow">
            {/* Camera / Ultra 1 */}
            <div className={`p-4 rounded-xl border transition-colors ${isAttackActive ? 'bg-rose-950/20 border-rose-500/50' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Radio className="h-4 w-4 text-slate-400" />
                  Ultra 1 (Front Camera)
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isAttackActive ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {isAttackActive ? 'Compromised' : 'Healthy'}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Distance Readout</span>
                <span className={`text-xl font-mono font-bold ${isAttackActive ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                  {isAttackActive ? '150.00' : camJitter.toFixed(2)} <span className="text-xs text-slate-500">m</span>
                </span>
              </div>
            </div>

            {/* LiDAR / Ultra 2 */}
            <div className="p-4 rounded-xl border bg-white/5 border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Radio className="h-4 w-4 text-slate-400" />
                  Ultra 2 (LiDAR)
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Distance Readout</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  {lidarJitter.toFixed(2)} <span className="text-xs text-slate-500">m</span>
                </span>
              </div>
            </div>

            {/* IMU & GPS Compact Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-white/5 border-white/10">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">GPS Signal</span>
                <span className="text-sm font-mono font-bold text-amber-400 block">Strong (3D Fix)</span>
              </div>
              <div className="p-4 rounded-xl border bg-white/5 border-white/10">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">IMU Status</span>
                <span className="text-sm font-mono font-bold text-purple-400 block">Normal (1G)</span>
              </div>
            </div>
          </div>

          {/* Attack Button */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setIsAttackActive(!isAttackActive)}
              className={`w-full py-4 rounded-xl font-mono font-bold uppercase tracking-widest text-xs transition duration-300 flex items-center justify-center gap-2 ${
                isAttackActive 
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400 hover:bg-rose-500 hover:text-white'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-rose-600 hover:border-rose-600 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              {isAttackActive ? 'Reset Hardware Sensors' : 'Simulate Hardware Attack'}
            </button>
            <p className="text-[10px] text-slate-400 font-mono text-center mt-3 leading-relaxed">
              Demonstrates how malicious voltages injected into physical hardware trigger the software trust engine.
            </p>
          </div>
        </div>
      </div>

      {/* DATA FLOW VISUALIZATION */}
      <div className="mb-16">
        <h3 className="text-center text-xs font-mono text-white/60 uppercase tracking-widest mb-8">Hardware-to-Software Pipeline</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
          {[
            { label: 'Sensor Layer', desc: 'Raw analog/digital data is physically collected from the environment.', icon: Radio, color: 'text-slate-300', hoverBorder: 'hover:border-slate-400', glow: 'shadow-[0_0_20px_rgba(148,163,184,0.15)]' },
            { label: 'ESP32 Controller', desc: 'Formats hardware data into IoT packets and transmits them via network.', icon: Cpu, color: 'text-cyan-400', hoverBorder: 'hover:border-cyan-400', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]' },
            { label: 'Trust Engine', desc: 'CSE algorithms analyze incoming packets against consensus models.', icon: ShieldAlert, color: 'text-purple-400', hoverBorder: 'hover:border-purple-400', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.15)]' },
            { label: 'Safe Response', desc: 'Quarantines the compromised sensor and safely halts the vehicle.', icon: CheckCircle, color: 'text-emerald-400', hoverBorder: 'hover:border-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]' }
          ].map((step, idx, arr) => (
            <React.Fragment key={idx}>
              <div className={`group flex flex-col items-center gap-3 p-4 bg-[#030712] border border-white/10 rounded-2xl w-40 text-center relative z-10 transition-all duration-300 cursor-help ${step.hoverBorder} hover:${step.glow}`}>
                <step.icon className={`h-6 w-6 ${step.color}`} />
                <span className="text-[10px] font-mono font-bold uppercase text-white">{step.label}</span>
                
                {/* Step-by-Step Tooltip */}
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-black/95 border border-white/10 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                  <span className={`text-[9px] ${step.color} font-bold uppercase tracking-widest block mb-1.5 border-b border-white/10 pb-1.5 text-left`}>Step 0{idx + 1}</span>
                  <p className="text-[10px] text-slate-300 font-mono leading-relaxed text-left">{step.desc}</p>
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className="hidden md:block flex-1 h-0.5 bg-white/10 relative">
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee] w-1/4 rounded animate-[highway-scroll_1.5s_linear_infinite]" />
                </div>
              )}
              {idx < arr.length - 1 && (
                <div className="md:hidden w-0.5 h-8 bg-white/10 relative"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* INTERDISCIPLINARY CONNECTION */}
      <div className="bg-[#030712] border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full group-hover:bg-cyan-500/10 transition-all duration-700" />
        
        <h3 className="text-center text-xs font-mono text-white/60 uppercase tracking-widest mb-4">Interdisciplinary Convergence</h3>
        
        <div className="max-w-4xl mx-auto text-center mb-10">
          <p className="text-[11px] text-slate-300 font-mono leading-relaxed border border-white/10 bg-black/40 rounded-xl p-5 shadow-lg relative overflow-hidden group/example">
            <span className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500"></span>
            <span className="text-white font-bold uppercase block mb-2 tracking-widest flex justify-center items-center gap-2">
              <Zap className="h-3 w-3 text-cyan-400" /> Real-World Synergy Example <Server className="h-3 w-3 text-purple-400" />
            </span>
            Imagine an attacker physically shines an infrared laser into the front proximity sensor to blind it (<strong className="text-cyan-400 font-normal">ECE Hardware Vulnerability</strong>). The sensor blindly transmits the corrupted "0m distance" data via I2C to the ESP32. The ESP32 forwards this packet to the central computer, where the <strong className="text-purple-400 font-normal">CSE Trust Algorithm</strong> instantly intercepts it. The algorithm cross-references the fake 0m reading against the healthy LiDAR and Radar data, flags the mathematical anomaly, and mathematically quarantines the compromised hardware before the car abruptly brakes. 
            <br/><br/>
            <span className="text-white/50 text-[9px] uppercase tracking-widest">Neither discipline can solve this alone. Hardware provides the telemetry; Software provides the logic.</span>
          </p>
        </div>

        <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-4 z-10 max-w-5xl mx-auto">
          
          {/* SVG Animated Connecting Line (Desktop) */}
          <svg className="hidden md:block absolute top-1/2 left-[15%] right-[15%] w-[70%] h-8 -translate-y-1/2 pointer-events-none overflow-visible z-0">
            {/* Base dashed line */}
            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="6 6" />
            {/* Animated data packet (Hardware to Software) */}
            <circle cy="50%" r="4" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)">
              <animate attributeName="cx" values="0%; 100%" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Animated data packet (Software to Hardware/Response) */}
            <circle cy="50%" r="4" fill="#c084fc" filter="drop-shadow(0 0 4px #c084fc)">
              <animate attributeName="cx" values="100%; 0%" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </svg>
          
          {/* ECE Card */}
          <div className="bg-[#030712] border border-white/10 p-6 rounded-2xl w-full md:w-[30%] hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] transition-all duration-300 cursor-default z-10">
            <h4 className="text-cyan-400 font-display font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" /> ECE Contribution
            </h4>
            <div className="text-[10px] text-slate-400 font-mono mb-4 border-b border-white/10 pb-3">The Physical Hardware Layer</div>
            <ul className="space-y-4">
              {[
                { title: 'Sensors & Actuators', desc: 'Analog/Digital data from Ultrasonic, GPS, IMU.' }, 
                { title: 'Embedded C++ / ESP32', desc: 'Microcontroller programming & RTOS.' }, 
                { title: 'Data Acquisition', desc: 'I2C / UART serial communication protocols.' }
              ].map((item, i) => (
                <li key={i} className="group/item flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#22d3ee] group-hover/item:animate-ping" />
                  <div>
                    <div className="text-xs font-mono text-slate-200 transition-colors group-hover/item:text-cyan-400">{item.title}</div>
                    <div className="text-[9.5px] font-mono text-slate-500 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Center Connector */}
          <div className="flex flex-col items-center justify-center space-y-4 w-full md:w-[20%] py-8 z-10 bg-[#030712] rounded-full border border-white/5 shadow-xl">
            <Network className="h-8 w-8 text-white/40 group-hover:text-cyan-400 transition-colors duration-500 animate-pulse" />
            <div className="text-center">
              <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest block mb-1">Convergence</span>
              <span className="text-sm font-bold text-white uppercase tracking-widest">ADAS Guardian</span>
            </div>
            <Lock className="h-8 w-8 text-white/40 group-hover:text-purple-400 transition-colors duration-500" />
          </div>

          {/* CSE Card */}
          <div className="bg-[#030712] border border-white/10 p-6 rounded-2xl w-full md:w-[30%] hover:border-purple-400 hover:shadow-[0_0_30px_rgba(192,132,252,0.15)] transition-all duration-300 cursor-default z-10">
            <h4 className="text-purple-400 font-display font-bold mb-4 flex items-center gap-2">
              <Server className="h-5 w-5" /> CSE Contribution
            </h4>
            <div className="text-[10px] text-slate-400 font-mono mb-4 border-b border-white/10 pb-3">The Cybersecurity Layer</div>
            <ul className="space-y-4">
              {[
                { title: 'Trust Algorithm', desc: 'Consensus matrices for anomaly detection.' }, 
                { title: 'React / WebGL UI', desc: '3D digital twin and interactive telemetry.' }, 
                { title: 'API Integration', desc: 'Node.js backend and Telegram bot alerts.' }
              ].map((item, i) => (
                <li key={i} className="group/item flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_5px_#c084fc] group-hover/item:animate-ping" />
                  <div>
                    <div className="text-xs font-mono text-slate-200 transition-colors group-hover/item:text-purple-400">{item.title}</div>
                    <div className="text-[9.5px] font-mono text-slate-500 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

    </section>
  );
}
