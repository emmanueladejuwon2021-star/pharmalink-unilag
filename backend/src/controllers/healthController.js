const { getDatabaseStatus } = require('../config/database');

const uptimeStart = Date.now();

function getHealth(req, res) {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'ok',
    appName: 'PharmaLink UNILAG API',
    uptimeSeconds: Math.floor((Date.now() - uptimeStart) / 1000),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: '1.0.0'
  });
}

module.exports = {
  getHealth
};
