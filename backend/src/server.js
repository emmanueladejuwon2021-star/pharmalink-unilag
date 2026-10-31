const app = require('./app');
const config = require('./config');
const { connectDB, disconnectDB } = require('./config/database');

async function startServer() {
  try {
    // Attempt database connection, warn if MongoDB is not running locally in dev
    try {
      await connectDB(config.mongoUri);
    } catch (dbErr) {
      console.warn(`[Warning] MongoDB not available at ${config.mongoUri}. API running in detached DB mode.`);
    }

    const server = app.listen(config.port, () => {
      console.log(`[PharmaLink API] Server running in ${config.env} mode on http://localhost:${config.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal server boot error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
