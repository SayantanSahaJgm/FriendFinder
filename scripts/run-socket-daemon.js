const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const out = fs.openSync(path.join(logsDir, 'socket.out.log'), 'a');
const err = fs.openSync(path.join(logsDir, 'socket.err.log'), 'a');

const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
  detached: true,
  stdio: ['ignore', out, err]
});

child.unref();
console.log('Socket server started as detached process, pid:', child.pid);
