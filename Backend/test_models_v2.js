
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model2.generateContent("Test");
        console.log("gemini-1.5-flash WORKED");
    } catch (e) {
        console.log("gemini-1.5-flash FAILED: " + e.message);
    }

    try {
        const model3 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model3.generateContent("Test");
        console.log("gemini-1.0-pro WORKED");
    } catch (e) {
        console.log("gemini-1.0-pro FAILED: " + e.message);
    }
}

run();
