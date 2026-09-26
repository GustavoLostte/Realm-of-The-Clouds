const http = require('http');

http.get('http://localhost:9222/json', (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const targets = JSON.parse(raw);
    const target = targets.find(t => t.url.includes('localhost:5174') && t.type === 'page');
    if (!target) {
      console.error('Target not found!', targets);
      process.exit(1);
    }
    console.log('Connecting to:', target.webSocketDebuggerUrl);
    run(target.webSocketDebuggerUrl);
  });
});

function run(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.addEventListener('open', async () => {
    console.log('Connected!');
    for (let t = 0; t < 6; t++) {
      const res = await send('Runtime.evaluate', {
        expression: `
          Array.from(document.querySelectorAll('.citizen-actor')).map(el => {
            const img = el.querySelector('img');
            const rect = el.getBoundingClientRect();
            return {
              title: el.getAttribute('title'),
              styleLeft: el.style.left,
              styleTop: el.style.top,
              transition: el.style.transition,
              imgSrc: img ? img.src.split('/').pop() : null,
              imgTransform: img ? img.style.transform : null,
              x: Math.round(rect.x),
              y: Math.round(rect.y)
            };
          })
        `,
        returnByValue: true
      });
      console.log('=== Second', t, '===');
      if (res && res.result && res.result.value) {
        res.result.value.forEach(c => {
          console.log(`  [${c.title}] Pos=(${c.x}, ${c.y}) Target=(${c.styleLeft}, ${c.styleTop}) Sprite=${c.imgSrc} Flip=${c.imgTransform} Trans=${c.transition}`);
        });
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    process.exit(0);
  });
}
