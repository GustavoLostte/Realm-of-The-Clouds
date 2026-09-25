import { spawn } from 'child_process'
import http from 'http'

// Test script to run Chrome with remote debugging and test animated WebP replay behavior
async function test() {
  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--user-data-dir=/tmp/chrome_test_profile_' + Date.now(),
    'about:blank'
  ])

  // Wait 1.5s for Chrome to bind port
  await new Promise(r => setTimeout(r, 1500))

  // Fetch /json/version
  const versionData = await new Promise((resolve, reject) => {
    http.get('http://localhost:9225/json/version', (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })

  console.log('Connected to Chrome:', versionData.Browser)
  const wsUrl = versionData.webSocketDebuggerUrl
  const ws = new WebSocket(wsUrl)

  let id = 1
  const pending = new Map()

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(msg.error)
      else resolve(msg.result)
    }
  }

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++
      pending.set(msgId, { resolve, reject })
      ws.send(JSON.stringify({ id: msgId, method, params }))
    })
  }

  await new Promise(r => ws.onopen = r)

  // Create target / page
  const { targetId } = await send('Target.createTarget', { url: 'http://localhost:5173' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

  // Send to page session
  function sendSession(method, params = {}) {
    return send('Target.sendMessageToTarget', {
      sessionId,
      message: JSON.stringify({ id: id++, method, params })
    })
  }

  console.log('Attached to target. Waiting 3s for page load...')
  await new Promise(r => setTimeout(r, 3000))

  // Evaluate script in page
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 100),
        images: Array.from(document.querySelectorAll('img')).map(img => img.src)
      }
    })()`,
    returnByValue: true
  })

  console.log('Eval result on home:', evalResult.result.value)

  chromeProc.kill()
  process.exit(0)
}

test().catch(err => {
  console.error(err)
  process.exit(1)
})
