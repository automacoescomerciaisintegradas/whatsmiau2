import axios from 'axios';

const PROXY_URL = "http://localhost:3002/api";

async function testBackend() {
    console.log("--> Testing Backend Connectivity...");
    try {
        // Attempt to access a simple endpoint
        const res = await axios.get(`${PROXY_URL}/instance/fetchInstances`);
        console.log("✅ Backend is reachable! Status:", res.status);
        console.log("Instances found:", res.data.length);
    } catch (err) {
        if (err.response) {
            // A response (even error) means backend is reachable
            console.log("✅ Backend is reachable but returned:", err.response.status);
        } else {
            console.error("❌ Backend unreachable:", err.message);
        }
    }
}

testBackend();
