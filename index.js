const http = require('http');
const { Server } = require("socket.io");
const { AssemblyAI } = require('assemblyai');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Allows connections from Expo Snack and other clients
    methods: ["GET", "POST"]
  }
});

// Initialize the AssemblyAI client securely from environment variables
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let transcriber;

  // This event is triggered by the app to start a transcription session
  socket.on('start_session', async () => {
    transcriber = client.realtime.transcriber({
        sampleRate: 16000, // We will force this sample rate in the app
        languageCode: 'pt'
    });

    // This handles the transcribed text coming back from AssemblyAI
    transcriber.on('transcript', (transcript) => {
        if (transcript.text) {
            console.log(`[Transcription] Speaker ${transcript.speaker || 'A'}: ${transcript.text}`);
            socket.emit('message', transcript.text); // Send the text back to the app
        }
    });

    // This handles any errors from the AssemblyAI connection
    transcriber.on('error', (error) => {
        console.error('AssemblyAI Service Error:', error);
    });

    try {
        await transcriber.connect();
        socket.emit('message', 'Transcription service connected and ready.');
    } catch (error) {
        console.error('Error connecting to AssemblyAI:', error);
    }
  });
  
  // This event receives audio data chunks from the app
  socket.on('audio', (data) => {
    if (transcriber) {
      transcriber.stream(Buffer.from(data, 'base64'));
    }
  });
  
  // This event is triggered by the app to end the session
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
