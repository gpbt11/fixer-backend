const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

// CORRECTED LINE: The server now listens for POST requests on the "/token" path.
app.post("/token", async (req, res) => {
  console.log("Token request received.");

  if (!ASSEMBLYAI_API_KEY) {
    console.error("AssemblyAI API Key not configured.");
    return res.status(500).send({ error: "Server configuration incomplete." });
  }

  try {
    const response = await axios.post(
      "https://api.assemblyai.com/v2/realtime/token",
      { expires_in: 3600 },
      { headers: { Authorization: ASSEMBLYAI_API_KEY } }
    );
    
    console.log("Token generated successfully.");
    return res.status(200).send({ token: response.data.token });

  } catch (error) {
    console.error("Error creating token:", error.response ? error.response.data : error.message);
    return res.status(500).send({ error: "Could not generate token." });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Fixer token server listening on port ${port}`);
});
