const http = require('http');
const { Server } = require("socket.io");
const { AssemblyAI } = require('assemblyai'); // Import the AssemblyAI client

// Note: We don't need Express for this simple proxy, http and socket.io are enough.
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize the AssemblyAI client with your API key from Render's environment variables
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

io.on('connection', (socket) => {
  console.log('A user connected with id:', socket.id);
  let transcriber;

  // This block runs when a new client (our app) connects
  socket.on('start_transcription', async () => {
    transcriber = client.realtime.transcriber({
        sampleRate: 16000,
        languageCode: 'pt'
    });

    // Event handler for when the transcriber receives text
    transcriber.on('transcript', (transcript) => {
        if (transcript.text) {
            console.log('Transcription:', transcript.text);
            socket.emit('message', transcript.text); // Send the text back to the app
        }
    });

    // Event handler for errors
    transcriber.on('error', (error) => {
        console.error('AssemblyAI Error:', error);
    });

    await transcriber.connect();
    socket.emit('message', 'Transcription service connected.');
  });

  // This block runs when the app sends an audio chunk
  socket.on('audio', (data) => {
    if (transcriber) {
      transcriber.stream(data);
    }
  });

  // This block runs when the app wants to stop transcribing
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
