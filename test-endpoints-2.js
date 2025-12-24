import axios from 'axios';

const PROXY_URL = "http://localhost:3002/api";
const INSTANCE = "minha-instancia";
const DESTINATION = "5511999999999"; // Fake number for testing

async function testSendMessage() {
    console.log(`--> Testing Message Sending on ${INSTANCE} to ${DESTINATION}`);

    try {
        const payload = {
            number: DESTINATION, // Evolution API format might use 'number' or 'remoteJid'
            textMessage: { text: "Hello from WhatsMiau2 Test Script!" }
        };

        // Note: The correct endpoint in server.go is /message/sendText/:instance OR /send/:instance/text
        // Let's try the Evolution API compatible one
        console.log("Sending Text Message...");
        const res = await axios.post(`${PROXY_URL}/message/sendText/${INSTANCE}`, payload);
        console.log("   ✅ Success:", res.status, res.data);
    } catch (err) {
        console.error("   ❌ Failed:", err.response ? err.response.data : err.message);
    }
}

testSendMessage();
