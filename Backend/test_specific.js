
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    const models = ["gemini-1.5-flash-001", "gemini-1.5-flash-002", "gemini-1.5-flash-8b", "gemini-2.0-flash-exp"];

    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello");
            console.log(`SUCCESS: ${m}`);
        } catch (e) {
            console.log(`FAILED: ${m} - ${e.message}`);
        }
    }
}

run();
