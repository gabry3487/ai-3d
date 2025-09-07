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
const themeSelect = document.getElementById("themeSelect");

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
    addMessage(saluto + ", sono AI-3D. Vuoi iniziare a parlare con me?", "bot");
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

  var itVoices = voices.filter(function (v) {
    return (v.lang || "").toLowerCase().indexOf("it") === 0;
  });
  var otherVoices = voices.filter(function (v) {
    return (v.lang || "").toLowerCase().indexOf("it") !== 0;
  });

  var ogIt = document.createElement("optgroup");
  ogIt.label = "Italiano";
  itVoices.forEach(function (v) {
    var opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = v.name + " (" + v.lang + ")";
    ogIt.appendChild(opt);
  });

  var ogOther = document.createElement("optgroup");
  ogOther.label = "Altre";
  otherVoices.forEach(function (v) {
    var opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = v.name + " (" + v.lang + ")";
    ogOther.appendChild(opt);
  });

  voiceSelect.appendChild(ogIt);
  voiceSelect.appendChild(ogOther);

  var savedName = localStorage.getItem("ai-3d-voice");
  var all = itVoices.concat(otherVoices);
  if (savedName && all.find(function (v) { return v.name === savedName; })) {
    voiceSelect.value = savedName;
  } else {
    var prefer =
      itVoices.find(function (v) { return v.name.indexOf("Elsa") >= 0; }) ||
      itVoices.find(function (v) { return v.name.indexOf("Alice") >= 0; }) ||
      itVoices.find(function (v) { return v.name.indexOf("Samantha") >= 0; }) ||
      itVoices[0] || otherVoices[0];
    if (prefer) voiceSelect.value = prefer.name;
  }
  applySelectedVoice();
}

function applySelectedVoice() {
  var name = voiceSelect.value;
  localStorage.setItem("ai-3d-voice", name);
  selectedVoice = voicesCache.find(function (v) { return v.name === name; }) || null;
}

function listVoicesAndPopulate() {
  var voices = window.speechSynthesis.getVoices() || [];
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

  var cleaned = cleanText(text);
  var utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = "it-IT";
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.rate = Number(rateRange.value);
  utterance.pitch = Number(pitchRange.value);

  window.speechSynthesis.speak(utterance);
}

/* =========================
   Send message
========================= */
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  var text = input.value.trim();
  if (!text) return;
  addMessage(text, "user");
  input.value = "";

  try {
    var res = await fetch(API_BASE + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    var data = await res.json();
    var reply = data.reply || "Nessuna risposta ricevuta.";
    addMessage(reply, "bot");
    speak(reply);
  } catch (e) {
    addMessage("Errore di connessione con il server.", "bot");
  }
}

/* =========================
   Mute
========================= */
muteBtn.addEventListener("click", function () {
  muted = !muted;
  muteBtn.textContent = muted ? "🔇" : "🔊";
  if (muted) window.speechSynthesis.cancel();
});

/* =========================
   Microphone (auto-send)
========================= */
var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "it-IT";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = function () {
    micBtn.classList.add("recording");
    micBtn.textContent = "⏺";
    listeningIndicator.textContent = "Sto ascoltando...";
  };

  recognition.onend = function () {
    micBtn.classList.remove("recording");
    micBtn.textContent = "🎤";
    listeningIndicator.textContent = "";
  };

  recognition.onresult = function (event) {
    var transcript = Array.prototype.slice.call(event.results)
      .map(function (r) { return (r[0] && r[0].transcript) || ""; })
      .join(" ")
      .trim();
    if (transcript) {
      input.value = transcript;
      sendMessage(); // auto-send
    }
  };

  recognition.onerror = function () {
    micBtn.classList.remove("recording");
    micBtn.textContent = "🎤";
    listeningIndicator.textContent = "";
  };

  micBtn.addEventListener("click", function () {
    try {
      window.speechSynthesis.cancel();
      if (micBtn.classList.contains("recording")) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } catch (e) { /* no-op */ }
  });
} else {
  micBtn.disabled = true;
  micBtn.title = "Microfono non supportato in questo browser";
}

/* =========================
   Theme switcher
========================= */
if (themeSelect) {
  const savedTheme = localStorage.getItem("ai-3d-theme") || "classic";
  document.body.classList.add("theme-" + savedTheme);
  themeSelect.value = savedTheme;

  themeSelect.addEventListener("change", function () {
    document.body.classList.remove(
      "theme-classic",
      "theme-minimal",
      "theme-neon",
      "theme-imessage",
      "theme-cartoon"
    );
    const theme = themeSelect.value;
    document.body.classList.add("theme-" + theme);
    localStorage.setItem("ai-3d-theme", theme);
  });
}
