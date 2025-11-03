// Simple simulator for two socket.io clients to test random-chat matching
const { io: Client } = require('socket.io-client');

const SERVER_URL = process.env.SOCKET_URL || 'http://localhost:3004';

function createClient(userId, nick) {
  const socket = Client(SERVER_URL, {
    path: '/socket.io/',
    transports: ['websocket'],
    reconnectionAttempts: 3,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log(`[${nick}] connected, id=${socket.id}`);
    // Register user on server
    socket.emit('user-register', { userId, username: nick });
  });

  socket.on('connection-confirmed', (data) => {
    console.log(`[${nick}] connection-confirmed`, data);
    // Start random chat search after registration
    setTimeout(() => {
      console.log(`[${nick}] starting random-chat:search (mode: text)`);
      socket.emit('random-chat:search', { mode: 'text' });
    }, 500 + Math.floor(Math.random() * 500));
  });

  // Listen for various match events the server might emit
  const matchEvents = [
    'random-chat:matched',
    'random-chat:session-matched',
    'random-chat:match-found',
    'random-chat:session-joined',
    'random-chat:session-joined',
    'random-chat:queue-position',
    'random-chat:queue-left',
  ];

  matchEvents.forEach((ev) => {
    socket.on(ev, (payload) => {
      console.log(`[${nick}] EVENT ${ev}:`, payload);
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[${nick}] disconnected:`, reason);
  });

  socket.on('error', (err) => {
    console.error(`[${nick}] socket error:`, err);
  });

  return socket;
}

async function run() {
  console.log('Simulator starting, connecting two clients to', SERVER_URL);

  const c1 = createClient('000000000000000000000001', 'Alice');
  const c2 = createClient('000000000000000000000002', 'Bob');

  // Let them run for 20 seconds, then exit
  setTimeout(() => {
    console.log('Simulator finished, disconnecting clients');
    c1.disconnect();
    c2.disconnect();
    process.exit(0);
  }, 20000);
}

run().catch((e) => {
  console.error('Simulator error:', e);
  process.exit(1);
});
