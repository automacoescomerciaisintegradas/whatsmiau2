import axios from 'axios';

const PROXY_URL = "http://localhost:3002/api";
const INSTANCE = "minha-instancia";
const JID = "5511999999999@s.whatsapp.net";

async function testUserProfile() {
    console.log(`--> Testing User Profile/Status on ${INSTANCE}`);

    try {
        console.log(`Fetching Status for ${JID}...`);
        const res = await axios.post(`${PROXY_URL}/chat/fetchStatus/${INSTANCE}`, {
            number: JID
        });
        console.log("   ✅ Success:", res.status, res.data);
    } catch (err) {
        console.error("   ❌ Failed:", err.response ? err.response.data : err.message);
    }
}

testUserProfile();
