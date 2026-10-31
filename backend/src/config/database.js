const mongoose = require('mongoose');

let isConnected = false;

async function connectDB(uri) {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmalink_dev';
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('[Database] MongoDB connected successfully.');
  } catch (err) {
    console.error('[Database] MongoDB connection error:', err.message);
    throw err;
  }
}

async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[Database] MongoDB disconnected.');
}

function getDatabaseStatus() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'unknown',
    readyState: stateCode,
    connected: stateCode === 1
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDatabaseStatus
};
