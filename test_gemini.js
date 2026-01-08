import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    try {
        // There isn't a direct 'listModels' in the high-level genAI object usually, 
        // it's in the underlying clients. But let's check a simple generation with a very basic model.
        console.log("Testing with gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success gemini-1.5-flash:", result.response.text());
    } catch (e) {
        console.error("Fail gemini-1.5-flash:", e.message);

        try {
            console.log("Testing with gemini-pro...");
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hello");
            console.log("Success gemini-pro:", result.response.text());
        } catch (e2) {
            console.error("Fail gemini-pro:", e2.message);
        }
    }
}
run();
