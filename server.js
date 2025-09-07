import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS: consenti localhost e il dominio Netlify (impostalo in FRONTEND_ORIGIN in produzione)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_ORIGIN || ""
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  }
}));

app.use(express.json());

// OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Healthcheck
app.get("/health", (_req, res) => res.send("ok"));

// Endpoint chat
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Sei AI-3D, un assistente utile, conciso e cordiale." },
        { role: "user", content: message || "" }
      ]
    });
    res.json({ reply: response.choices[0]?.message?.content || "" });
  } catch (err) {
    console.error("OpenAI error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Errore nella risposta AI" });
  }
});

// Porta
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend AI-3D attivo su http://localhost:${PORT}`);
});
