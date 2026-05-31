require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const db = require('./database');
const telegram = require('./telegramBot');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Cache variables for active simulators
let activeSimulation = null;
let simulationTimeout = null;

// Initialize Telegram Bot and inject socket instance
telegram.initBot(io);

// Express Routes
app.get('/api/vehicle/state', async (req, res) => {
  try {
    const state = await db.getVehicleState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vehicle/command', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Command parameter missing' });

  try {
    const reply = await telegram.processCommand(command);
    const updatedState = await db.getVehicleState();
    res.json({ reply, state: updatedState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await db.getAttackLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger a cyber attack simulation sequence
app.post('/api/simulation/attack', async (req, res) => {
  const { attackType } = req.body;
  if (!attackType) return res.status(400).json({ error: 'attackType is required' });

  // Cancel any active simulation
  if (activeSimulation) {
    clearTimeout(simulationTimeout);
    activeSimulation = null;
  }

  runAttackSimulation(attackType);
  res.json({ status: 'started', attack: attackType });
});

// Reset vehicle telemetry to standard defaults
app.post('/api/simulation/reset', async (req, res) => {
  if (activeSimulation) {
    clearTimeout(simulationTimeout);
    activeSimulation = null;
  }

  await db.updateVehicleState({
    speed: 65,
    heading: 'North-East',
    latitude: 17.3850,
    longitude: 78.4867,
    gpsStatus: 'Active',
    adasStatus: 'Active',
    sensorsProtected: true,
    emergencySystem: 'Online',
    threatLevel: 'MINIMAL',
    healthScore: 100,
    networkSecurity: 'SECURE',
    gpsIntegrity: '100%',
    emergencyReadiness: 'READY',
    remoteLockState: 'UNLOCKED',
    sirenState: 'OFF'
  });

  io.emit('vehicle-update', await db.getVehicleState());
  io.emit('simulation-reset');
  res.json({ status: 'reset' });
});

// Socket.io Connection
io.on('connection', async (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Send current state and logs immediately
  socket.emit('vehicle-update', await db.getVehicleState());
  socket.emit('logs-update', await db.getAttackLogs());

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Simulator State Machine
async function runAttackSimulation(type) {
  activeSimulation = type;
  let stage = 1;
  const totalStages = 6;

  console.log(`🚀 Starting cyber attack simulation: ${type}`);

  // Base configurations for simulations
  const runStep = async () => {
    if (activeSimulation !== type) return; // Terminated early by another action

    let update = {};
    let logMsg = '';
    let notificationText = '';
    let isDefenseActive = stage >= 4;

    switch (type) {
      case 'gps_spoofing':
        if (stage === 1) {
          update = { speed: 60, latitude: 17.3850, longitude: 78.4867, threatLevel: 'MINIMAL', healthScore: 100, gpsIntegrity: '100%' };
          logMsg = 'Vehicle moving normally along GPS corridor.';
        } else if (stage === 2) {
          update = { speed: 62, latitude: 17.3852, longitude: 78.4871, threatLevel: 'LOW', healthScore: 90, gpsIntegrity: 'WARNING: Signal jitter detected' };
          logMsg = 'External GPS spoofing hardware transmitting signal noise.';
        } else if (stage === 3) {
          update = { speed: 58, latitude: 17.3910, longitude: 78.4988, threatLevel: 'HIGH', healthScore: 60, gpsIntegrity: 'COMPROMISED: Route mismatch' };
          logMsg = 'Spoofing success. Vehicle navigation reports false location, drifting off-course.';
        } else if (stage === 4) {
          update = { speed: 45, threatLevel: 'HIGH', healthScore: 65, networkSecurity: 'FIREWALL DETECTING ENVELOPE' };
          logMsg = 'Guardian Engine detects telemetry contradiction. Secondary inertial sensor voting initialized.';
        } else if (stage === 5) {
          update = { speed: 30, threatLevel: 'LOW', gpsStatus: 'Inertial Safe Fallback', gpsIntegrity: '100% (Inertial Verify)' };
          logMsg = 'Spoofed GPS signals filtered. Guardian locks guidance using local sensors.';
        } else if (stage === 6) {
          update = { speed: 0, threatLevel: 'MINIMAL', healthScore: 98, emergencyReadiness: 'SAFE_STANDBY' };
          logMsg = 'Safe landing. Driver alerted to verify GPS. Safe mode engaged.';
          notificationText = '🚨 *ADAS Guardian Alert* - GPS spoofing blocked. Car safely routed to stop.';
        }
        break;

      case 'can_bus':
        if (stage === 1) {
          update = { threatLevel: 'MINIMAL', healthScore: 100, remoteLockState: 'UNLOCKED' };
          logMsg = 'CAN Controller communicating with power train and steering.';
        } else if (stage === 2) {
          update = { threatLevel: 'LOW', healthScore: 85, networkSecurity: 'HIGH_LOAD' };
          logMsg = 'Suspicious frame injectors broadcasting anomalous node packets.';
        } else if (stage === 3) {
          update = { speed: 120, threatLevel: 'HIGH', healthScore: 40, adasStatus: 'Disabled', remoteLockState: 'LOCKED' };
          logMsg = 'CAN injection overwrite: Acceleration throttle commands hijacked, doors locked.';
        } else if (stage === 4) {
          update = { threatLevel: 'HIGH', healthScore: 50, networkSecurity: 'IDS BLOCKING MACS' };
          logMsg = 'Intrusion Detection System (IDS) activates. Network isolation begins.';
        } else if (stage === 5) {
          update = { speed: 40, threatLevel: 'LOW', networkSecurity: 'SANDBOXED' };
          logMsg = 'Compromised ECU segment quarantined. Drive-by-wire safely bypassed.';
        } else if (stage === 6) {
          update = { speed: 0, threatLevel: 'MINIMAL', healthScore: 90, networkSecurity: 'CLEAN' };
          logMsg = 'Standard control restored. Vehicle diagnostic logs stored. Drive bypass complete.';
          notificationText = '🚨 *ADAS Guardian Alert* - Steering and brake network injection prevented.';
        }
        break;

      case 'sensor_spoofing':
        if (stage === 1) {
          update = { threatLevel: 'MINIMAL', healthScore: 100, adasStatus: 'Active' };
          logMsg = 'LiDAR and cameras scanning clear highway trajectory.';
        } else if (stage === 2) {
          update = { threatLevel: 'LOW', healthScore: 92, adasStatus: 'Active' };
          logMsg = 'External laser pointers painting fake obstacles on LiDAR receiver.';
        } else if (stage === 3) {
          update = { speed: 5, threatLevel: 'HIGH', healthScore: 50, adasStatus: 'Emergency Braking Active' };
          logMsg = 'Vehicle brakes suddenly: Ghost obstacles detected 1m ahead.';
        } else if (stage === 4) {
          update = { threatLevel: 'HIGH', healthScore: 60 };
          logMsg = 'Multi-sensor sensor fusion validates ghost object against camera optical feed.';
        } else if (stage === 5) {
          update = { speed: 45, threatLevel: 'LOW', adasStatus: 'Fusion Active (LiDAR Quarantined)' };
          logMsg = 'LiDAR validation mismatch. System switches autopilot routing to Camera + Radar.';
        } else if (stage === 6) {
          update = { speed: 60, threatLevel: 'MINIMAL', healthScore: 95 };
          logMsg = 'Autopilot operating on authenticated channels. Scanner calibration required.';
          notificationText = '🚨 *ADAS Guardian Alert* - Sensor noise ignored. Sensor fusion overridden.';
        }
        break;

      case 'theft_attempt':
        if (stage === 1) {
          update = { threatLevel: 'MINIMAL', healthScore: 100, remoteLockState: 'LOCKED' };
          logMsg = 'Vehicle locked in smart garage monitoring.';
        } else if (stage === 2) {
          update = { threatLevel: 'LOW', healthScore: 95 };
          logMsg = 'Key-fob relay device replicating passive entry authentication.';
        } else if (stage === 3) {
          update = { latitude: 17.3852, longitude: 78.4871, threatLevel: 'HIGH', healthScore: 70, remoteLockState: 'UNLOCKED' };
          logMsg = 'Unlocks complete. Vehicle engine started, moving unauthorized.';
          notificationText = '🚨 *SUSPICIOUS VEHICLE MOVEMENT* - CAR-2035 engine ignition without owner profile key.';
        } else if (stage === 4) {
          update = { threatLevel: 'HIGH', healthScore: 75, remoteLockState: 'REMOTE_LOCKOUT_ENGAGED' };
          logMsg = 'Geofence warning: Vehicle out of range. Remote lockout command transmitted.';
        } else if (stage === 5) {
          update = { speed: 10, latitude: 17.3888, longitude: 78.4901 };
          logMsg = 'Safe speed limiting active. Smart lock triggers fuel pump shutoff.';
        } else if (stage === 6) {
          update = { speed: 0, remoteLockState: 'LOCKED', sirenState: 'ON', threatLevel: 'MINIMAL', healthScore: 99 };
          logMsg = 'Stolen vehicle locked and recovery dispatch triggered. Current location: Hyderabad Core.';
          notificationText = '🚨 *THEFT RECOVERED* - Engine dead. Doors locked. Police notified. Location: 17.3888, 78.4901.';
        }
        break;

      case 'fake_traffic_signal':
        if (stage === 1) {
          update = { speed: 70, threatLevel: 'MINIMAL', healthScore: 100 };
          logMsg = 'Approaching signal junction with speed limit 80.';
        } else if (stage === 2) {
          update = { threatLevel: 'LOW', healthScore: 95 };
          logMsg = 'Hacked roadside unit broadcasting fake speed limit (140km/h) override.';
        } else if (stage === 3) {
          update = { speed: 110, threatLevel: 'HIGH', healthScore: 60 };
          logMsg = 'Autopilot accelerates, matching fake speed override on public network.';
        } else if (stage === 4) {
          update = { threatLevel: 'HIGH', healthScore: 70 };
          logMsg = 'Guardian matches signs from camera optical text recognition with V2X speed commands.';
        } else if (stage === 5) {
          update = { speed: 60, threatLevel: 'LOW' };
          logMsg = 'Visual verification conflicts with network data. Network sign packet blocked.';
        } else if (stage === 6) {
          update = { speed: 50, threatLevel: 'MINIMAL', healthScore: 98 };
          logMsg = 'Vehicle resumes safe cruise speed, reporting corrupted local signal tower to city backend.';
          notificationText = '🚨 *ADAS Guardian Alert* - Roadside V2X packet spoofing rejected. Safely operating.';
        }
        break;
    }

    // Apply DB updates
    const newState = await db.updateVehicleState(update);
    const dbLog = await db.saveAttackLog({
      attackType: type.toUpperCase().replace('_', ' '),
      affectedComponent: type === 'gps_spoofing' ? 'GPS / GNSS' : type === 'can_bus' ? 'CAN Bus Network' : type === 'sensor_spoofing' ? 'LiDAR / Radar Fusion' : type === 'theft_attempt' ? 'Keyless Entry Module' : 'V2X Wireless Transceiver',
      threatLevel: update.threatLevel || 'LOW',
      status: isDefenseActive ? 'DEFENDED' : 'CRITICAL',
      details: logMsg
    });

    // Broadcast to UI
    io.emit('vehicle-update', newState);
    io.emit('logs-update', await db.getAttackLogs());
    io.emit('simulation-step', {
      type,
      stage,
      text: logMsg,
      timestamp: new Date(),
      threatLevel: update.threatLevel || 'LOW',
      isDefenseActive
    });

    // Trigger mock Telegram message
    if (notificationText) {
      telegram.triggerPushAlert(process.env.TELEGRAM_CHAT_ID, notificationText);
    }

    if (stage < totalStages) {
      stage++;
      simulationTimeout = setTimeout(runStep, 3500); // 3.5 seconds per step
    } else {
      activeSimulation = null;
      console.log(`🏁 Simulation completed: ${type}`);
    }
  };

  runStep();
}

// Global Telemetry Engine - simulates slight updates to vehicle when idle
setInterval(async () => {
  if (activeSimulation) return; // Don't interrupt simulator

  const state = await db.getVehicleState();
  if (state.threatLevel === 'MINIMAL') {
    // Add tiny float changes to make dashboard feel alive
    const speedChange = (Math.random() - 0.5) * 2;
    let newSpeed = Math.max(50, Math.min(80, (state.speed || 65) + speedChange));
    
    // Check if parked
    if (state.remoteLockState === 'LOCKED' && state.sirenState === 'ON') {
      newSpeed = 0;
    }

    // Small coordinate drift (moving vehicle simulator)
    let newLat = state.latitude + 0.00002;
    let newLng = state.longitude + 0.000015;

    // Reset if drift goes too far
    if (newLat > 17.5) {
      newLat = 17.3850;
      newLng = 78.4867;
    }

    const updated = await db.updateVehicleState({
      speed: Math.round(newSpeed),
      latitude: newLat,
      longitude: newLng
    });

    io.emit('vehicle-update', updated);
  }
}, 3000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', `🚀 ADAS Guardian Server running on http://localhost:${PORT}`);
});
