// server.js – versão simplificada
import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API URL - No Docker, use service name. Locally, use localhost
// Docker: http://whatsmiau2:8081/v1
// Local: http://localhost:8085/v1
// NOTE: All endpoints require /v1 prefix
const API_URL = (process.env.API_URL || "http://localhost:8085").replace(/\/v1$/, "");
const API_KEY = process.env.API_KEY || "2wtLvtb20wXePp8D9uRhm55aCjINiciO";
const DEFAULT_INSTANCE = process.env.DEFAULT_INSTANCE || "minha-instancia";

const app = express();
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Desabilitar cache para desenvolvimento
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public"), { etag: false, lastModified: false }));
console.log("Servindo arquivos estáticos de:", path.join(__dirname, "public"));

// Rotas HTML estáticas
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/home", (req, res) => res.sendFile(path.join(__dirname, "public", "home.html")));
app.get("/connections", (req, res) => res.sendFile(path.join(__dirname, "public", "instancias.html")));
app.get("/instancias", (req, res) => res.sendFile(path.join(__dirname, "public", "instancias.html")));
app.get("/pairing", (req, res) => res.sendFile(path.join(__dirname, "public", "pairing.html")));
app.get("/tickets", (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/kanban", (req, res) => res.sendFile(path.join(__dirname, "public", "kanban.html")));
app.get("/contacts", (req, res) => res.sendFile(path.join(__dirname, "public", "contacts.html")));
app.get("/settings", (req, res) => res.sendFile(path.join(__dirname, "public", "settings.html")));
app.get("/disparador", (req, res) => res.sendFile(path.join(__dirname, "public", "disparador.html")));
app.get("/webhooks", (req, res) => res.sendFile(path.join(__dirname, "public", "webhooks.html")));
app.get("/automacao", (req, res) => res.sendFile(path.join(__dirname, "public", "automacao.html")));
app.get("/crm", (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/internal-chat", (req, res) => res.sendFile(path.join(__dirname, "public", "contacts.html")));
app.get("/resumo-grupos", (req, res) => res.sendFile(path.join(__dirname, "public", "resumo-grupos.html")));
app.get("/logout", (req, res) => res.redirect("/"));

/* -------------------------------------------------
   Utility Functions
   ------------------------------------------------- */

// Normaliza entrada de número para formato JID do WhatsApp
function normalizeInputToJid(input) {
  if (!input) return null;

  const inputStr = input.toString().trim();

  // Se já é um JID completo (contém @), retorna como está
  if (inputStr.includes('@newsletter')) {
    return inputStr; // É um canal/newsletter
  }
  if (inputStr.includes('@g.us')) {
    return inputStr; // É um grupo
  }
  if (inputStr.includes('@lid')) {
    return inputStr; // Já está no formato lid
  }
  if (inputStr.includes('@s.whatsapp.net')) {
    return inputStr; // Já está no formato de contato
  }

  // Remove tudo que não é número
  const numeric = inputStr.replace(/\D/g, '');

  // Valida se tem pelo menos 10 dígitos (número brasileiro)
  if (numeric.length < 10) {
    console.warn(`[normalizeInputToJid] Número muito curto: ${numeric}`);
    return null;
  }

  // Adiciona código do país se não tiver (assume Brasil +55)
  let normalized = numeric;
  if (numeric.length <= 11) {
    normalized = '55' + numeric;
  }

  // Retorna no formato @lid (sem espaço extra)
  return `${normalized}@lid`;
}

// Formata JID para exibição amigável
function jidToFriendly(jid) {
  if (!jid) return null;
  return jid.replace(/@.*$/, '');
}

/* -------------------------------------------------
   WhatsMiau2 API - Custom Endpoints
   ------------------------------------------------- */

// Default instance name
// Default instance name moved to top

// Normalize JID endpoint
app.get("/api/normalize-jid", (req, res) => {
  const { input } = req.query;

  if (!input) {
    return res.status(400).json({ success: false, error: "Input is required" });
  }

  const jid = normalizeInputToJid(input);

  if (!jid) {
    return res.status(400).json({ success: false, error: "Invalid phone number" });
  }

  res.json({
    success: true,
    jid: jid,
    friendly: jidToFriendly(jid)
  });
});

// WhatsMiau2 API Status
app.get("/api/whatsmiau2/status", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/v1/instance/connectionState/${DEFAULT_INSTANCE}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json({
      success: true,
      instance: DEFAULT_INSTANCE,
      ...response.data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      details: err.response?.data
    });
  }
});

// Get Groups
app.get("/api/whatsmiau2/groups", async (req, res) => {
  const { getParticipants } = req.query;

  try {
    const response = await axios.get(`${API_URL}/v1/group/list/${DEFAULT_INSTANCE}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json({
      success: true,
      groups: response.data
    });
  } catch (err) {
    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || { message: err.message };

    console.error(`[Groups Error] ${statusCode}:`, errorData);

    res.status(statusCode).json({
      success: false,
      error: err.message,
      details: errorData
    });
  }
});

// Alias for groups
app.get("/api/groups", async (req, res) => {
  const { getParticipants } = req.query;

  try {
    const response = await axios.get(`${API_URL}/v1/group/list/${DEFAULT_INSTANCE}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Send Text via WhatsMiau2 API
app.post("/api/whatsmiau2/send-text", async (req, res) => {
  const { number, text, instance } = req.body;
  const instanceName = instance || DEFAULT_INSTANCE;

  if (!number || !text) {
    return res.status(400).json({ success: false, error: "Number and text are required" });
  }

  try {
    // Normalize the number
    const jid = normalizeInputToJid(number);
    if (!jid) {
      return res.status(400).json({ success: false, error: "Invalid phone number" });
    }

    // If it's a newsletter, use the newsletter endpoint
    if (jid.includes('@newsletter')) {
      const response = await axios.post(
        `${API_URL}/v1/newsletter/send/${instanceName}`,
        {
          jid: jid,
          message: text
        },
        { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
      );

      res.json({
        success: true,
        ...response.data
      });
      return;
    }

    const response = await axios.post(
      `${API_URL}/v1/message/sendText/${instanceName}`,
      {
        number: jidToFriendly(jid),
        textMessage: { text: text }
      },
      { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
    );

    res.json({
      success: true,
      ...response.data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      details: err.response?.data
    });
  }
});

// Send Media via WhatsMiau2 API
app.post("/api/whatsmiau2/send-media", async (req, res) => {
  const { number, mediatype, media, caption, fileName, mimetype, instance } = req.body;
  const instanceName = instance || DEFAULT_INSTANCE;

  if (!number || !media) {
    return res.status(400).json({ success: false, error: "Number and media are required" });
  }

  try {
    const jid = normalizeInputToJid(number);
    if (!jid) {
      return res.status(400).json({ success: false, error: "Invalid phone number" });
    }

    // For newsletters, media is not yet supported in the API
    if (jid.includes('@newsletter')) {
      return res.status(400).json({
        success: false,
        error: "Media sending to newsletters is not yet supported. Use text messages instead."
      });
    }

    // For groups, send the full JID
    const targetNumber = jid.includes('@g.us') ? jid : jidToFriendly(jid);

    // Determine mimetype from mediatype if not provided
    let mimeType = mimetype || '';
    if (!mimeType && mediatype) {
      const mimetypeMap = {
        'image': 'image/jpeg',
        'video': 'video/mp4',
        'document': 'application/octet-stream'
      };
      mimeType = mimetypeMap[mediatype] || '';
    }

    const response = await axios.post(
      `${API_URL}/v1/message/sendMedia/${instanceName}`,
      {
        number: targetNumber,
        mediaMessage: {
          mediatype: mediatype || 'image',
          media: media,
          mimetype: mimeType,
          caption: caption || '',
          fileName: fileName
        }
      },
      { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
    );

    res.json({
      success: true,
      ...response.data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      details: err.response?.data
    });
  }
});

// Send Audio via WhatsMiau2 API
app.post("/api/whatsmiau2/send-audio", async (req, res) => {
  const { number, audio, ptt, instance } = req.body;
  const instanceName = instance || DEFAULT_INSTANCE;

  if (!number || !audio) {
    return res.status(400).json({ success: false, error: "Number and audio are required" });
  }

  try {
    const jid = normalizeInputToJid(number);
    if (!jid) {
      return res.status(400).json({ success: false, error: "Invalid phone number" });
    }

    // For newsletters, audio is not yet supported in the API
    if (jid.includes('@newsletter')) {
      return res.status(400).json({
        success: false,
        error: "Audio sending to newsletters is not yet supported. Use text messages instead."
      });
    }

    // For groups, send the full JID
    const targetNumber = jid.includes('@g.us') ? jid : jidToFriendly(jid);

    const response = await axios.post(
      `${API_URL}/v1/message/sendWhatsAppAudio/${instanceName}`,
      {
        number: targetNumber,
        audioMessage: {
          audio: audio,
          ptt: ptt !== false
        }
      },
      { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
    );

    res.json({
      success: true,
      ...response.data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      details: err.response?.data
    });
  }
});

// Get Group Invite Link
app.get("/api/group/invite-link", async (req, res) => {
  const { group_id, instance } = req.query;
  const instanceName = instance || DEFAULT_INSTANCE;

  if (!group_id) {
    return res.status(400).json({
      code: 400,
      message: "group_id query param required"
    });
  }

  try {
    const response = await axios.get(
      `${API_URL}/v1/group/invite-link/${instanceName}`,
      {
        headers: { 'apikey': API_KEY },
        params: { group_id: group_id }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      code: err.response?.status || 500,
      message: err.message,
      details: err.response?.data
    });
  }
});

// Alias without instance param
app.get("/group/invite-link", async (req, res) => {
  const { group_id } = req.query;

  if (!group_id) {
    return res.status(400).json({
      code: 400,
      message: "group_id query param required"
    });
  }

  try {
    const response = await axios.get(
      `${API_URL}/v1/group/invite-link/${DEFAULT_INSTANCE}`,
      {
        headers: { 'apikey': API_KEY },
        params: { group_id: group_id }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      code: err.response?.status || 500,
      message: err.message,
      details: err.response?.data
    });
  }
});

/* -------------------------------------------------
   Newsletter (Channels) API
   ------------------------------------------------- */

// Follow Newsletter
app.post("/api/newsletter/follow", async (req, res) => {
  const { newsletter_id, jid, instance } = req.body;
  const instanceName = instance || DEFAULT_INSTANCE;
  const newsletterJid = newsletter_id || jid;

  if (!newsletterJid) {
    return res.status(400).json({ error: "newsletter_id or jid is required" });
  }

  try {
    const response = await axios.post(
      `${API_URL}/v1/newsletter/follow/${instanceName}`,
      { jid: newsletterJid },
      { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Alias for follow
app.post("/newsletter/follow", async (req, res) => {
  const { newsletter_id, jid } = req.body;
  const newsletterJid = newsletter_id || jid;

  if (!newsletterJid) {
    return res.status(400).json({ error: "newsletter_id or jid is required" });
  }

  try {
    const response = await axios.post(
      `${API_URL}/v1/newsletter/follow/${DEFAULT_INSTANCE}`,
      { jid: newsletterJid },
      { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Unfollow Newsletter
app.post("/api/newsletter/unfollow", async (req, res) => {
  const { newsletter_id, jid, instance } = req.body;
  const instanceName = instance || DEFAULT_INSTANCE;
  const newsletterJid = newsletter_id || jid;

  if (!newsletterJid) {
    return res.status(400).json({ error: "newsletter_id or jid is required" });
  }

  try {
    const response = await axios.post(
      `${API_URL}/v1/newsletter/unfollow/${instanceName}`,
      { jid: newsletterJid },
      { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Alias for unfollow
app.post("/newsletter/unfollow", async (req, res) => {
  const { newsletter_id, jid } = req.body;
  const newsletterJid = newsletter_id || jid;

  if (!newsletterJid) {
    return res.status(400).json({ error: "newsletter_id or jid is required" });
  }

  try {
    const response = await axios.post(
      `${API_URL}/v1/newsletter/unfollow/${DEFAULT_INSTANCE}`,
      { jid: newsletterJid },
      { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// List all Newsletters
app.get("/api/newsletter/list", async (req, res) => {
  const { instance } = req.query;
  const instanceName = instance || DEFAULT_INSTANCE;

  try {
    const response = await axios.get(
      `${API_URL}/v1/newsletter/list/${instanceName}`,
      { headers: { 'apikey': API_KEY } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Alias for list newsletters
app.get("/newsletter/list", async (req, res) => {
  try {
    const response = await axios.get(
      `${API_URL}/v1/newsletter/list/${DEFAULT_INSTANCE}`,
      { headers: { 'apikey': API_KEY } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Get Newsletter Info
app.get("/api/newsletter/info", async (req, res) => {
  const { jid, instance } = req.query;
  const instanceName = instance || DEFAULT_INSTANCE;

  if (!jid) {
    return res.status(400).json({ error: "jid query param is required" });
  }

  try {
    const response = await axios.get(
      `${API_URL}/v1/newsletter/${instanceName}/info`,
      {
        headers: { 'apikey': API_KEY },
        params: { jid }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});


/* -------------------------------------------------
   Instance Management API
   ------------------------------------------------- */

// List all instances
app.get("/api/instance/list", async (req, res) => {
  try {
    const url = `${API_URL}/v1/instance/fetchInstances`;
    console.log(`[PROXY] Fetching instances from: ${url}`);
    const response = await axios.get(url, {
      headers: { 'apikey': API_KEY }
    });

    res.json(response.data || []);
  } catch (err) {
    console.error('[Instance List Error]:', err.response?.status === 404 ? '404 Not Found' : err.message);
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Get instance info
app.get("/api/instance/info/:instance", async (req, res) => {
  const { instance } = req.params;

  try {
    const response = await axios.get(`${API_URL}/v1/instance/info/${instance}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Get QR Code
app.get("/api/instance/qrcode/:instance", async (req, res) => {
  const { instance } = req.params;

  try {
    const response = await axios.get(`${API_URL}/v1/instance/connect/${instance}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json(response.data);
  } catch (err) {
    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || { message: err.message };

    console.error(`[QRCode Error] ${statusCode}:`, errorData);

    res.status(statusCode).json({
      error: err.message,
      details: errorData
    });
  }
});

// Create instance
app.post("/api/instance/create", async (req, res) => {
  const { instanceName, qrcode = true } = req.body;

  if (!instanceName) {
    return res.status(400).json({ error: "instanceName is required" });
  }

  try {
    const response = await axios.post(
      `${API_URL}/v1/instance/create`,
      { instanceName, qrcode },
      { headers: { 'Content-Type': 'application/json', 'apikey': API_KEY } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Delete instance
app.delete("/api/instance/delete/:instance", async (req, res) => {
  const { instance } = req.params;

  try {
    const response = await axios.delete(`${API_URL}/v1/instance/delete/${instance}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Logout instance
app.delete("/api/instance/logout/:instance", async (req, res) => {
  const { instance } = req.params;

  try {
    const response = await axios.delete(`${API_URL}/v1/instance/logout/${instance}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

// Get connection state
app.get("/api/instance/connectionState/:instance", async (req, res) => {
  const { instance } = req.params;

  try {
    const response = await axios.get(`${API_URL}/v1/instance/connectionState/${instance}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

/* -------------------------------------------------
   API Proxy - Forward all /api/* requests to Go backend
   ------------------------------------------------- */

// Health Check Proxy - Bypass /v1 prefix
app.get("/api/health", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ status: "offline", error: err.message });
  }
});

// Generic API proxy handler - using regex for Express 5.x
app.all(/^\/api\/.*/, async (req, res) => {
  // /api/xxx -> /v1/xxx
  const apiPath = req.path.replace("/api", "");
  const url = `${API_URL}/v1${apiPath}`;

  console.log(`[PROXY] ${req.method} ${req.path} -> ${url}`);

  try {
    const config = {
      method: req.method,
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      timeout: 60000
    };

    // Forward query params
    if (Object.keys(req.query).length > 0) {
      config.params = req.query;
    }

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      config.data = req.body;
    }

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`[PROXY ERROR] ${req.method} ${apiPath}:`, err.message);

    if (err.response) {
      // API responded with error
      res.status(err.response.status).json(err.response.data);
    } else {
      // Network or other error
      res.status(500).json({
        error: "Proxy error",
        message: err.message
      });
    }
  }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));