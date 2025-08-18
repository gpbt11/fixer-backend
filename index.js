const http = require('http');
const { Server } = require("socket.io");
const { AssemblyAI } = require('assemblyai');
const { Buffer } = require('buffer');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

io.on('connection', (socket) => {
  console.log('A user connected with id:', socket.id);
  let transcriber;

  socket.on('start_transcription', async () => {
    transcriber = client.realtime.transcriber({
        sampleRate: 44100, // Sample rate for mobile devices
        languageCode: 'pt'
    });

    transcriber.on('transcript', (transcript) => {
        if (transcript.text) {
            console.log('Transcription:', transcript.text);
            socket.emit('message', transcript.text);
        }
    });

    transcriber.on('error', (error) => {
        console.error('AssemblyAI Error:', error);
    });

    await transcriber.connect();
    socket.emit('message', 'Transcription service connected.');
  });
  
  // This now expects a base64 encoded audio string
  socket.on('audio', (data) => {
    if (transcriber) {
      const audioBuffer = Buffer.from(data, 'base64');
      transcriber.stream(audioBuffer);
    }
  });
  
  socket.on('stop_transcription', async () => {
      if (transcriber) {
          await transcriber.close();
          transcriber = null;
      }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (transcriber) {
      transcriber.close();
    }
  });
});

const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
