const path = require('path');
const fs = require('fs');
const net = require('net');
const { spawn } = require('child_process');
const mongoose = require('mongoose');

let mongodProcess = null;
let memoryServer = null;

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function findMongodBinary() {
  const possiblePaths = [
    'C:\\Users\\kthir\\.cache\\mongodb-binaries\\mongod-x64-win32-6.0.14.exe',
    path.join(process.env.USERPROFILE || '', '.cache', 'mongodb-binaries', 'mongod-x64-win32-6.0.14.exe'),
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  const defaultUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/genomics_workflow';

  // 1. Check if port 27017 is already listening
  const portOpen = await isPortOpen(27017);

  if (!portOpen) {
    const mongodBin = findMongodBinary();
    if (mongodBin) {
      console.log('[Database] Starting persistent MongoDB daemon on port 27017...');
      const dbPath = path.resolve(__dirname, '..', 'data', 'db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongodProcess = spawn(mongodBin, ['--dbpath', dbPath, '--port', '27017', '--bind_ip', '127.0.0.1'], {
        stdio: 'ignore',
        detached: false,
      });

      // Poll until port 27017 is accepting connections (up to 10 seconds)
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await isPortOpen(27017)) {
          console.log('[Database] MongoDB daemon is ready and listening on port 27017.');
          break;
        }
      }
    }
  }

  try {
    await mongoose.connect(defaultUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected successfully to: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
  } catch (err) {
    console.warn(`[Database] Direct connection to localhost:27017 failed (${err.message}). Trying in-memory fallback...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {},
        spawn: { timeout: 60000 },
      });
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Embedded MongoMemoryServer connected at: ${memUri}`);
    } catch (memErr) {
      console.error('[Database] All MongoDB startup options failed:', memErr);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
  if (mongodProcess && !mongodProcess.killed) {
    try {
      mongodProcess.kill();
    } catch (e) {}
  }
};

// Cleanup handlers on process exit
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB };
