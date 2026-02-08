
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Test");
        console.log("gemini-flash-latest WORKED: " + result.response.text());
    } catch (e) {
        console.log("gemini-flash-latest FAILED: " + e.message);
    }
}

run();
