require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ BOT_TOKEN or CHAT_ID missing.");
  process.exit(1);
}

app.post("/notify-telegram", async (req, res) => {
  const { browser, ip, city, country, isReturning, trafficSource, utm } = req.body;

  if (!browser || !ip || !city || !country) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const visitorType = isReturning ? "🔁 Returning Visitor" : "🆕 New Visitor";

  const hasUTM = utm && (utm.source || utm.medium || utm.campaign);
  const utmText = hasUTM
    ? `📌 UTM: ${utm.source || "-"} / ${utm.medium || "-"} / ${utm.campaign || "-"}`
    : "📌 UTM: Not available";

  const message = `${visitorType} Alert!
🌍 Location: ${city}, ${country}
🖥️ Browser: ${browser}
🌐 IP: ${ip}
🔗 Traffic Source: ${trafficSource}
${utmText}`;

  console.log("🚨 Telegram message:\n", message);

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
    });
    console.log(`✅ Notification sent to ${CHAT_ID}`);
    res.status(200).send("✅ Notification sent");
  } catch (error) {
    console.error("❌ Failed to send notification:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
