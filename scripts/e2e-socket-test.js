const { io } = require('socket.io-client');

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3004';

// Replace with two valid user IDs from your local DB
const SENDER_ID = process.argv[2] || '69141f7822add32589848916';
const RECEIVER_ID = process.argv[3] || '6905adf16a22b7843b006183';
const CHAT_ID = process.argv[4] || `${SENDER_ID}_${RECEIVER_ID}`;
const MESSAGE_TEXT = process.argv[5] || 'E2E test message ' + new Date().toISOString();

function makeSocket(userId, username) {
  const s = io(SOCKET_URL, {
    path: '/socket.io/',
    transports: ['polling', 'websocket'],
    forceNew: true,
    timeout: 10000,
    extraHeaders: {
      // Emulate browser origin so server's allowRequest accepts the connection
      origin: 'http://localhost:3000'
    }
  });

  s.on('connect', () => {
    console.log(`[${username}] connected -> ${s.id}`);
    s.emit('user-register', { userId, username });
  });

  s.on('disconnect', (r) => console.log(`[${username}] disconnected:`, r));
  s.on('connect_error', (e) => console.error(`[${username}] connect_error:`, e && e.message ? e.message : e));
  s.on('connection-confirmed', (d) => console.log(`[${username}] connection-confirmed`, d));
  s.on('error', (e) => console.error(`[${username}] server error:`, e));

  return s;
}

(async function run() {
  console.log('Starting E2E socket test against', SOCKET_URL);

  const sender = makeSocket(SENDER_ID, 'sender');
  const receiver = makeSocket(RECEIVER_ID, 'receiver');

  receiver.on('message:received', (msg) => {
    console.log('[receiver] message:received ->', msg);

    // Simulate receiver opening the chat and marking as read after a short delay
    setTimeout(() => {
      console.log('[receiver] marking as read for message', msg._id || msg.messageId || '(unknown id)');
      const msgId = msg._id ? msg._id : msg.messageId ? msg.messageId : undefined;
      receiver.emit('message:read', { chatId: CHAT_ID, messageId: msgId });
    }, 500);
  });

  sender.on('message:received', (msg) => {
    console.log('[sender] message:received (echo or incoming):', msg);
  });

  sender.on('message:delivered', (payload) => {
    console.log('[sender] message:delivered ->', payload);
  });

  sender.on('message:read', (payload) => {
    console.log('[sender] message:read ->', payload);
  });

  // Wait for both sockets to connect
  await new Promise((res) => setTimeout(res, 1200));

  console.log('[test] Emitting message:send from sender');
  sender.emit('message:send', { chatId: CHAT_ID, receiverId: RECEIVER_ID, content: MESSAGE_TEXT, type: 'text' });

  // Let the test run for a few seconds to capture events
  setTimeout(() => {
    console.log('[test] Finished, closing sockets');
    sender.close();
    receiver.close();
    process.exit(0);
  }, 5000);
})();
