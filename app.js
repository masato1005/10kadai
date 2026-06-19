const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)

const port = process.env.PORT || 3001
let connections = []

app.use(express.static('public'))

function broadcast(data) {
  const message = JSON.stringify(data)

  connections.forEach((client) => {
    if (client.ws.readyState === 1) {
      client.ws.send(message)
    }
  })
}

function sendUserCount() {
  broadcast({
    type: 'count',
    count: connections.length,
  })
}

app.ws('/ws', (ws) => {
  const client = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: 'Guest',
    color: '#2563eb',
    ws,
  }

  connections.push(client)
  sendUserCount()

  ws.on('message', (rawMessage) => {
    let data

    try {
      data = JSON.parse(rawMessage)
    } catch (error) {
      data = { type: 'chat', text: String(rawMessage) }
    }

    if (data.type === 'join') {
      client.name = data.name || 'Guest'
      client.color = data.color || '#2563eb'
      broadcast({
        type: 'system',
        text: `${client.name} さんが入室しました`,
      })
      sendUserCount()
      return
    }

    if (data.type === 'chat' && data.text.trim() !== '') {
      broadcast({
        type: 'chat',
        id: client.id,
        name: client.name,
        color: client.color,
        text: data.text.trim(),
        time: new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    }
  })

  ws.on('close', () => {
    connections = connections.filter((connection) => connection.ws !== ws)
    broadcast({
      type: 'system',
      text: `${client.name} さんが退室しました`,
    })
    sendUserCount()
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
