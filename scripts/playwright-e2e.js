const { chromium } = require('playwright');

(async () => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3004';
  const senderId = process.argv[2] || '69141f7822add32589848916';
  const receiverId = process.argv[3] || '6905adf16a22b7843b006183';
  const chatId = process.argv[4] || `${senderId}_${receiverId}`;
  const messageText = process.argv[5] || 'Playwright E2E message ' + new Date().toISOString();

  console.log('Playwright E2E starting. Socket:', socketUrl);

  try {
    const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });

  // Create two pages under the allowed origin so server's allowRequest accepts them
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  // Navigate to base URL to ensure proper origin
  await pageA.goto('/');
  await pageB.goto('/');

  // Load socket.io client in both pages from CDN
  await pageA.addScriptTag({ url: 'https://cdn.socket.io/4.8.1/socket.io.min.js' });
  await pageB.addScriptTag({ url: 'https://cdn.socket.io/4.8.1/socket.io.min.js' });

  // Expose console from pages to Node console
  pageA.on('console', (msg) => console.log('[pageA]', msg.text()));
  pageB.on('console', (msg) => console.log('[pageB]', msg.text()));

  // Connect sender socket in pageA
  await pageA.evaluate(({ socketUrl, senderId }) => {
    return new Promise((resolve) => {
      const socket = window.io(socketUrl, { path: '/socket.io/', transports: ['polling','websocket'] });
      window.__socket_sender = socket;
      socket.on('connect', () => {
        console.log('[sender] connected', socket.id);
        socket.emit('user-register', { userId: senderId, username: 'sender' });
        resolve(true);
      });
      socket.on('connect_error', (e) => console.log('[sender] connect_error', e && e.message));
      socket.on('message:received', (m) => console.log('[sender] message:received', JSON.stringify(m)));
      socket.on('message:delivered', (p) => console.log('[sender] message:delivered', JSON.stringify(p)));
      socket.on('message:read', (p) => console.log('[sender] message:read', JSON.stringify(p)));
    });
  }, { socketUrl, senderId });

  // Connect receiver socket in pageB
  await pageB.evaluate(({ socketUrl, receiverId }) => {
    return new Promise((resolve) => {
      const socket = window.io(socketUrl, { path: '/socket.io/', transports: ['polling','websocket'] });
      window.__socket_receiver = socket;
      socket.on('connect', () => {
        console.log('[receiver] connected', socket.id);
        socket.emit('user-register', { userId: receiverId, username: 'receiver' });
        resolve(true);
      });
      socket.on('connect_error', (e) => console.log('[receiver] connect_error', e && e.message));
      socket.on('message:received', (m) => {
        console.log('[receiver] message:received', JSON.stringify(m));
        // auto mark read
        setTimeout(() => {
          const id = m._id || m.messageId || null;
          console.log('[receiver] marking as read ->', id);
          socket.emit('message:read', { chatId: m.chatId || 'chat', messageId: id });
        }, 300);
      });
    });
  }, { socketUrl, receiverId });

  // Wait briefly to ensure both connected
  await new Promise((r) => setTimeout(r, 800));

  // Send message from sender
  await pageA.evaluate(({ chatId, receiverId, messageText }) => {
    const s = window.__socket_sender;
    console.log('[sender] emitting message:send', chatId, receiverId, messageText);
    s.emit('message:send', { chatId, receiverId, content: messageText, type: 'text' });
  }, { chatId, receiverId, messageText });

  // Wait for events to flow
  await new Promise((r) => setTimeout(r, 3000));

  // Grab logs from pages by doing nothing (console already forwarded)
    console.log('E2E finished — closing browser');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Playwright E2E error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
