/* chat.js (safe ASCII) */

const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const muteBtn = document.getElementById("muteBtn");
const micBtn = document.getElementById("micBtn");
const voiceSelect = document.getElementById("voiceSelect");
const rateRange = document.getElementById("rateRange");
const pitchRange = document.getElementById("pitchRange");
const rateVal = document.getElementById("rateVal");
const pitchVal = document.getElementById("pitchVal");
const listeningIndicator = document.getElementById("listening-indicator");

// Endpoint backend: Vite env o localhost
const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE)
  ? import.meta.env.VITE_API_BASE
  : "http://localhost:3001";

let muted = false;
let selectedVoice = null;
let voicesCache = [];

/* =========================
   Chat messages
========================= */
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

/* =========================
   Welcome (dynamic by time)
========================= */
document.addEventListener("DOMContentLoaded", function () {
  if (!messages.childElementCount) {
    const hour = new Date().getHours();
    let saluto;
    if (hour >= 5 && hour < 12) saluto = "Buongiorno";
    else if (hour >= 12 && hour < 18) saluto = "Buon pomeriggio";
    else if (hour >= 18 && hour < 23) saluto = "Buonasera";
    else saluto = "Ciao nottambulo";
    addMessage(saluto + ", sono AI-3D 🤖. Vuoi iniziare a parlare con me?", "bot");
  }
});

/* =========================
   Clean text (remove emoji for TTS)
========================= */
function cleanText(text) {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}]/ug, "")
    .replace(/[\u2600-\u26FF]/g, "")
    .replace(/[\u2700-\u27BF]/g, "")
    .trim();
}

/* =========================
   Voices (optgroup: Italian / Others)
========================= */
function fillVoiceSelect(voices) {
  voiceSelect.innerHTML = "";

  const itVoices = voices.filter(v => (v.lang || "").toLowerCase().startsWith("it"));
  const otherVoices = voices.filter(v => !(v.lang || "").toLowerCase().startsWith("it"));

  const ogIt = document.createElement("optgroup");
  ogIt.label = "Italiano";
  itVoices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = v.name + " (" + v.lang + ")";
    ogIt.appendChild(opt);
  });

  const ogOther = document.createElement("optgroup");
  ogOther.label = "Altre";
  otherVoices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = v.name + " (" + v.lang + ")";
    ogOther.appendChild(opt);
  });

  voiceSelect.appendChild(ogIt);
  voiceSelect.appendChild(ogOther);

  const savedName = localStorage.getItem("ai-3d-voice");
  const all = itVoices.concat(otherVoices);

  if (savedName && all.find(v => v.name === savedName)) {
    voiceSelect.value = savedName;
  } else {
    const prefer =
      itVoices.find(v => v.name.includes("Elsa")) ||
      itVoices.find(v => v.name.includes("Alice")) ||
      itVoices.find(v => v.name.includes("Samantha")) ||
      itVoices[0] || otherVoices[0];
    if (prefer) voiceSelect.value = prefer.name;
  }
  applySelectedVoice();
}

function applySelectedVoice() {
  const name = voiceSelect.value;
  localStorage.setItem("ai-3d-voice", name);
  selectedVoice = voicesCache.find(v => v.name === name) || null;
}

function listVoicesAndPopulate() {
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return;
  voicesCache = voices;
  fillVoiceSelect(voices);
}

window.speechSynthesis.onvoiceschanged = listVoicesAndPopulate;
setTimeout(listVoicesAndPopulate, 0);
voiceSelect.addEventListener("change", applySelectedVoice);

/* =========================
   Rate / Pitch
========================= */
function updateRatePitchLabels() {
  rateVal.textContent = Number(rateRange.value).toFixed(1) + "x";
  pitchVal.textContent = Number(pitchRange.value).toFixed(1);
}
rateRange.addEventListener("input", updateRatePitchLabels);
pitchRange.addEventListener("input", updateRatePitchLabels);
updateRatePitchLabels();

/* =========================
   TTS
========================= */
function speak(text) {
  if (muted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const cleaned = cleanText(text);
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = "it-IT";
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.rate = Number(rateRange.value);
  utterance.pitch = Number(pitchRange.value);

  window.speechSynthesis.speak(utterance);
}

/* =========================
   Send message
========================= */
sendBtn.setAttribute("aria-label", "Invia messaggio");
sendBtn.setAttribute("title", "Invia messaggio");

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, "user");
  input.value = "";

  try {
    const res = await fetch(API_BASE + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const reply = data.reply || "Nessuna risposta ricevuta.";
    addMessage(reply, "bot");
    speak(reply);
  } catch (e) {
    console.error("Chat error:", e);
    addMessage("Errore di connessione con il server (" + e.message + ")", "bot");
  }
}

/* =========================
   Mute
========================= */
muteBtn.setAttribute("aria-label", "Attiva/Disattiva audio");
muteBtn.setAttribute("title", "Attiva/Disattiva audio");

muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.textContent = muted ? "🔇" : "🔊";
  if (muted) window.speechSynthesis.cancel();
});

/* =========================
   Microphone
========================= */
micBtn.setAttribute("aria-label", "Attiva microfono");
micBtn.setAttribute("title", "Attiva microfono");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "it-IT";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    micBtn.classList.add("recording");
    micBtn.textContent = "⏺";
    listeningIndicator.textContent = "Sto ascoltando...";
  };

  recognition.onend = () => {
    micBtn.classList.remove("recording");
    micBtn.textContent = "🎤";
    listeningIndicator.textContent = "";
  };

  recognition.onresult = event => {
    const transcript = Array.from(event.results)
      .map(r => (r[0] && r[0].transcript) || "")
      .join(" ")
      .trim();
    if (transcript) {
      input.value = transcript; // non invia automaticamente
      input.focus();
    }
  };

  recognition.onerror = () => {
    micBtn.classList.remove("recording");
    micBtn.textContent = "🎤";
    listeningIndicator.textContent = "";
  };

  micBtn.addEventListener("click", () => {
    try {
      window.speechSynthesis.cancel();
      if (micBtn.classList.contains("recording")) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } catch (e) {
      console.error("Mic error:", e);
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.title = "Microfono non supportato in questo browser";
}
