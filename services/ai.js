import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as googleTTS from "google-tts-api";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_DIR = path.join(__dirname, "../public/audio_temp");

if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// CONFIGURAÇÃO DE VOZ E VELOCIDADE
const VOICE_SPEED = 1.25;

const VOICE_MAP = {
    'female': { kokoro: 'bf_isabella', openai: 'alloy', google: 'pt-BR-Neural2-A' },
    'male': { kokoro: 'bm_george', openai: 'onyx', google: 'pt-BR-Neural2-B' },
    'female_alt': { kokoro: 'af_nicole', openai: 'shimmer', google: 'pt-BR-Neural2-C' } // 'af_nicole' or 'af_bella'
};

function cleanTextForAudio(text) {
    return text
        .replace(/---/g, '')
        .replace(/[*_]/g, '')
        .replace(/\[(.*?)\]/g, '$1')
        .replace(/\n\s*\n/g, '\n')
        .trim();
}

// ... existing imports ...
// ... existing code ...

export async function generateChatResponse(userMessage, systemPrompt) {
    // ... existing implementation ...
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY não configurada no .env");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const fullPrompt = `${systemPrompt}\n\nMensagem do Usuário: ${userMessage}\nResposta:`;

    try {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (err) {
        console.error("Erro na IA:", err);
        return "Desculpe, não consegui processar sua mensagem no momento.";
    }
}

export async function analyzeLeadMessage(userMessage, history = "") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null; // Fail silently if no key

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
    Analise a mensagem do cliente abaixo no contexto de um CRM de vendas.
    Histórico recente: ${history}
    Mensagem Atual: "${userMessage}"

    Extraia as seguintes informações em formato JSON estrito (sem markdown):
    {
        "sentiment": "positive" | "neutral" | "negative",
        "intention": "buy" | "support" | "info" | "complaint" | "other",
        "urgency": "low" | "medium" | "high",
        "suggestedStatus": "NOVO" | "ABERTO" | "PENDENTE" | "FECHADO" | null,
        "suggestedPriority": "BAIXA" | "MÉDIA" | "ALTA" | null,
        "extractedName": "Nome se encontrado ou null",
        "summary": "Resumo de 1 frase"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Clean markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (err) {
        console.error("Erro na análise de lead:", err.message);
        return null; // Return null on failure
    }
}

export async function generateSummaryWithGemini(context) {
    // ... existing code ...
    // ... existing code ...
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY não configurada no .env");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
    Atue como um narrador de resumo de grupo.
    Analise o texto abaixo. Ele pode conter cabeçalhos de template (ex: "Data", "Nome do Grupo", "Destaques") e placeholders. IGNORE esses cabeçalhos.
    
    Seu objetivo: Identificar e narrar APENAS as interações reais descritas no texto (quem falou o quê, quem mandou mídia).
    Se o texto estiver vazio ou só tiver cabeçalhos, diga: "Não há interações registradas no momento."
    
    Estilo: Curto, direto e conversacional.
    Exemplo de saída desejada: "O João comentou sobre o projeto. A Maria enviou uma foto da reunião."
    
    Contexto para análise:
    ${context}
    
    Gere APENAS o texto do roteiro para o áudio.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// === KOKORO (LOCAL) INTEGRATION ===
async function generateAudioWithKokoro(text, speed, voice) {
    return new Promise((resolve, reject) => {
        const filename = `resumo_kokoro_${Date.now()}.wav`;
        const filepath = path.join(AUDIO_DIR, filename);
        const scriptPath = path.join(__dirname, "kokoro_wrapper.py");

        console.log(`[Kokoro] Gerando: ${text.substring(0, 30)}... (Voz: ${voice}, Speed: ${speed})`);

        // Arguments: text, output_file, speed, voice
        const process = spawn("python", [scriptPath, text, filepath, speed.toString(), voice]);

        let stdoutData = "";
        let stderrData = "";

        process.stdout.on("data", (data) => { stdoutData += data.toString(); });
        process.stderr.on("data", (data) => { stderrData += data.toString(); });

        process.on("close", (code) => {
            if (code === 0 && fs.existsSync(filepath)) {
                console.log("[Kokoro] Sucesso!");
                resolve(`/audio_temp/${filename}`);
            } else {
                console.error(`[Kokoro] Erro (Código ${code}). Log: ${stderrData}`);
                reject(new Error(`Kokoro TTS falhou: ${stderrData}`));
            }
        });
    });
}

// === DISPATCHER ===
// Accepts 'voiceChoice' which maps to 'female', 'male', 'female_alt' in FE
export async function generateAudioWithOpenAI(text, voiceChoice = 'female') {
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GEMINI_API_KEY;
    const cleanText = cleanTextForAudio(text);

    // Resolve voice based on map, default to female if invalid
    const voices = VOICE_MAP[voiceChoice] || VOICE_MAP['female'];

    // 1. Try Kokoro
    try {
        return await generateAudioWithKokoro(cleanText, VOICE_SPEED, voices.kokoro);
    } catch (error) {
        console.warn("Fallback de Kokoro iniciado...", error.message);
    }

    // 2. Try OpenAI
    if (openaiKey && openaiKey.trim().length > 20) {
        try {
            console.log(`Tentando OpenAI (${voices.openai})...`);
            const openai = new OpenAI({ apiKey: openaiKey });
            const safeText = cleanText.length > 4000 ? cleanText.substring(0, 4000) + "..." : cleanText;
            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: voices.openai,
                input: safeText,
                speed: VOICE_SPEED
            });
            const buffer = Buffer.from(await mp3.arrayBuffer());
            return saveAudioFile(buffer, "openai");
        } catch (error) {
            console.error("OpenAI falhou:", error.message);
        }
    }

    // 3. Try Google Cloud TTS
    if (googleKey && googleKey.trim().length > 20) {
        try {
            console.log(`Tentando Google TTS (${voices.google})...`);
            const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`;
            const safeText = cleanText.length > 4800 ? cleanText.substring(0, 4800) + "..." : cleanText;
            const body = {
                input: { text: safeText },
                voice: { languageCode: 'pt-BR', name: voices.google },
                audioConfig: { audioEncoding: 'MP3', speakingRate: VOICE_SPEED }
            };
            const response = await axios.post(url, body);
            if (response.data && response.data.audioContent) {
                const buffer = Buffer.from(response.data.audioContent, 'base64');
                return saveAudioFile(buffer, "google");
            }
        } catch (error) {
            console.error("Google Cloud TTS falhou:", error.message);
        }
    }

    // 4. Fallback Free
    try {
        console.log("Tentando Fallback Gratuito...");
        const safeText = cleanText.length > 2500 ? cleanText.substring(0, 2500) + "..." : cleanText;
        const results = await googleTTS.getAllAudioBase64(safeText, {
            lang: 'pt',
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
            splitPunctuation: true,
        });
        const buffers = results.map(r => Buffer.from(r.base64, 'base64'));
        const finalBuffer = Buffer.concat(buffers);
        return saveAudioFile(finalBuffer, "free");
    } catch (error) {
        throw new Error("Falha total na geração de áudio.");
    }
}

function saveAudioFile(buffer, prefix) {
    const filename = `resumo_${prefix}_${Date.now()}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    return `/audio_temp/${filename}`;
}
