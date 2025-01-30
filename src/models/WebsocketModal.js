const WebSocket = require('ws');
let wspara
class WebSocketServer {
    
  constructor(port) {
    this.wss = new WebSocket.Server({ port });
    this.wss.on('connection', (ws) => this.setupConnection(ws));
  }

  setupConnection(ws) {
    console.log('Client connected');


    ws.on('message', (message) => {
      console.log(`Received message: ${message}`);
      this.handleMessage(ws, message);
    });
  }

  handleMessage(ws, message) {
    
    // Handle the incoming message and send a response back
    // const parsedMessage = JSON.parse(message);
    // if (parsedMessage.type === 'greet') {
      ws.send(JSON.stringify({ type: 'greet', message: 'Hello, client!' }));
    // }
  }
}

module.exports = WebSocketServer;
