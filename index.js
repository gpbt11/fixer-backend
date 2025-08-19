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
  console.log('Client connected:', socket.id);
  let transcriber;

  socket.on('start_session', async () => {
    console.log('start_session event received');
    transcriber = client.realtime.transcriber({
        sampleRate: 16000,
        // THE ONLY CHANGE IS HERE:
        languageCode: 'en_US' // Changed from 'pt' to 'en_US' for the test
    });

    transcriber.on('transcript', (transcript) => {
        if (transcript.text) {
            console.log(`[Transcription]: ${transcript.text}`);
            socket.emit('message', transcript.text);
        }
    });

    transcriber.on('error', (error) => {
        console.error('AssemblyAI Service Error:', error);
    });

    try {
        await transcriber.connect();
        socket.emit('message', 'Transcription service connected (English).');
    } catch (error) {
        console.error('Error connecting to AssemblyAI:', error);
    }
  });
  
  socket.on('audio', (data) => {
    if (transcriber) {
      transcriber.stream(Buffer.from(data, 'base64'));
    }
  });
  
  socket.on('stop_session', async () => {
      if (transcriber) {
          await transcriber.close();
          transcriber = null;
          console.log('Transcription session closed.');
      }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (transcriber) {
      transcriber.close();
      transcriber = null;
    }
  });
});

const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
