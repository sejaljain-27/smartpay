import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.0-pro",
    "gemini-pro",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite-preview-02-05" // sometimes these exist
];

async function testAll() {
    console.log("Starting Model Hunt...");
    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ SUCCESS!`);
            return; // Stop at first success
        } catch (error) {
            if (error.message.includes("404")) console.log("❌ 404 (Not Found)");
            else if (error.message.includes("429")) console.log("❌ 429 (Rate Limit)");
            else console.log(`❌ Error: ${error.message.split('\n')[0]}`);
        }
    }
    console.log("All candidates failed.");
}

testAll();
