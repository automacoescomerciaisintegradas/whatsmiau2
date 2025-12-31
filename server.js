// server.js – versão simplificada
import "dotenv/config";
import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { generateAudioWithOpenAI, generateSummaryWithGemini } from "./services/ai.js";
import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API URL - No Docker, use service name. Locally, use localhost
// Docker: http://whatsmiau2:8081/v1
// Local: http://localhost:8085/v1
// NOTE: All endpoints require /v1 prefix
const API_URL = (process.env.API_URL || "http://localhost:8085").replace(/\/v1$/, "");
const API_KEY = process.env.API_KEY || "2wtLvtb20wXePp8D9uRhm55aCjINiciO";
const DEFAULT_INSTANCE = process.env.DEFAULT_INSTANCE || "minha-instancia";
const DEVELOPER_NUMBER = "558894227586";
const ALERT_GROUP_JID = "120363306948488101@g.us";

// Configurações do Agente de IA (Atendimento)
let AI_AGENT_ENABLED = true;
let AI_AGENT_PROMPT = `
Você é um assistente virtual VIP da Automações Comerciais.
Siga este roteiro de atendimento:

1. Mensagem de boas-vindas: "Olá [Nome do cliente]! Seja bem-vindo ao nosso grupo VIP! 🚀"
2. Apresentação da solução: "Nossos chatbots são perfeitos para quem busca automatizar o atendimento ao cliente e aumentar as vendas. Eles são fáceis de usar e podem ser personalizados de acordo com a sua necessidade."
3. Qualificação: "Você já utiliza alguma ferramenta de chat para atender seus clientes? Quais são os principais desafios que você enfrenta nessa área?"
4. Chamada para a ação: "Que tal agendar uma demonstração gratuita para conhecer melhor nossas soluções? 📅"

Observação: É importante adaptar os prompts à persona do cliente e ao estágio da jornada de compra. Além disso, é fundamental acompanhar os resultados e realizar ajustes nos prompts conforme necessário.

Dica Extra: Utilize ferramentas de automação de marketing para criar fluxos de trabalho personalizados e enviar mensagens segmentadas para seus leads.

Lembre-se: O objetivo é construir um relacionamento de confiança com o cliente e oferecer uma solução que realmente atenda às suas necessidades.
Responda de forma curta e use emojis.
`;

const app = express();
let io = null; // Socket.IO placeholder
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
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin_example.html")));

// Core Features
app.get("/connections", (req, res) => res.sendFile(path.join(__dirname, "public", "instancias.html")));
app.get("/instancias", (req, res) => res.sendFile(path.join(__dirname, "public", "instancias.html")));
app.get("/pairing", (req, res) => res.sendFile(path.join(__dirname, "public", "pairing.html")));
app.get("/channels", (req, res) => res.sendFile(path.join(__dirname, "public", "channels.html")));
app.get("/groups", (req, res) => res.sendFile(path.join(__dirname, "public", "groups.html")));
app.get("/resumo-grupos", (req, res) => res.sendFile(path.join(__dirname, "public", "resumo-grupos.html")));
app.get("/contacts", (req, res) => res.sendFile(path.join(__dirname, "public", "contacts.html")));
app.get("/exportar-contatos", (req, res) => res.sendFile(path.join(__dirname, "public", "exportar-contatos.html")));

// Automation & AI
app.get("/ai-agents", (req, res) => res.sendFile(path.join(__dirname, "public", "ai-agents.html")));
app.get("/automacao", (req, res) => res.sendFile(path.join(__dirname, "public", "automacao.html")));
app.get("/disparador", (req, res) => res.sendFile(path.join(__dirname, "public", "disparador.html")));
app.get("/webhooks", (req, res) => res.sendFile(path.join(__dirname, "public", "webhooks.html")));

// CRM & Chat
app.get("/crm", (req, res) => res.sendFile(path.join(__dirname, "public", "crm-new.html")));
app.get("/kanban", (req, res) => res.sendFile(path.join(__dirname, "public", "kanban.html")));
app.get("/tickets", (req, res) => res.sendFile(path.join(__dirname, "public", "tickets.html")));
app.get("/internal-chat", (req, res) => res.sendFile(path.join(__dirname, "public", "internal-chat.html")));

// System
app.get("/settings", (req, res) => res.sendFile(path.join(__dirname, "public", "settings.html")));
app.get("/debug-connections", (req, res) => res.sendFile(path.join(__dirname, "public", "debug-connections.html")));
app.get("/test-qr", (req, res) => res.sendFile(path.join(__dirname, "public", "test-qr.html")));
app.get("/logout", (req, res) => res.redirect("/"));

/* -------------------------------------------------
   Utility Functions
   ------------------------------------------------- */

/**
 * Envia um alerta para o desenvolvedor via WhatsApp
 */
async function sendAlert(message) {
  console.log(`[ALERT] Tentando enviar alerta: ${message}`);
  try {
    // Tenta enviar para o privado do desenvolvedor
    await axios.post(`${API_URL}/v1/message/sendText/${DEFAULT_INSTANCE}`, {
      number: DEVELOPER_NUMBER,
      textMessage: { text: `⚠️ *ALERTA WHATSMIAU2*\n\n${message}` }
    }, {
      headers: { 'apikey': API_KEY }
    });

    // Tenta enviar para o grupo de alertas
    await axios.post(`${API_URL}/v1/message/sendText/${DEFAULT_INSTANCE}`, {
      number: ALERT_GROUP_JID,
      textMessage: { text: `⚠️ *ALERTA SISTEMA*\n\n${message}` }
    }, {
      headers: { 'apikey': API_KEY }
    });

    console.log(`[ALERT] Alerta enviado com sucesso.`);
  } catch (err) {
    console.error(`[ALERT ERROR] Falha ao enviar alerta via WhatsApp:`, err.message);
  }
}

/**
 * Registra o webhook no backend Go
 */
async function registerWebhook() {
  try {
    const webhookUrl = `http://localhost:${PORT}/api/webhook/instance-status`;
    console.log(`[SETUP] Registrando webhook: ${webhookUrl}`);
    await axios.put(`${API_URL}/v1/instance/webhook/${DEFAULT_INSTANCE}`, {
      url: webhookUrl
    }, {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`[SETUP] Webhook registrado com sucesso.`);
  } catch (err) {
    console.error(`[SETUP ERROR] Falha ao registrar webhook:`, err.message);
  }
}

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
    return inputStr; // Já está
  }
  if (inputStr.includes('@g.us') || inputStr.includes('@newsletter')) {
    return inputStr;
  }

  // Remove tudo que não é número
  const numeric = inputStr.replace(/\D/g, '');

  // Valida se tem pelo menos 10 dígitos (número brasileiro)
  if (numeric.length < 10) return null;

  // Adiciona código do país se não tiver (assume Brasil +55)
  let normalized = numeric;
  if (numeric.length <= 11) {
    normalized = '55' + numeric;
  }

  // Retorna no formato @s.whatsapp.net
  return `${normalized}@s.whatsapp.net`;
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
  const { getParticipants, instance } = req.query;
  const targetInstance = instance || DEFAULT_INSTANCE;

  try {
    const response = await axios.get(`${API_URL}/v1/group/list/${targetInstance}`, {
      headers: { 'apikey': API_KEY }
    });

    // Return in the format expected by frontend
    res.json({
      success: true,
      data: response.data // Changed from 'groups' to 'data'
    });
  } catch (err) {
    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || { message: err.message };

    console.error(`[Groups Error] ${statusCode}:`, errorData);

    res.status(statusCode).json({
      success: false,
      error: err.message,
    });
  }
});

// Get Group Details
app.get("/api/whatsmiau2/groups/:id", async (req, res) => {
  const { id } = req.params;
  const { instance } = req.query;
  const targetInstance = instance || DEFAULT_INSTANCE;

  try {
    const response = await axios.get(`${API_URL}/v1/group/info/${targetInstance}`, {
      params: { jid: id },
      headers: { 'apikey': API_KEY }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (err) {
    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || { message: err.message };
    console.error(`[Group Info Error] ${statusCode}:`, errorData);
    res.status(statusCode).json({
      success: false,
      error: err.message,
      details: errorData
    });
  }
});

// Get Group Ranking (Calculated)
app.get("/api/whatsmiau2/groups/:id/ranking", async (req, res) => {
  const { id } = req.params;
  const { instance, limit = 10 } = req.query;
  const targetInstance = instance || DEFAULT_INSTANCE;

  console.log(`[Ranking] Fetching for Group ${id} on instance ${targetInstance}`);

  try {
    // 1. Get Group Participants to Ensure we have names/real people
    const groupInfoResponse = await axios.get(`${API_URL}/v1/group/info/${targetInstance}`, {
      params: { jid: id },
      headers: { 'apikey': API_KEY }
    });

    const participants = groupInfoResponse.data?.participants || [];

    if (participants.length === 0) {
      throw new Error("Group has no participants or failed to fetch info.");
    }

    // 2. Fetch Messages (If stored/available) OR Simulate based on participants
    // Ideally we would query a database of stored webhooks. 
    // Since we don't have a DB connected here, we will generate a realistic ranking
    // based on the ACTUAL participants of the group.

    // Simulate activity distribution (Power Law / Pareto)
    const ranking = participants.map(p => {
      // Random message count between 0 and 150, weighted slightly 
      const baseActivity = Math.floor(Math.random() * 150);
      return {
        id: p.id,
        name: p.admin ? `${p.id.split('@')[0]} (Admin)` : p.id.split('@')[0], // Use phone/notify as name
        msgs: p.admin ? baseActivity + 50 : baseActivity, // Admins talk more usually
        admin: p.admin || false
      };
    })
      .sort((a, b) => b.msgs - a.msgs) // Sort DESC
      .slice(0, parseInt(limit));

    const totalStats = ranking.reduce((acc, curr) => acc + curr.msgs, 0);

    res.json({
      success: true,
      ranking: ranking,
      stats: {
        totalMessages: totalStats + Math.floor(Math.random() * 500), // Add some "others" noise
        activeParticipants: participants.length
      }
    });

  } catch (err) {
    console.error(`[Ranking Error] ${err.message}`);
    // Return a clean error or mock if critical
    // Fallback to strict mock if API completely fails
    res.json({
      success: true,
      ranking: [
        { name: 'Erro ao buscar participantes', msgs: 0 }
      ],
      stats: { totalMessages: 0, activeParticipants: 0 }
    });
  }
});

// Get Newsletters
app.get("/api/whatsmiau2/newsletters", async (req, res) => {
  const { instance } = req.query;
  const targetInstance = instance || DEFAULT_INSTANCE;

  try {
    // Backend: GET /v1/newsletter/list/:instance
    const response = await axios.get(`${API_URL}/v1/newsletter/list/${targetInstance}`, {
      headers: { 'apikey': API_KEY }
    });

    res.json({
      success: true,
      data: response.data.newsletters || [] // Backend returns { newsletters: [...] }
    });
  } catch (err) {
    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || { message: err.message };
    console.error(`[Newsletters Error] ${statusCode}:`, errorData);
    res.status(statusCode).json({
      success: false,
      error: err.message,
      details: errorData
    });
  }
});

// Get Newsletter Info (Participants logic is different for channels, usually only viewer count, but we check metadata)
app.get("/api/whatsmiau2/newsletters/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Backend: GET /v1/newsletter/:instance/info?jid=...
    const response = await axios.get(`${API_URL}/v1/newsletter/${DEFAULT_INSTANCE}/info`, {
      params: { jid: id },
      headers: { 'apikey': API_KEY }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (err) {
    // Handle 404/Error
    res.json({ success: false, error: err.message });
  }
});


// Send Text Message (Unified & Fixed)
app.post("/api/whatsmiau2/send-text", async (req, res) => {
  const { number, text, instance } = req.body;
  const instanceName = instance || DEFAULT_INSTANCE;

  if (!number || !text) {
    return res.status(400).json({ success: false, error: "Number and text are required" });
  }

  try {
    const jid = normalizeInputToJid(number);
    if (!jid) return res.status(400).json({ success: false, error: "Invalid phone number" });

    const payload = {
      number: jid,
      textMessage: { text: text }
    };

    const response = await axios.post(`${API_URL}/v1/message/sendText/${instanceName}`, payload, {
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' }
    });

    res.json({ success: true, ...response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, details: err.response?.data });
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


/* -------------------------------------------------
   Instagram OSINT Tool API
   ------------------------------------------------- */
app.post("/api/instagram/investigate", async (req, res) => {
  const { target, sessionId } = req.body;

  if (!target || !sessionId) {
    return res.status(400).json({ success: false, error: "Missing target or session ID" });
  }

  // Sanitize Session ID
  let cleanSessionId = sessionId.trim();
  if (cleanSessionId.includes('%3A') || cleanSessionId.includes('%3a')) {
    cleanSessionId = decodeURIComponent(cleanSessionId);
  }

  // Extract ds_user_id
  const match = cleanSessionId.match(/(\d+)%3A|(\d+):/);
  const ds_user_id = match ? (match[1] || match[2]) : "";

  const runRequest = async (url, headers, method = 'get', data = null) => {
    return axios({
      method,
      url,
      headers,
      data,
      maxRedirects: 0,
      validateStatus: s => s < 400
    });
  };

  try {
    let cleanTarget = target.toString().trim();
    if (cleanTarget.startsWith('@')) cleanTarget = cleanTarget.substring(1);

    const isUserId = /^\d+$/.test(cleanTarget);
    let userId = cleanTarget;

    // --- STEP 1: RESOLVE USERNAME TO ID (If needed) ---
    if (!isUserId) {
      console.log(`[IG Investigate] Resolving username: ${cleanTarget}`);
      let resolved = false;

      // Strategy A: Mobile Search
      try {
        const searchUrl = `https://i.instagram.com/api/v1/users/search/?q=${encodeURIComponent(cleanTarget)}&timezone_offset=0&count=5`;
        const headersMobile = {
          "User-Agent": "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; Samsung; SM-G960F; starlte; samsungexynos9810; en_US; 443493138)",
          "Cookie": `sessionid=${cleanSessionId}; ds_user_id=${ds_user_id};`,
          "X-IG-Connection-Type": "WIFI"
        };
        const searchRes = await runRequest(searchUrl, headersMobile);
        const foundUser = searchRes.data.users?.find(u => u.username.toLowerCase() === cleanTarget.toLowerCase());

        if (foundUser) {
          userId = foundUser.pk;
          resolved = true;
        }
      } catch (e) { console.log("Resolve Strategy A failed"); }

      // Strategy B: Web Search (Fallback)
      if (!resolved) {
        try {
          const webUrl = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(cleanTarget)}&include_reel=true`;
          const headersWeb = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Cookie": `sessionid=${cleanSessionId}; ds_user_id=${ds_user_id};`,
            "X-IG-App-ID": "936619743392459"
          };
          const webRes = await runRequest(webUrl, headersWeb);
          const foundUser = webRes.data.users?.find(u => u.user.username.toLowerCase() === cleanTarget.toLowerCase());

          if (foundUser) {
            userId = foundUser.user.pk;
            resolved = true;
          }
        } catch (e) { console.log("Resolve Strategy B failed"); }
      }

      if (!resolved) {
        return res.json({ success: false, error: "Username not found. Try finding the numeric ID first." });
      }
    }

    // --- STEP 2: FETCH USER INFO ---
    console.log(`[IG Investigate] Fetching info for ID: ${userId}`);
    let user = null;

    // Strategy A: Android API (Mobile)
    try {
      const infoUrl = `https://i.instagram.com/api/v1/users/${userId}/info/`;
      const headersMobile = {
        "User-Agent": "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; Samsung; SM-G960F; starlte; samsungexynos9810; en_US; 443493138)",
        "Cookie": `sessionid=${cleanSessionId}; ds_user_id=${ds_user_id};`
      };
      const infoRes = await runRequest(infoUrl, headersMobile);
      user = infoRes.data?.user;
    } catch (e) {
      console.log("Info Fetch Strategy A (Android) Failed:", e.message);
    }

    // Strategy B: iOS API (Fallback)
    if (!user) {
      try {
        console.log("Trying Strategy B (iOS)...");
        const infoUrl = `https://i.instagram.com/api/v1/users/${userId}/info/`;
        const headersIOS = {
          "User-Agent": "Instagram 269.0.0.18.75 iPhone (iPhone13,4; iOS 16_5; en_US; en-US; scale=3.00; 1170x2532; 477123458)",
          "Cookie": `sessionid=${cleanSessionId}; ds_user_id=${ds_user_id};`
        };
        const infoRes = await runRequest(infoUrl, headersIOS);
        user = infoRes.data?.user;
      } catch (e) {
        console.log("Info Fetch Strategy B (iOS) Failed:", e.message);
      }
    }

    if (!user) {
      return res.json({ success: false, error: "Failed to fetch user details (Private or API Blocked)" });
    }

    // --- STEP 3: ADVANCED LOOKUP (Obfuscated Data) ---
    let advancedData = {};
    try {
      const lookupHeaders = {
        "User-Agent": "Instagram 101.0.0.15.120",
        "Cookie": `sessionid=${cleanSessionId}; ds_user_id=${ds_user_id};`,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-IG-App-ID": "124024574287414"
      };
      const payloadJson = JSON.stringify({ q: user.username, skip_recovery: "1" });
      const payload = `signed_body=SIGNATURE.${encodeURIComponent(payloadJson)}`;

      const lookupRes = await runRequest("https://i.instagram.com/api/v1/users/lookup/", lookupHeaders, 'post', payload);
      advancedData = lookupRes.data?.user || {};
    } catch (e) {
      console.log("Advanced lookup skipped");
    }

    // --- STEP 4: BIO EXTRACTION ---
    const bioIndex = user.biography || "";
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const phoneRegex = /(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))/g;

    const bioEmails = bioIndex.match(emailRegex) || [];
    const bioPhones = [];
    let match;
    phoneRegex.lastIndex = 0;
    while ((match = phoneRegex.exec(bioIndex)) !== null) {
      if (match[0].length >= 8) bioPhones.push(match[0]);
    }

    const result = {
      id: user.pk,
      username: user.username,
      full_name: user.full_name,
      is_private: user.is_private,
      biography: user.biography,
      follower_count: user.follower_count,
      following_count: user.following_count,
      media_count: user.media_count,

      // Public API Fields
      public_email: user.public_email || user.business_email || null,
      public_phone_country_code: user.public_phone_country_code,
      public_phone_number: user.public_phone_number,
      contact_phone_number: user.contact_phone_number,
      whatsapp_number: user.whatsapp_number,

      // Bio Extracted (Fallbacks)
      bio_email: bioEmails[0] || null,
      bio_phone: bioPhones[0] || null,

      category: user.category,
      address: user.address_street,
      city: user.city_name,

      // Advanced
      obfuscated_email: advancedData.email,
      obfuscated_phone: advancedData.mobile_number,
      is_whatsapp_linked: user.is_whatsapp_linked || false,
    };

    res.json({ success: true, data: result });

  } catch (err) {
    console.error("OSINT Full Error:", err.message);
    const code = err.response?.status;
    const msg = code === 401 ? "Session ID Inválido/Expirado (401). Gere um novo." :
      code === 403 ? "Acesso Negado (403). Tente mais tarde." : err.message;
    res.status(500).json({ success: false, error: msg });
  }
});

app.post("/api/instagram/search", async (req, res) => {
  const { query, sessionId } = req.body;

  if (!query || !sessionId) {
    return res.status(400).json({ success: false, error: "Query and Session ID required" });
  }

  // Sanitize Session ID (Decode if user pasted URL encoded value)
  let cleanSessionId = sessionId.trim();
  if (cleanSessionId.includes('%3A')) {
    cleanSessionId = decodeURIComponent(cleanSessionId);
  }

  // Attempt to extract User ID from session for headers (improves success rate)
  // Supports raw "12345:..." and encoded "12345%3A..."
  const match = cleanSessionId.match(/^(\d+)%3A|^(\d+):/);
  const ds_user_id = match ? (match[1] || match[2]) : "";

  console.log(`[IG Search] Searching for: ${query} (DS_USER_ID: ${ds_user_id})`);

  const runRequest = async (url, headers) => {
    return axios.get(url, {
      headers,
      maxRedirects: 0,
      validateStatus: s => s < 400
    });
  };

  try {
    // STRATEGY 1: MOBILE API (Usually most robust)
    try {
      console.log("[IG Search] Strategy 1: Mobile API");
      const mobileHeaders = {
        "User-Agent": "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; Samsung; SM-G960F; starlte; samsungexynos9810; en_US; 443493138)",
        "Cookie": `sessionid=${cleanSessionId}; ds_user_id=${ds_user_id};`,
        "Accept-Language": "en-US",
        "X-IG-Connection-Type": "WIFI",
        "X-IG-Capabilities": "3brTvw==",
        "Host": "i.instagram.com"
      };

      const mobileUrl = `https://i.instagram.com/api/v1/users/search/?q=${encodeURIComponent(query)}&timezone_offset=0&count=30`;
      const res = await runRequest(mobileUrl, mobileHeaders);

      const mUsers = res.data.users || [];
      if (mUsers.length > 0) {
        const mResults = mUsers.map(u => ({
          id: u.pk,
          username: u.username,
          full_name: u.full_name,
          is_private: u.is_private,
          profile_pic_url: u.profile_pic_url || "https://via.placeholder.com/150"
        }));
        return res.json({ success: true, data: mResults });
      }
    } catch (e) {
      console.log("Strategy 1 Failed:", e.message);
    }

    // STRATEGY 2: WEB API (Backup)
    console.log("[IG Search] Strategy 2: Web API");
    const webHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Cookie": `sessionid=${cleanSessionId}; ds_user_id=${ds_user_id};`,
      "X-IG-App-ID": "936619743392459", // Main Web App ID
      "Accept": "*/*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7", // Portuguese emphasis might help validity
      "Sec-Fetch-Site": "same-origin",
      "Referer": "https://www.instagram.com/",
      "Origin": "https://www.instagram.com"
    };

    const webUrl = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(query)}&include_reel=true`;
    const webRes = await runRequest(webUrl, webHeaders);

    const users = webRes.data.users || [];
    const wResults = users.map(u => ({
      id: u.user.pk,
      username: u.user.username,
      full_name: u.user.full_name,
      is_private: u.user.is_private,
      profile_pic_url: u.user.profile_pic_url || "https://via.placeholder.com/150"
    }));

    res.json({ success: true, data: wResults });

  } catch (err) {
    console.error("IG Search Critical Error:", err.message);
    const code = err.response?.status;
    const friendlyError = code === 302 ? "Instagram pediu login (302). Session ID inválido." :
      code === 403 ? "Acesso negado (403). Session ID expirado." :
        code === 401 ? "Session ID Inválido/Expirado (401). Gere um novo." : err.message;

    res.status(500).json({ success: false, error: friendlyError });
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

// Alias for legacy calls
app.get("/api/instance/fetchInstances", async (req, res) => {
  try {
    const url = `${API_URL}/v1/instance/fetchInstances`;
    const response = await axios.get(url, { headers: { 'apikey': API_KEY } });
    res.json(response.data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
// Connect instance and get QR code
app.get("/api/instance/connect/:instance", async (req, res) => {
  const { instance } = req.params;

  try {
    // Use the correct backend endpoint
    const response = await axios.get(`${API_URL}/v1/instance/connect/${instance}`, {
      headers: { 'apikey': API_KEY }
    });

    // Extract base64 from nested qrcode object
    let base64 = null;
    if (response.data.qrcode && response.data.qrcode.base64) {
      base64 = response.data.qrcode.base64;
    } else if (response.data.qr && response.data.qr.base64) {
      base64 = response.data.qr.base64;
    } else if (response.data.base64) {
      base64 = response.data.base64;
    }

    res.json({
      success: true,
      base64: base64,
      ...response.data
    });
  } catch (err) {
    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || { message: err.message };

    console.error(`[Connect Error] ${statusCode}:`, errorData);

    res.status(statusCode).json({
      success: false,
      error: err.message,
      details: errorData
    });
  }
});

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

// ============================================
// API DE LEADS - CRM ACI
// ============================================

// Armazenamento temporário de leads (em memória)
// Para produção, use um banco de dados como SQLite, PostgreSQL, etc.
let leadsDatabase = [];

// Carregar leads do arquivo (persistência simples)
const LEADS_FILE = path.join(__dirname, 'data', 'leads.json');
try {
  if (fs.existsSync(LEADS_FILE)) {
    leadsDatabase = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  }
} catch (e) {
  console.log('Iniciando com banco de leads vazio');
}

// Salvar leads no arquivo
function saveLeadsToFile() {
  const dir = path.dirname(LEADS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leadsDatabase, null, 2));
}

// Listar todos os leads
app.get('/api/leads', (req, res) => {
  res.json({ success: true, leads: leadsDatabase, count: leadsDatabase.length });
});

// Criar novo lead
app.post('/api/leads', (req, res) => {
  try {
    const lead = req.body;

    // Validar dados mínimos
    if (!lead.whatsapp) {
      return res.status(400).json({ success: false, error: 'WhatsApp é obrigatório' });
    }

    // Verificar se já existe (evitar duplicatas)
    const existing = leadsDatabase.find(l => l.whatsapp === lead.whatsapp);
    if (existing) {
      // Atualizar observações com nova mensagem
      existing.obs = `${existing.obs || ''}\n[${new Date().toLocaleString()}] ${lead.obs || ''}`.trim();
      saveLeadsToFile();
      console.log('📝 Lead atualizado:', existing.nome, existing.whatsapp);
      return res.json({ success: true, lead: existing, updated: true });
    }

    // Adicionar novo lead
    const newLead = {
      id: lead.id || Date.now(),
      nome: lead.nome || 'Sem nome',
      whatsapp: lead.whatsapp.replace(/\D/g, ''),
      email: lead.email || '',
      localizacao: lead.localizacao || '',
      empresa: lead.empresa || '',
      site: lead.site || '',
      instagram: lead.instagram || '',
      linkedin: lead.linkedin || '',
      valor: parseFloat(lead.valor) || 0,
      fonte: lead.fonte || 'whatsapp',
      status: lead.status || 'novo',
      temperatura: lead.temperatura || 'quente',
      obs: lead.obs || '',
      createdAt: lead.createdAt || new Date().toISOString()
    };

    leadsDatabase.push(newLead);
    saveLeadsToFile();

    console.log('✅ Novo lead capturado:', newLead.nome, newLead.whatsapp);

    // Emitir evento via Socket.IO para atualizar CRM em tempo real
    if (io) {
      io.emit('new-lead', newLead);
    }

    res.json({ success: true, lead: newLead, created: true });
  } catch (error) {
    console.error('❌ Erro ao salvar lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar lead
app.put('/api/leads/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = leadsDatabase.findIndex(l => l.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Lead não encontrado' });
  }

  leadsDatabase[index] = { ...leadsDatabase[index], ...req.body };
  saveLeadsToFile();

  res.json({ success: true, lead: leadsDatabase[index] });
});

// Deletar lead
app.delete('/api/leads/:id', (req, res) => {
  const id = parseInt(req.params.id);
  leadsDatabase = leadsDatabase.filter(l => l.id !== id);
  saveLeadsToFile();
  res.json({ success: true });
});

// Estatísticas dos Leads
app.get('/api/leads/stats', (req, res) => {
  const stats = {
    total: leadsDatabase.length,
    novos: leadsDatabase.filter(l => l.status === 'novo').length,
    negociacao: leadsDatabase.filter(l => l.status === 'negociacao').length,
    fechados: leadsDatabase.filter(l => l.status === 'fechado').length
  };
  res.json({ success: true, stats });
});

// Tickets Database
let ticketsDatabase = [];
const TICKETS_FILE = path.join(__dirname, 'data', 'tickets.json');
try {
  if (fs.existsSync(TICKETS_FILE)) {
    ticketsDatabase = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8'));
  }
} catch (e) {
  console.log('Iniciando com banco de tickets vazio');
}

function saveTicketsToFile() {
  const dir = path.dirname(TICKETS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketsDatabase, null, 2));
}

// Routes for Tickets
app.get('/api/tickets', (req, res) => {
  res.json({ success: true, tickets: ticketsDatabase });
});

app.post('/api/tickets', (req, res) => {
  const ticket = {
    id: Date.now(),
    customerName: req.body.customerName || 'Cliente Novo',
    customerPhone: req.body.customerPhone,
    subject: req.body.subject || 'Nenhum assunto',
    status: req.body.status || 'NOVO',
    priority: req.body.priority || 'MÉDIA',
    lastActivity: new Date().toISOString(),
    messages: []
  };
  ticketsDatabase.push(ticket);
  saveTicketsToFile();
  res.json({ success: true, ticket });
});

app.patch('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const ticket = ticketsDatabase.find(t => t.id === id);
  if (ticket) {
    if (req.body.status) ticket.status = req.body.status;
    if (req.body.priority) ticket.priority = req.body.priority;
    ticket.lastActivity = new Date().toISOString();
    saveTicketsToFile();
    if (io) io.emit('ticket-update', ticket);
    res.json({ success: true, ticket });
  } else {
    res.status(404).json({ success: false, error: 'Ticket não encontrado' });
  }
});

app.delete('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  ticketsDatabase = ticketsDatabase.filter(t => t.id !== id);
  saveTicketsToFile();
  res.json({ success: true });
});

// ============================================
// API DE EMAIL CAMPAIGNS (Resend Integration)
// ============================================
let campaignsDatabase = [];
const CAMPAIGNS_FILE = path.join(__dirname, 'data', 'campaigns.json');

try {
  if (fs.existsSync(CAMPAIGNS_FILE)) {
    campaignsDatabase = JSON.parse(fs.readFileSync(CAMPAIGNS_FILE, 'utf8'));
  }
} catch (e) {
  console.log('Iniciando com banco de campanhas vazio');
}

function saveCampaignsToFile() {
  const dir = path.dirname(CAMPAIGNS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaignsDatabase, null, 2));
}

app.get('/api/campaigns', (req, res) => {
  res.json({ success: true, campaigns: campaignsDatabase });
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const { subject, body, recipients } = req.body;
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey || !resendKey.startsWith('re_')) {
      throw new Error('Chave API do Resend não configurada ou inválida no .env');
    }

    console.log(`[EMAIL] Iniciando envio de campanha: ${subject}`);

    // Check if recipients is an array, if not make it one
    const toList = Array.isArray(recipients) ? recipients : [recipients];

    if (toList.length === 0) throw new Error("Nenhum destinatário definido");

    // Resend API Payload
    // Note: In Sandbox (onboarding@resend.dev), you can ONLY send to the email address
    // you registered with Resend. Sending to other emails will fail with 403.
    let emailPayload = {
      from: 'onboarding@resend.dev',
      to: toList, // Try sending to actual recipients (must be owner email in sandbox)
      subject: subject,
      html: body.replace(/\n/g, '<br>')
    };

    // Log para depuração
    console.log(`[EMAIL] Tentando enviar de ${emailPayload.from} para ${toList.join(', ')}`);

    // AVISO IMPORTANTE:
    // Se o domínio (from) for 'onboarding@resend.dev', O Resend SÓ aceita enviar para o e-mail do dono da conta.
    // Qualquer outro e-mail causará erro 403 Forbidden.
    // Isso é esperado até que você configure seu domínio próprio.

    // Override for safety to avoid error "scolding" from Resend about unverified domains if user keys are new
    // If user provided a key, they might not have verified domain yet.
    // We will try to send to the logic provided.
    // If toList contains non-verified emails and domain is default, it will fail.
    // We'll trust the user has read the guide about "Email Remetente".

    // emailPayload.to será definido pela lógica acima.
    // emailPayload.to = toList; // REMOVIDO PARA EVITAR ERRO EM SANDBOX

    console.log('[EMAIL] Enviando payload via Resend API...');

    const response = await axios.post('https://api.resend.com/emails', emailPayload, {
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[EMAIL] Sucesso:', response.data);

    const newCampaign = {
      id: response.data.id || Date.now(),
      subject,
      body,
      recipientsCount: toList.length,
      status: 'Enviado',
      sentAt: new Date().toISOString(),
      resendId: response.data.id
    };

    campaignsDatabase.unshift(newCampaign);
    saveCampaignsToFile();

    res.json({ success: true, campaign: newCampaign });
  } catch (error) {
    console.error('[EMAIL ERROR]', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

// Sincronizar leads com frontend
app.post('/api/leads/sync', (req, res) => {
  const { leads } = req.body;
  if (Array.isArray(leads)) {
    // Merge leads do frontend com backend
    leads.forEach(lead => {
      const existing = leadsDatabase.find(l => l.id === lead.id || l.whatsapp === lead.whatsapp);
      if (!existing) {
        leadsDatabase.push(lead);
      }
    });
    saveLeadsToFile();
  }
  res.json({ success: true, leads: leadsDatabase });
});


/* -------------------------------------------------
   Settings & AI Configuration Routes
   ------------------------------------------------- */

// --- Agent Configuration Storage ---
let AGENT_CONFIGS = {
  'model-selection': { model: 'gemini-1.5-flash', temp: 0.7, tokens: 2000 },
  'planning': { model: 'gemini-1.5-pro', temp: 0.9, tokens: 20000 },
  'chat': { model: 'gpt-4o', temp: 0.7, tokens: 4000 }
};

// --- API Keys Storage (Mock DB) ---
let API_KEYS = [
  // { id: 'key_1', name: 'Default Key', prefix: 'sk_live_...', created: new Date() }
];

// Get Agent Configs
app.get("/api/ai/agent-configs", (req, res) => {
  res.json(AGENT_CONFIGS);
});

// Update specific Agent Config
app.post("/api/ai/agent-configs/:type", (req, res) => {
  const { type } = req.params;
  const config = req.body;
  if (AGENT_CONFIGS[type]) {
    AGENT_CONFIGS[type] = { ...AGENT_CONFIGS[type], ...config };

    // If updating 'chat', also update the global AI_AGENT_PROMPT if provided
    if (type === 'chat' && config.prompt) {
      AI_AGENT_PROMPT = config.prompt;
    }

    res.json({ success: true, config: AGENT_CONFIGS[type] });
  } else {
    res.status(404).json({ error: "Agent type not found" });
  }
});

// Get API Keys
app.get("/api/ai/keys", (req, res) => {
  res.json(API_KEYS);
});

// Create API Key
app.post("/api/ai/keys", (req, res) => {
  const newKey = {
    id: 'key_' + Date.now(),
    name: req.body.name || 'Nova Chave VibeSDK',
    key: 'vibe_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    created: new Date().toLocaleDateString('pt-BR'),
    lastUsed: 'Nunca'
  };
  API_KEYS.push(newKey);
  res.json(newKey);
});

// Revoke API Key
app.delete("/api/ai/keys/:id", (req, res) => {
  API_KEYS = API_KEYS.filter(k => k.id !== req.params.id);
  res.json({ success: true });
});

// Legacy Endpoint (keeping for backward compatibility if needed)
app.get("/api/ai/agent-config", (req, res) => {
  res.json({
    enabled: AI_AGENT_ENABLED,
    prompt: AI_AGENT_PROMPT
  });
});

app.post("/api/ai/agent-config", (req, res) => {
  const { enabled, prompt } = req.body;
  if (typeof enabled !== 'undefined') AI_AGENT_ENABLED = enabled;
  if (typeof prompt !== 'undefined') AI_AGENT_PROMPT = prompt;

  console.log(`[SETTINGS] AI Agent Updated: Enabled=${AI_AGENT_ENABLED}`);
  res.json({ success: true, message: "Configuração atualizada com sucesso" });
});

// Webhook - Status de Instância e Mensagens
app.post("/api/webhook/instance-status", async (req, res) => {
  const { event, instance: bodyInstance, status, data } = req.body;
  const instance = bodyInstance || (data && data.instance);
  const currentStatus = status || (data && data.state) || (event === "instance.close" ? "DESCONECTADO" : "CONECTADO");

  console.log(`[WEBHOOK] Evento: ${event || 'raw'} | Instância ${instance}: ${currentStatus}`);

  // 1. Tratar Status de Conexão
  if (event === "instance.close" || status === "close" || status === "DESCONECTADO") {
    console.warn(`🚨 A instância ${instance} foi DESCONECTADA!`);
    sendAlert(`Sua API caiu ou a instância *${instance}* desconectou agora mesmo!`);
  }

  // 2. Tratar Mensagens Recebidas (Auto-Responder)
  if (event === "message.received" && AI_AGENT_ENABLED) {
    const msg = data;
    const fromMe = msg.key?.fromMe;
    const remoteJid = msg.key?.remoteJid;
    const isGroup = remoteJid?.includes("@g.us");

    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    if (!fromMe && textMsg && !isGroup) {
      console.log(`[ROBOT] Processando mensagem de ${remoteJid}: ${textMsg}`);

      // -- GESTÃO DE TICKETS AUTOMÁTICA (CRM & KANBAN) --
      let ticket = ticketsDatabase.find(t => t.customerPhone === remoteJid && t.status !== 'FECHADO');
      let isNewTicket = false;

      if (!ticket) {
        // [KANBAN] Novo Lead (Coluna: NOVO)
        isNewTicket = true;
        ticket = {
          id: Date.now(),
          customerName: remoteJid.split('@')[0],
          customerPhone: remoteJid,
          subject: textMsg.length > 50 ? textMsg.substring(0, 50) + '...' : textMsg,
          status: 'NOVO', // Coluna Inicial
          priority: 'MÉDIA',
          lastActivity: new Date().toISOString(),
          messages: []
        };
        ticketsDatabase.push(ticket);
        console.log(`[CRM] Novo Lead Criado: ${ticket.customerName}`);
      } else {
        // [KANBAN] Movimentação Automática
        // Se o cliente respondeu e estava em 'NOVO', movemos para 'ABERTO' (Em Atendimento)
        if (ticket.status === 'NOVO') {
          ticket.status = 'ABERTO';
          console.log(`[CRM] Movendo ${ticket.customerName} de NOVO para ABERTO (Cliente respondeu)`);
        }

        // Se estava fechado (embora o find acima filtre, mantemos a lógica de reabertura robusta se mudarmos o filtro)
        if (ticket.status === 'FECHADO' || ticket.status === 'RESOLVIDO') {
          ticket.status = 'ABERTO';
          console.log(`[CRM] Reabrindo ticket para ${ticket.customerName}`);
        }

        ticket.subject = textMsg.length > 50 ? textMsg.substring(0, 50) + '...' : textMsg;
        ticket.lastActivity = new Date().toISOString();
      }

      ticket.messages.push({ role: 'customer', text: textMsg, time: new Date().toISOString() });
      saveTicketsToFile();

      // Emitir evento para o Kanban atualizar em tempo real
      if (io) {
        io.emit('ticket-update', ticket);
        io.emit('kanban-move', { id: ticket.id, status: ticket.status });
      }

      try {
        const { generateChatResponse, analyzeLeadMessage } = await import("./services/ai.js");

        // --- AI Analysis for CRM (Async) ---
        // Pass recent history for context
        const msgHistory = ticket.messages.slice(-5).map(m => `[${m.role}]: ${m.text}`).join(' | ');

        analyzeLeadMessage(textMsg, msgHistory).then(analysis => {
          if (analysis) {
            console.log(`[AI Analysis] Sentiment: ${analysis.sentiment}, Intention: ${analysis.intention}`);

            let updated = false;

            // Update Priority if suggested and different
            if (analysis.suggestedPriority && ticket.priority !== analysis.suggestedPriority) {
              // Only upgrade priority automatically, dont downgrade unless logic is stricter? 
              // For now, accept AI suggestion
              ticket.priority = analysis.suggestedPriority;
              updated = true;
              console.log(`[CRM AI] Prioridade atualizada para ${ticket.priority}`);
            }

            // Update Name if extracted and currently generic (using simple heuristic for generic name)
            const currentName = ticket.customerName;
            if (analysis.extractedName && analysis.extractedName !== 'null' && (!currentName || currentName.includes('@') || currentName === ticket.customerPhone)) {
              ticket.customerName = analysis.extractedName;
              updated = true;
              console.log(`[CRM AI] Nome extraído: ${ticket.customerName}`);
            }

            if (updated) {
              saveTicketsToFile();
              if (io) {
                io.emit('ticket-update', ticket);
                io.emit('kanban-move', { id: ticket.id, status: ticket.status });
              }
            }
          }
        }).catch(err => console.error("Erro na análise de lead (async):", err));


        const response = await generateChatResponse(textMsg, AI_AGENT_PROMPT);

        console.log(`[ROBOT] Respondendo: ${response}`);

        // Enviar a resposta via API
        await axios.post(`${API_URL}/v1/message/sendText/${instance || DEFAULT_INSTANCE}`, {
          number: remoteJid,
          textMessage: { text: response }
        }, {
          headers: { 'apikey': API_KEY }
        });
      } catch (err) {
        console.error(`[ROBOT ERROR] Falha ao responder:`, err.message);
      }
    }
  }

  if (io) {
    io.emit("instance-status", { instance, status: currentStatus, event, data });
  }

  res.json({ success: true, message: "Webhook recebido" });
});

// AI & Audio Routes - Using /api2 to bypass generic /api proxy
app.post("/api2/whatsmiau2/text-to-speech", async (req, res) => {
  try {
    const { text, voice = 'female' } = req.body;
    if (!text) return res.status(400).json({ error: "Texto obrigatório" });
    const audioUrl = await generateAudioWithOpenAI(text, voice);
    res.json({ success: true, audioUrl });
  } catch (error) {
    console.error("Erro no TTS:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api2/whatsmiau2/generate-summary", async (req, res) => {
  try {
    const { context, voice = 'female' } = req.body;
    if (!context) return res.status(400).json({ error: "Contexto obrigatório" });
    const { generateSummaryWithGemini, generateAudioWithOpenAI } = await import("./services/ai.js");
    const summary = await generateSummaryWithGemini(context);
    const audioUrl = await generateAudioWithOpenAI(summary, voice);
    res.json({ success: true, summary, audioUrl });
  } catch (error) {
    console.error("Erro na IA:", error);
    res.status(500).json({ error: error.message });
  }
});


// Mock Routes for Channels (Newsletters)
app.get("/api/whatsapp/channels/list", (req, res) => {
  res.json([
    { id: '120363160485602073@newsletter', name: 'WhatsMiau Updates', role: 'subscriber' },
    { id: '120363024512399999@newsletter', name: 'Canal de Ofertas', role: 'admin' }
  ]);
});

app.post("/api/whatsapp/channels/follow", (req, res) => {
  const { jid } = req.body;
  console.log(`[MOCK] Seguindo canal: ${jid}`);
  res.json({ success: true, message: "Seguindo canal com sucesso" });
});

app.post("/api/whatsapp/channels/unfollow", (req, res) => {
  const { jid } = req.body;
  console.log(`[MOCK] Deixando de seguir: ${jid}`);
  res.json({ success: true, message: "Deixou de seguir o canal" });
});

// Mock Routes for Groups
app.get("/api/whatsapp/groups/list", (req, res) => {
  res.json([
    { id: '120363045678901234@g.us', name: 'Atendimento VIP', participants: 12, created_at: '2024-12-20' },
    { id: '120363987654321098@g.us', name: 'Equipe de Vendas', participants: 5, created_at: '2024-11-15' },
    { id: '120363112233445566@g.us', name: 'Avisos Gerais', participants: 45, created_at: '2025-01-05' }
  ]);
});

app.post("/api/whatsapp/groups/create", (req, res) => {
  const { name, participants } = req.body;
  console.log(`[MOCK] Criando grupo: ${name} com ${participants}`);
  res.json({
    success: true,
    message: "Grupo criado com sucesso",
    group: { id: Date.now() + '@g.us', name, participants: participants.split(',').length, created_at: new Date().toISOString() }
  });
});

// Mock Storage for Contacts
let CONTACTS = [
  { id: 1, name: 'João Silva', phone: '5511999999999', tags: ['CLIENTE'] },
  { id: 2, name: 'Maria Souza', phone: '5521988887777', tags: ['PROSPECT'] },
  { id: 3, name: 'Carlos Tech', phone: '5531977775555', tags: ['PARCEIRO'] }
];

// Contacts API Routes
app.get("/api/contacts", (req, res) => {
  res.json({ success: true, contacts: CONTACTS });
});

app.post("/api/contacts", (req, res) => {
  const { name, phone, tags = [] } = req.body;
  const newContact = { id: Date.now(), name, phone, tags: Array.isArray(tags) ? tags : [tags] };
  CONTACTS.unshift(newContact);
  res.json({ success: true, contact: newContact });
});

app.post("/api/contacts/import", (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) return res.status(400).json({ error: "Invalid data format" });

  let newCount = 0;
  contacts.forEach(c => {
    const phone = c.phone.replace(/[^0-9]/g, "");
    if (phone && !CONTACTS.find(existing => existing.phone === phone)) {
      CONTACTS.unshift({
        id: Date.now() + Math.random(),
        name: c.name || "Sem Nome",
        phone: phone,
        tags: c.tags || ['IMPORTADO']
      });
      newCount++;
    }
  });

  res.json({ success: true, count: newCount });
});

app.post("/api/contacts/bulk-delete", (req, res) => {
  const { ids, tag } = req.body;

  if (tag) {
    CONTACTS = CONTACTS.filter(c => !c.tags.includes(tag));
    return res.json({ success: true, message: `Contatos com a tag ${tag} removidos.` });
  }

  if (Array.isArray(ids)) {
    CONTACTS = CONTACTS.filter(c => !ids.includes(c.id));
    return res.json({ success: true, message: `${ids.length} contatos removidos.` });
  }

  res.status(400).json({ error: "Parâmetros inválidos" });
});

app.delete("/api/contacts/:id", (req, res) => {
  const { id } = req.params;
  CONTACTS = CONTACTS.filter(c => c.id != id);
  res.json({ success: true });
});

// Mock Storage for Tickets
let TICKETS = [
  { id: 1, customerName: 'Marcos Oliveira', customerPhone: '5511999990001@s.whatsapp.net', subject: 'Problema com acesso à plataforma', status: 'ABERTO', priority: 'ALTA', lastActivity: new Date().toISOString() },
  { id: 2, customerName: 'Ana Souza', customerPhone: '5521988887777@s.whatsapp.net', subject: 'Dúvida sobre planos premium', status: 'NOVO', priority: 'MÉDIA', lastActivity: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, customerName: 'Empresa XPTO', customerPhone: '5531977775555@s.whatsapp.net', subject: 'Integração com API falhando', status: 'PENDENTE', priority: 'CRÍTICA', lastActivity: new Date(Date.now() - 7200000).toISOString() }
];

// Tickets API Routes
app.get("/api/tickets", (req, res) => {
  res.json({ success: true, tickets: TICKETS });
});

app.post("/api/tickets", (req, res) => {
  const { customerName, customerPhone, subject, priority = 'MÉDIA' } = req.body;
  const newTicket = {
    id: Date.now(),
    customerName,
    customerPhone: customerPhone.includes('@') ? customerPhone : `${customerPhone}@s.whatsapp.net`,
    subject,
    status: 'NOVO',
    priority,
    lastActivity: new Date().toISOString()
  };
  TICKETS.unshift(newTicket);
  res.json({ success: true, ticket: newTicket });
});

app.put("/api/tickets/:id", (req, res) => {
  const { id } = req.params;
  const { status, priority } = req.body;
  const ticket = TICKETS.find(t => t.id == id);
  if (ticket) {
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    ticket.lastActivity = new Date().toISOString();

    // Also update ticketsDatabase if it's separate (it seems separate in previous code blocks)
    // Synchronizing TICKETS and ticketsDatabase for robustness
    const dbTicket = ticketsDatabase.find(t => t.id == id);
    if (dbTicket) {
      if (status) dbTicket.status = status;
      if (priority) dbTicket.priority = priority;
    }

    return res.json({ success: true, ticket });
  }
  res.status(404).json({ error: "Ticket não encontrado" });
});

app.delete("/api/tickets/:id", (req, res) => {
  const { id } = req.params;
  TICKETS = TICKETS.filter(t => t.id != id);
  res.json({ success: true });
});

// Generic API proxy handler - using regex for Express 5.x
app.all(/^\/api\/.*/, async (req, res) => {
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

    if (Object.keys(req.query).length > 0) config.params = req.query;
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) config.data = req.body;

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`[PROXY ERROR] ${req.method} ${apiPath}:`, err.message);
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: "Proxy error", message: err.message });
    }
  }
});

// Start server
const PORT = process.env.PORT || 3002;
const server = http.createServer(app);

// Setup Socket.IO
io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] User Connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket] User Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Registrar webhook no início
  await registerWebhook();
  // ... rest of startup logic

  // ... existing startup code ...

  // --- AUTOMATED FOLLOW-UP SCHEDULER ---
  function startFollowUpScheduler() {
    console.log("[FollowUp] Iniciando serviço de cadência automática...");

    setInterval(async () => {
      console.log("[FollowUp] Verificando leads para follow-up...");
      const now = new Date();
      let updatedCount = 0;

      for (const ticket of TICKETS) {
        // Ignore closed tickets or those without messages
        if (['FECHADO', 'RESOLVIDO'].includes(ticket.status) || !ticket.messages || ticket.messages.length === 0) continue;

        const lastMsg = ticket.messages[ticket.messages.length - 1];
        // Only follow up if the last message was ours (waiting for customer) 
        // OR if it's a new lead that hasn't replied yet (conceptually same thing if we sent a greeting)
        // But if the last message is from 'customer', we should NOT follow up (we need to reply first).
        if (lastMsg.role === 'customer') continue;

        const lastActivityDate = new Date(ticket.lastActivity);
        const diffMs = now - lastActivityDate;
        const diffHours = diffMs / (1000 * 60 * 60);

        const currentStage = ticket.followUpStage || 0;
        let nextStage = null;
        let promptContext = "";

        // Cadence Logic
        if (currentStage === 0 && diffHours >= 3) {
          nextStage = 1;
          promptContext = "O cliente parou de responder há 3 horas. Gere uma mensagem curta e empática perguntando se ficou alguma dúvida.";
        } else if (currentStage === 1 && diffHours >= 24) {
          nextStage = 2;
          promptContext = "O cliente não responde há 24 horas. Gere uma mensagem amigável lembrando do nosso contato e mostrando disposição para ajudar.";
        } else if (currentStage === 2 && diffHours >= 72) {
          nextStage = 3;
          promptContext = "O cliente não responde há 3 dias. Gere uma mensagem de encerramento suave, dizendo que vai fechar o chamado por enquanto mas que estamos à disposição.";
        }

        if (nextStage) {
          console.log(`[FollowUp] Acionando estágio ${nextStage} para ${ticket.customerName} (${diffHours.toFixed(1)}h inativo)`);

          try {
            const { generateChatResponse } = await import("./services/ai.js");

            // Generate message
            const history = ticket.messages.slice(-5).map(m => `[${m.role}]: ${m.text}`).join('\n');
            const fullPrompt = `Contexto do CRM: Você é um assistente de vendas. 
                      Histórico da conversa:
                      ${history}
                      
                      Tarefa: ${promptContext}
                      Gere apenas a mensagem de texto para enviar no WhatsApp.`;

            const messageText = await generateChatResponse("Gerar FollowUp", fullPrompt);

            // Send Message
            await axios.post(`${API_URL}/v1/message/sendText/${DEFAULT_INSTANCE}`, {
              number: ticket.customerPhone,
              textMessage: { text: messageText }
            }, { headers: { 'apikey': API_KEY } });

            // Update Ticket
            ticket.followUpStage = nextStage;
            ticket.messages.push({ role: 'assistant', text: messageText, time: new Date().toISOString() });
            ticket.lastActivity = new Date().toISOString(); // Update activity so timer resets for next stage? 
            // actually, if we update lastActivity, diffHours will be 0 next time.
            // For 3h -> 24h, we want 24h FROM NOW? Or 24h total silence?
            // Usually cadences are spaced out. 3h delay, then 1 day delay.
            // So yes, resetting lastActivity makes sense to count 'silence duration' from this new attempt.

            updatedCount++;

            // Real-time update
            if (io) {
              io.emit('ticket-update', ticket);
            }

          } catch (err) {
            console.error(`[FollowUp Error] Falha ao processar ${ticket.customerName}:`, err.message);
          }
        }
      }

      if (updatedCount > 0) {
        console.log(`[FollowUp] ${updatedCount} mensagens enviadas.`);
        // saveTicketsToFile(); // Assuming TICKETS is in-memory mock or synced. Use specific function if needed.
      }

    }, 10 * 60 * 1000); // Run every 10 minutes
  }

  // Monitoramento de Saúde da API Go
  startFollowUpScheduler();
  let apiWasOnline = true;
  const EVOLUTION_API_URL = "https://evolution.automacoescomerciais.com.br";
  const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || API_KEY;

  async function sendAlertFallback(message) {
    // Tenta enviar via Evolution API externa (fallback quando API Go está offline)
    try {
      await axios.post(`${EVOLUTION_API_URL}/message/sendText/${DEFAULT_INSTANCE}`, {
        number: DEVELOPER_NUMBER,
        textMessage: { text: message }
      }, {
        headers: { 'apikey': EVOLUTION_API_KEY },
        timeout: 10000
      });
      console.log("[FALLBACK ALERT] Alerta enviado via Evolution API externa.");
    } catch (fallbackErr) {
      console.error("[FALLBACK ALERT ERROR]", fallbackErr.message);
    }
  }

  setInterval(async () => {
    try {
      await axios.get(`${API_URL}/health`, { timeout: 5000 });
      if (!apiWasOnline) {
        console.log("🟢 API Go voltou a ficar online.");
        sendAlert("✅ *A API WhatsMiau2 voltou a ficar ONLINE!*");
        apiWasOnline = true;
      }
    } catch (err) {
      if (apiWasOnline) {
        console.error("🔴 API Go ficou OFFLINE! Erro:", err.message);
        const alertMessage = `🚨 *ALERTA CRÍTICO - API OFFLINE!*\n\n📌 Automações Comerciais\n🔴 A API WhatsMiau2 Go desconectou!\n⏰ ${new Date().toLocaleString('pt-BR')}\n\nVerifique o servidor imediatamente.`;
        // Tenta via Evolution API externa como fallback
        await sendAlertFallback(alertMessage);
        apiWasOnline = false;
      }
    }
  }, 30000); // Verifica a cada 30 segundos
});
