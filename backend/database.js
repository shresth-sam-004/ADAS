const mongoose = require('mongoose');

let isConnected = false;
const memoryDb = {
  attackLogs: [],
  vehicleState: {
    vehicleId: 'CAR-2035',
    speed: 0,
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
  }
};

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ [DB] MONGODB_URI not set. Running in-memory database fallback.');
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log('\x1b[32m%s\x1b[0m', '✅ [DB] MongoDB Connected Successfully.');
    return true;
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', `❌ [DB] MongoDB Connection Failed: ${error.message}`);
    console.log('\x1b[33m%s\x1b[0m', '⚠️ [DB] Falling back to in-memory database...');
    return false;
  }
}

// Schemas (only compiled if MongoDB is connected, otherwise mocked)
let AttackLogModel;
let VehicleStateModel;

if (mongoose.models && mongoose.models.AttackLog) {
  AttackLogModel = mongoose.models.AttackLog;
} else {
  const AttackLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    attackType: { type: String, required: true },
    affectedComponent: { type: String, required: true },
    threatLevel: { type: String, required: true },
    status: { type: String, required: true },
    details: { type: String }
  });
  AttackLogModel = mongoose.model('AttackLog', AttackLogSchema);
}

if (mongoose.models && mongoose.models.VehicleState) {
  VehicleStateModel = mongoose.models.VehicleState;
} else {
  const VehicleStateSchema = new mongoose.Schema({
    vehicleId: { type: String, default: 'CAR-2035' },
    speed: { type: Number, default: 0 },
    heading: { type: String, default: 'North-East' },
    latitude: { type: Number, default: 17.3850 },
    longitude: { type: Number, default: 78.4867 },
    gpsStatus: { type: String, default: 'Active' },
    adasStatus: { type: String, default: 'Active' },
    sensorsProtected: { type: Boolean, default: true },
    emergencySystem: { type: String, default: 'Online' },
    threatLevel: { type: String, default: 'MINIMAL' },
    healthScore: { type: Number, default: 100 },
    networkSecurity: { type: String, default: 'SECURE' },
    gpsIntegrity: { type: String, default: '100%' },
    emergencyReadiness: { type: String, default: 'READY' },
    remoteLockState: { type: String, default: 'UNLOCKED' },
    sirenState: { type: String, default: 'OFF' }
  });
  VehicleStateModel = mongoose.model('VehicleState', VehicleStateSchema);
}

// Interface wrapper to work with MongoDB or Memory DB
const db = {
  connectDB,
  saveAttackLog: async (logData) => {
    if (isConnected) {
      try {
        const log = new AttackLogModel(logData);
        return await log.save();
      } catch (err) {
        console.error('Error saving attack log to MongoDB:', err);
      }
    }
    // Memory fallback
    const mockLog = { ...logData, timestamp: new Date(), _id: Math.random().toString(36).substr(2, 9) };
    memoryDb.attackLogs.unshift(mockLog);
    if (memoryDb.attackLogs.length > 50) memoryDb.attackLogs.pop(); // Keep last 50
    return mockLog;
  },

  getAttackLogs: async () => {
    if (isConnected) {
      try {
        return await AttackLogModel.find().sort({ timestamp: -1 }).limit(30);
      } catch (err) {
        console.error('Error getting attack logs from MongoDB:', err);
      }
    }
    return memoryDb.attackLogs;
  },

  getVehicleState: async () => {
    if (isConnected) {
      try {
        let state = await VehicleStateModel.findOne({ vehicleId: 'CAR-2035' });
        if (!state) {
          state = new VehicleStateModel();
          await state.save();
        }
        return state;
      } catch (err) {
        console.error('Error getting vehicle state from MongoDB:', err);
      }
    }
    return memoryDb.vehicleState;
  },

  updateVehicleState: async (updateData) => {
    if (isConnected) {
      try {
        return await VehicleStateModel.findOneAndUpdate(
          { vehicleId: 'CAR-2035' },
          { $set: updateData },
          { new: true, upsert: true }
        );
      } catch (err) {
        console.error('Error updating vehicle state in MongoDB:', err);
      }
    }
    // Memory fallback
    memoryDb.vehicleState = { ...memoryDb.vehicleState, ...updateData };
    return memoryDb.vehicleState;
  }
};

module.exports = db;
