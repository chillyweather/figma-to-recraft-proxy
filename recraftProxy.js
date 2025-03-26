const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3003;

app.set("trust proxy", true);

// Explicit CORS for all Figma subdomains
// app.use(
//   cors({
//     origin: [/^https:\/\/([a-zA-Z0-9-]+\.)*figma\.com$/],
//     methods: ["POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

app.use((req, res, next) => {
  const allowedOrigins = [
    new RegExp("^https://([a-zA-Z0-9-]+\\.)*figma\\.com$"),
    new RegExp("^http://localhost:3000$"),
  ];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.some((pattern) => pattern.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  // Handle preflight OPTIONS request explicitly
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Parse JSON bodies
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  console.log("[Health Check] Received request from:", req.headers.origin);
  console.log("[Health Check] Request headers:", req.headers);
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
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
