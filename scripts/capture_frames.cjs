const http = require('http');
const fs = require('fs');

http.get('http://localhost:9222/json', (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const targets = JSON.parse(raw);
    const target = targets.find(t => t.url.includes('localhost:5174') && t.type === 'page');
    run(target.webSocketDebuggerUrl);
  });
});

async function run(wsUrl) {
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
    console.log('Connected, recording 12 frames at 400ms intervals...');
    for (let f = 0; f < 12; f++) {
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      const fname = `/Users/wizzard/.gemini/antigravity-ide/brain/9bd7ea17-0d73-4db6-bad5-d59d512cbfb3/debug_frames/walk_frame_${String(f).padStart(2, '0')}.png`;
      fs.writeFileSync(fname, Buffer.from(screenshot.data, 'base64'));
      
      const res = await send('Runtime.evaluate', {
        expression: `
          Array.from(document.querySelectorAll('.citizen-actor')).map(el => {
            const img = el.querySelector('img');
            const r = el.getBoundingClientRect();
            return {
              name: el.getAttribute('title'),
              x: Math.round(r.x),
              y: Math.round(r.y),
              targetLeft: el.style.left,
              targetTop: el.style.top,
              src: img ? img.src.split('/').pop() : '',
              transform: img ? img.style.transform : ''
            };
          })
        `,
        returnByValue: true
      });
      console.log(`Frame ${f}:`);
      res.result.value.slice(0, 2).forEach(c => {
        console.log(`  ${c.name}: pos=(${c.x}, ${c.y}) target=(${c.targetLeft}, ${c.targetTop}) sprite=${c.src} flip=${c.transform}`);
      });
      await new Promise(r => setTimeout(r, 400));
    }
    process.exit(0);
  });
}
