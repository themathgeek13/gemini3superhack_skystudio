import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyA6ku2x9helAoJyRJvXkIBvDhHjiaFGLC0');

async function checkModels() {
    try {
        const result = await genAI.listModels();
        
        console.log('Available models:');
        let count = 0;
        for await (const model of result.models) {
            count++;
            if (count <= 30) {
                console.log(`  - ${model.name}`);
            }
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

checkModels();
