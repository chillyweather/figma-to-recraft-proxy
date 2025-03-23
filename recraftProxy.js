const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3003;

app.set("trust proxy", true);

// Explicit CORS for all Figma subdomains
app.use(
  cors({
    origin: [/^https:\/\/([a-zA-Z0-9-]+\.)*figma\.com$/],
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Proxy endpoint for Recraft API
app.post("/recraft/generate", async (req, res) => {
  try {
    console.log("Received request for image generation:", req.body);

    const recraftApiKey = process.env.RECRAFT_API_KEY;

    if (!recraftApiKey) {
      return res
        .status(500)
        .json({ error: "API key not configured on server" });
    }

    const response = await axios({
      method: "POST",
      url: "https://external.api.recraft.ai/v1/images/generations",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${recraftApiKey}`,
      },
      data: {
        prompt: req.body.prompt || "A colorful abstract design",
        style: req.body.style || "digital_illustration",
        model: req.body.model || "recraftv3",
      },
    });

    console.log("Successful response from Recraft API:", response.data);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error calling Recraft API:",
      error.response ? error.response.data : error.message
    );
    return res.status(error.response ? error.response.status : 500).json({
      error: error.response ? error.response.data : error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
