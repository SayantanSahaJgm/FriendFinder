// Spawn the server as a child process, pipe logs, then run the simulator
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.resolve(__dirname, '..', 'server.js');
const simPath = path.resolve(__dirname, 'simulate-random-chat-clients.js');

console.log('Spawning server:', serverPath);
const server = spawn(process.execPath, [serverPath], {
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe']
});

server.stdout.on('data', (d) => process.stdout.write(`[server stdout] ${d}`));
server.stderr.on('data', (d) => process.stderr.write(`[server stderr] ${d}`));

server.on('exit', (code, sig) => {
  console.log(`Server process exited with code=${code} sig=${sig}`);
});

// Wait a short time for server to start
setTimeout(() => {
  console.log('Starting simulator now...');
  const sim = spawn(process.execPath, [simPath], {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit'
  });

  sim.on('exit', (code) => {
    console.log('Simulator exited with code', code);
    // Give server a second to flush logs then kill it
    setTimeout(() => {
      if (!server.killed) {
        server.kill();
      }
      process.exit(code);
    }, 1000);
  });
}, 1000);
