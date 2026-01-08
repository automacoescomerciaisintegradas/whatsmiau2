import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key");
        return;
    }
    try {
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        console.log("Groups Available Models:");
        res.data.models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error("Fail to list models:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}
run();
