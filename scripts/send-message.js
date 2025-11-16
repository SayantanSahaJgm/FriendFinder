const { io } = require('socket.io-client');

const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3004';
const senderId = process.argv[2] || '69141f7822add32589848916';
const receiverId = process.argv[3] || '6905adf16a22b7843b006183';
const chatId = process.argv[4] || `${senderId}_${receiverId}`;
const message = process.argv[5] || 'Test message from automated script';

console.log('Connecting to', url, 'as', senderId);

const socket = io(url, {
  path: '/socket.io/',
  transports: ['polling', 'websocket'],
  reconnection: false,
  timeout: 10000,
});

socket.on('connect', () => {
  console.log('Connected, id=', socket.id);
  socket.emit('user-register', { userId: senderId, username: `user_${senderId}` });

  setTimeout(() => {
    console.log('Emitting message:send ->', { chatId, receiverId, content: message });
    socket.emit('message:send', { chatId, receiverId, content: message, type: 'text' });
  }, 500);
});

socket.on('message:received', (data) => {
  console.log('message:received (local echo or incoming):', data);
});

socket.on('message:delivered', (data) => {
  console.log('message:delivered:', data);
});

socket.on('message:read', (data) => {
  console.log('message:read:', data);
});

socket.on('connection-confirmed', (d) => console.log('connection-confirmed', d));
socket.on('disconnect', (r) => console.log('disconnect', r));
socket.on('connect_error', (e) => console.error('connect_error', e && e.message));
socket.on('error', (e) => console.error('server error', e));

// exit after 5 seconds
setTimeout(() => process.exit(0), 5000);
