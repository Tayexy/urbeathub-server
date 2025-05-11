require("dotenv").config(); // Load environment variables

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ BOT_TOKEN or CHAT_ID is missing in environment variables.");
  process.exit(1);
}

console.log("✅ BOT_TOKEN and CHAT_ID loaded successfully");

app.post("/notify-telegram", async (req, res) => {
  const { browser, ip, city, country, isReturning } = req.body;

  if (!browser || !ip || !city || !country) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  console.log("📩 Notification request received:", req.body);

  const visitorType = isReturning ? "🔁 Returning Visitor" : "🆕 New Visitor";

  const message = `${visitorType} Alert!
🌍 Location: ${city}, ${country}
🖥️ Browser: ${browser}
🌐 IP: ${ip}`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
    });
    console.log(`✅ Notification sent to ${CHAT_ID}`);
    return res.status(200).send("✅ Notification sent");
  } catch (error) {
    console.error("❌ Failed to send notification:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to send notification" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
