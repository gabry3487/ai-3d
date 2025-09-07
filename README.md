# AI-3D Deploy Guide

Questa è la guida passo-passo per mettere online il progetto **AI-3D** con **GitHub + Netlify (frontend)** e **Render (backend)**.

---

## 🔹 0) Backup (già fatto ✅)

---

## 🔹 1) Caricare il progetto su GitHub

1. Vai su [GitHub](https://github.com) → **New repository**
   - Nome: `ai-3d`
   - Public
   - Nessun file aggiunto (no README, no .gitignore)
   - Clicca **Create repository**

2. Sul tuo PC apri PowerShell nella cartella del progetto:

   ```powershell
   git init
   git add .
   git commit -m "Primo commit AI-3D"
   git branch -M main
   git remote add origin https://github.com/TUO-UTENTE/ai-3d.git
   git push -u origin main
   ```

👉 Ora il progetto è su GitHub.

---

## 🔹 2) Deploy Frontend su Netlify

1. Vai su [Netlify](https://app.netlify.com/)  
   → **Add new site → Import from Git**  
   → collega GitHub e scegli `ai-3d`.

2. Imposta:  
   - Build command: `npm run build`  
   - Publish directory: `dist`  
   - Node version: 20

3. Clicca **Deploy site** → otterrai un URL tipo:  
   `https://ai-3d-gabry.netlify.app`

Copia questo URL.

---

## 🔹 3) Deploy Backend su Render

1. Vai su [Render](https://dashboard.render.com/)  
   → **New → Web Service**  
   → collega GitHub e scegli `ai-3d`.

2. Imposta:  
   - Name: `ai-3d-backend`  
   - Branch: `main`  
   - Start Command: `npm start`  
   - Region: EU

3. Environment Variables:  
   - `OPENAI_API_KEY` = la tua chiave OpenAI  
   - `FRONTEND_ORIGIN` = `https://ai-3d-gabry.netlify.app`

4. Clicca **Create Web Service**  
   → otterrai un URL tipo:  
   `https://ai-3d-backend.onrender.com`

Prova `https://ai-3d-backend.onrender.com/health` → deve rispondere **ok**.

---

## 🔹 4) Collega frontend e backend

1. Su Netlify vai su **Site settings → Environment variables**  
   - Aggiungi:  
     `VITE_API_BASE = https://ai-3d-backend.onrender.com`

2. Salva e fai **Redeploy**.

---

## 🔹 5) Test finale

- Apri il sito Netlify (`https://ai-3d-gabry.netlify.app`)  
- Invia un messaggio → se risponde, tutto è ok 🎉

---

## ℹ️ Note utili

- **CORS error** → controlla che `FRONTEND_ORIGIN` su Render sia esattamente l’URL Netlify (senza `/` finale).  
- **Errore Mixed Content** → usa sempre `https://` negli URL.  
- **404 asset** → gli asset devono stare in `public/assets/`.  
- **500 dal backend** → controlla `OPENAI_API_KEY` o quota OpenAI.  

---

## 🧪 Sviluppo locale

Backend:
```bash
npm start
# http://localhost:3001/health
```

Frontend (Vite):
```bash
npm run dev
# http://localhost:5173
```
