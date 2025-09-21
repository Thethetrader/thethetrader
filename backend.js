const express = require("express");
const { StreamChat } = require("stream-chat");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Configuration GetStream
const STREAM_API_KEY = 'wzt9bzcb6z9q';
const STREAM_API_SECRET = 'z5qmahxqz26jfs569h6w255dugmqndvvgrtdk8y9wmqfqgmfvu59yp8c4qrv4aab';

const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

app.get("/get-token", (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).send("userId manquant");

  const token = serverClient.createToken(userId);
  console.log(`✅ Token généré pour utilisateur: ${userId}`);
  res.json({ token });
});

app.get("/test", (req, res) => {
  res.json({ 
    message: "Backend démarré sur port 3000",
    apiKey: STREAM_API_KEY,
    status: "OK"
  });
});

app.listen(3000, () => {
  console.log("🚀 Backend démarré sur port 3000");
  console.log(`📡 API Key: ${STREAM_API_KEY}`);
  console.log(`🔗 Test: http://localhost:3000/test`);
  console.log(`🎫 Token: http://localhost:3000/get-token?userId=thethetrader`);
});
