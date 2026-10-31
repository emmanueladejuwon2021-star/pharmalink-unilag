const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');

async function runDevServer() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('[Dev DB] MongoMemoryServer started at', uri);
  await mongoose.connect(uri);

  const server = app.listen(config.port, () => {
    console.log(`[Dev Server] PharmaLink API running on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

runDevServer();
