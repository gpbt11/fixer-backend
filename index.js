const http = require('http');
const { Server } = require("socket.io");
const WebSocket = require('websocket-client').WebSocket; // Direct websocket client
const base64 = require('base64-js');

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" }
});

const ASSEMBLYAI_URL = "wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000";

io.on('connection', (socket) => {
  console.log('A user connected with id:', socket.id);
  let assemblyaiSocket;

  socket.on('start_session', () => {
    assemblyaiSocket = new WebSocket(ASSEMBLYAI_URL, {
      headers: { Authorization: process.env.ASSEMBLYAI_API_KEY }
    });

    assemblyaiSocket.onmessage = (message) => {
      const transcript = JSON.parse(message.data);
      if (transcript.text) {
        console.log("Transcription:", transcript.text);
        socket.emit('message', transcript.text);
      }
    };

    assemblyaiSocket.onerror = (error) => {
      console.error("AssemblyAI WebSocket Error:", error);
    };
    
    assemblyaiSocket.onopen = () => {
        console.log("Connected to AssemblyAI.");
        socket.emit('message', 'Transcription service connected.');
    };
  });

  socket.on('audio', (data) => {
    if (assemblyaiSocket && assemblyaiSocket.readyState === WebSocket.OPEN) {
      const audioBuffer = base64.toByteArray(data);
      assemblyaiSocket.send(JSON.stringify({ audio_data: base64.fromByteArray(audioBuffer) }));
    }
  });

  socket.on('stop_session', () => {
    if (assemblyaiSocket) {
      assemblyaiSocket.send(JSON.stringify({ terminate_session: true }));
      assemblyaiSocket.close();
      assemblyaiSocket = null;
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (assemblyaiSocket) {
      assemblyaiSocket.send(JSON.stringify({ terminate_session: true }));
    }
  });
});

const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
