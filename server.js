require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// Handle both JSON (Axios) and text/plain (Beacon)
app.use(express.json());
app.use(express.text({ type: "*/*" }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ BOT_TOKEN or CHAT_ID missing.");
  process.exit(1);
}

app.post("/notify-telegram", async (req, res) => {
  let payload;
  try {
    // Beacon may send as raw string
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error("❌ Payload parsing error:", err.message);
    return res.status(400).send("Invalid payload format");
  }

  const {
    event,
    details,
    browser,
    ip,
    city,
    country,
    isReturning,
    trafficSource,
    utm,
    isSignedIn
  } = payload;

  try {
    let message = "";
    let sessionType = "📑 General Info";

    if (event === "User Session Summary" && details?.activities) {
      sessionType = "📢 User Session Summary";
      message = `*${sessionType}*\n\n📝 *Activity Timeline:*\n`;

      details.activities.forEach((act, i) => {
        const d = act.details;
        let logLine = `${i + 1}. • *${act.event}*: `;

        switch (act.event) {
          case "Audio Play":
            logLine += `🎶 Played "${d.trackName}"`;
            break;
          case "Audio Pause/End":
            logLine += `⏸️ Stopped "${d.trackName}" after ${d.playedFor}`;
            break;
          case "Sign In":
            logLine += `🔑 Signed in as ${d.email}`;
            break;
          case "Sign Out":
            logLine += `🔒 Signed out (${d.email})`;
            break;
          case "Click":
            logLine += `🖱️ Clicked ${d.element}: "${d.text}"`;
            break;
          case "Page Exit":
            logLine += `🚪 Left page after ${d.timeSpent}`;
            break;
          default:
            logLine += JSON.stringify(d);
        }

        message += logLine + "\n";
      });
    } else if (browser && ip && city && country) {
      sessionType = "🟢 Visitor Info";
      const visitorType = isReturning ? "🔁 Returning Visitor" : "🆕 New Visitor";
      const signInStatus = isSignedIn ? "🔐 Signed In" : "🚫 Not Signed In";

      const utmText = utm && (utm.source || utm.medium || utm.campaign)
        ? `📌 UTM: ${utm.source || "-"} / ${utm.medium || "-"} / ${utm.campaign || "-"}`
        : "📌 UTM: Not available";

      message = `*${sessionType}*\n\n${visitorType} Alert!\n${signInStatus}
🌍 Location: ${city}, ${country}
🖥️ Device & Browser: ${browser}
🌐 IP: ${ip}
🔗 Traffic Source: ${trafficSource || "Unknown"}
${utmText}`;
    } else {
      message = `*${sessionType}*\n\n📩 Raw Payload:\n${JSON.stringify(payload, null, 2)}`;
    }

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });

    res.status(200).send("✅ Notification sent");
  } catch (error) {
    console.error("❌ Telegram error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to notify Telegram" });
  }
});

app.get("/test", (req, res) => {
  res.send("✅ Server is running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
