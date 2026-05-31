'use client';
import { useEffect, useRef, useState } from 'react';
import { Shield, ShieldAlert, Heart, HardDrive, Cpu, Radio, HeartPulse, Network } from 'lucide-react';

interface LogItem {
  _id?: string;
  timestamp: string;
  attackType: string;
  affectedComponent: string;
  threatLevel: string;
  status: string;
  details: string;
}

interface CommandCenterProps {
  vehicleState: {
    speed: number;
    gpsStatus: string;
    adasStatus: string;
    sensorsProtected: boolean;
    threatLevel: 'MINIMAL' | 'LOW' | 'HIGH';
    healthScore: number;
    networkSecurity: string;
    gpsIntegrity: string;
    emergencyReadiness: string;
    remoteLockState: string;
    sirenState: string;
  };
  attackLogs: LogItem[];
}

export default function CommandCenter({ vehicleState, attackLogs }: CommandCenterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataPoints, setDataPoints] = useState<number[]>([2, 5, 3, 4, 2, 3, 5, 2, 4, 3]);

  // Chart Telemetry Generator
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints((prev) => {
        let nextVal = 2 + Math.floor(Math.random() * 4);
        if (vehicleState.threatLevel === 'HIGH') {
          nextVal = 8 + Math.floor(Math.random() * 3);
        } else if (vehicleState.threatLevel === 'LOW') {
          nextVal = 5 + Math.floor(Math.random() * 3);
        }
        const updated = [...prev.slice(1), nextVal];
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [vehicleState.threatLevel]);

  // Render Canvas Line Chart (Light Tech style)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.clientWidth);
    const height = (canvas.height = canvas.clientHeight || 150);

    ctx.clearRect(0, 0, width, height);

    // Chart Grid Lines
    ctx.strokeStyle = 'rgba(0, 102, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Chart Gradient Line
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (vehicleState.threatLevel === 'HIGH') {
      grad.addColorStop(0, 'rgba(255, 59, 48, 0.15)');
      grad.addColorStop(1, 'rgba(255, 59, 48, 0.0)');
      ctx.strokeStyle = '#ff3b30';
    } else if (vehicleState.threatLevel === 'LOW') {
      grad.addColorStop(0, 'rgba(255, 159, 0, 0.15)');
      grad.addColorStop(1, 'rgba(255, 159, 0, 0.0)');
      ctx.strokeStyle = '#ff9f00';
    } else {
      grad.addColorStop(0, 'rgba(0, 208, 132, 0.15)');
      grad.addColorStop(1, 'rgba(0, 208, 132, 0.0)');
      ctx.strokeStyle = '#00d084';
    }

    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const dx = width / (dataPoints.length - 1);
    dataPoints.forEach((val, idx) => {
      const x = dx * idx;
      const y = height - (val / 12) * height;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill under path
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw dots
    dataPoints.forEach((val, idx) => {
      const x = dx * idx;
      const y = height - (val / 12) * height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = vehicleState.threatLevel === 'HIGH' ? '#ff3b30' : vehicleState.threatLevel === 'LOW' ? '#ff9f00' : '#00d084';
      ctx.fill();
    });

  }, [dataPoints, vehicleState.threatLevel]);

  // Color mappings
  const getThreatColor = (level: string) => {
    if (level === 'HIGH') return 'text-brand-danger';
    if (level === 'LOW') return 'text-brand-warning';
    return 'text-brand-secondary';
  };

  const getLogBadgeColor = (status: string) => {
    if (status === 'CRITICAL') return 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger';
    if (status === 'DEFENDED') return 'bg-brand-secondary/15 border-brand-secondary/35 text-brand-secondary';
    return 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary';
  };

  return (
    <div className="space-y-8">
      {/* 1. Core Dial/Gauges Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Widget 1: Threat Level dial */}
        <div className="bg-brand-card border border-brand-primary/10 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative">
          <ShieldAlert className={`h-8 w-8 mb-2 ${getThreatColor(vehicleState.threatLevel)}`} />
          <span className="text-xs text-brand-subtext uppercase tracking-widest font-mono">Threat Index</span>
          <span className={`text-2xl font-display font-extrabold mt-1 tracking-wide ${getThreatColor(vehicleState.threatLevel)}`}>
            {vehicleState.threatLevel}
          </span>
          <span className="text-[10px] text-brand-subtext font-mono mt-1">IPS/IDS Firewall State</span>
        </div>

        {/* Widget 2: Vehicle Health Score */}
        <div className="bg-brand-card border border-brand-primary/10 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
          <Heart className={`h-8 w-8 mb-2 ${vehicleState.healthScore > 75 ? 'text-brand-secondary' : vehicleState.healthScore > 50 ? 'text-brand-warning' : 'text-brand-danger animate-pulse'}`} />
          <span className="text-xs text-brand-subtext uppercase tracking-widest font-mono">Health Index</span>
          <span className="text-2xl font-display font-extrabold mt-1 text-brand-text">
            {vehicleState.healthScore}%
          </span>
          <span className="text-[10px] text-brand-subtext font-mono mt-1">ECU Integrity Score</span>
        </div>

        {/* Widget 3: Network Integrity */}
        <div className="bg-brand-card border border-brand-primary/10 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
          <Network className="h-8 w-8 text-brand-primary mb-2" />
          <span className="text-xs text-brand-subtext uppercase tracking-widest font-mono">CAN Security</span>
          <span className="text-xl font-display font-bold mt-1 text-brand-text truncate max-w-full">
            {vehicleState.networkSecurity}
          </span>
          <span className="text-[10px] text-brand-subtext font-mono mt-1">Encryption Mode</span>
        </div>

        {/* Widget 4: Emergency Alert State */}
        <div className="bg-brand-card border border-brand-primary/10 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
          <HeartPulse className={`h-8 w-8 mb-2 ${vehicleState.emergencyReadiness !== 'READY' ? 'text-brand-danger animate-bounce' : 'text-brand-secondary'}`} />
          <span className="text-xs text-brand-subtext uppercase tracking-widest font-mono">EMS Readiness</span>
          <span className="text-xl font-display font-bold mt-1 text-brand-text">
            {vehicleState.emergencyReadiness}
          </span>
          <span className="text-[10px] text-brand-subtext font-mono mt-1">Satellite Link Status</span>
        </div>

      </div>

      {/* 2. Charts and Diagnostics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Canvas line chart showing signals */}
        <div className="lg:col-span-7 bg-brand-card border border-brand-primary/10 rounded-xl p-5 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-display font-bold text-brand-text text-sm md:text-base">Anomalous Activity Timeline</h4>
              <p className="text-[10px] text-brand-subtext">Real-time network packets / sec</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-brand-secondary">
              <span className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-ping" /> Live Feed
            </span>
          </div>
          <div className="flex-1 min-h-[150px]">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>

        {/* Critical Systems Checklist */}
        <div className="lg:col-span-5 bg-brand-card border border-brand-primary/10 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="font-display font-bold text-brand-text text-sm md:text-base">System Node Matrix</h4>
          
          <div className="space-y-3 font-mono text-xs text-brand-text">
            {/* Row 1: GPS */}
            <div className="flex justify-between items-center border-b border-brand-primary/5 pb-2">
              <span className="text-brand-subtext flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-brand-primary" /> GPS Module
              </span>
              <span className={`font-semibold ${vehicleState.gpsStatus.includes('Compromised') ? 'text-brand-danger' : 'text-brand-secondary'}`}>
                {vehicleState.gpsStatus} ({vehicleState.gpsIntegrity})
              </span>
            </div>

            {/* Row 2: ADAS Autopilot */}
            <div className="flex justify-between items-center border-b border-brand-primary/5 pb-2">
              <span className="text-brand-subtext flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-brand-primary" /> Autopilot (ADAS)
              </span>
              <span className={`font-semibold ${vehicleState.adasStatus.includes('Disabled') || vehicleState.adasStatus.includes('Compromised') ? 'text-brand-danger' : 'text-brand-secondary'}`}>
                {vehicleState.adasStatus}
              </span>
            </div>

            {/* Row 3: Remote Lock */}
            <div className="flex justify-between items-center border-b border-brand-primary/5 pb-2">
              <span className="text-brand-subtext flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-brand-primary" /> Remote Doors
              </span>
              <span className="font-semibold text-brand-text">{vehicleState.remoteLockState}</span>
            </div>

            {/* Row 4: Sensors Shield */}
            <div className="flex justify-between items-center pb-1">
              <span className="text-brand-subtext flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-brand-primary" /> Physical Sensors
              </span>
              <span className={`font-semibold ${vehicleState.sensorsProtected ? 'text-brand-secondary' : 'text-brand-warning'}`}>
                {vehicleState.sensorsProtected ? 'SHIELD ACTIVE' : 'SPOOF MITIGATION'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Event logs streaming display */}
      <div className="bg-brand-card border border-brand-primary/10 rounded-xl p-5 shadow-sm">
        <h4 className="font-display font-bold text-brand-text text-sm md:text-base mb-4">Command Security Audit Logs</h4>
        
        <div className="max-h-56 overflow-y-auto space-y-2 pr-2 font-mono text-xs scrollbar-thin">
          {attackLogs.length === 0 ? (
            <div className="text-center py-8 text-brand-subtext italic">
              No security anomalies detected. Standing by...
            </div>
          ) : (
            attackLogs.map((log, idx) => (
              <div
                key={log._id || idx}
                className="bg-brand-bg p-3 rounded-lg border border-brand-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 border-l-2 border-l-brand-primary/60 transition-all hover:bg-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-brand-subtext font-mono select-none">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] border font-bold uppercase ${getLogBadgeColor(log.status)}`}>
                    {log.status}
                  </span>
                  <div className="min-w-0">
                    <span className="text-brand-text font-bold block md:inline">{log.attackType}</span>
                    <span className="text-[10px] text-brand-subtext md:ml-2">({log.affectedComponent})</span>
                  </div>
                </div>
                <p className="text-brand-subtext text-[11px] max-w-lg md:text-right truncate">{log.details}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
