import axios from 'axios';

const PROXY_URL = "http://localhost:3002/api";
const INSTANCE = "minha-instancia";
const CHANNEL_JID = "1234567890@newsletter"; // Fake JID

async function testFollowChannel() {
    console.log(`--> Testing Follow Channel on ${INSTANCE}`);

    try {
        console.log(`Following ${CHANNEL_JID}...`);
        const res = await axios.post(`${PROXY_URL}/newsletter/follow/${INSTANCE}`, {
            jid: CHANNEL_JID
        });
        console.log("   ✅ Success:", res.status, res.data);
    } catch (err) {
        console.error("   ❌ Failed:", err.response ? err.response.data : err.message);
    }
}

testFollowChannel();
