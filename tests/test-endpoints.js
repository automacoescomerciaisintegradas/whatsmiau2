import axios from 'axios';

const PROXY_URL = "http://localhost:3002/api";
const INSTANCE = "minha-instancia";

async function testEndpoints() {
    console.log(`--> Testing Endpoints for instance: ${INSTANCE}`);

    // 1. Fetch Instances
    try {
        console.log("1. Fetching Instances...");
        const res = await axios.get(`${PROXY_URL}/instance/fetchInstances`);
        console.log("   Status:", res.status, "| Data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("   Failed:", err.message);
    }

    // 2. Get Connection State
    try {
        console.log(`2. Getting Connection State for ${INSTANCE}...`);
        const res = await axios.get(`${PROXY_URL}/instance/connectionState/${INSTANCE}`);
        console.log("   Status:", res.status, "| State:", res.data);
    } catch (err) {
        console.error("   Failed:", err.message);
    }
}

testEndpoints();
