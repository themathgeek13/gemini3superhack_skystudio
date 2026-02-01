import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY environment variable not set. Please set it before running.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + (process.env.GOOGLE_API_KEY) + '');
        const data = await response.json();

        console.log('\n📋 Available Gemini Models:\n');
        data.models.forEach(model => {
            if (model.name.includes('gemini')) {
                console.log(`✓ ${model.name.replace('models/', '')}`);
                console.log(`  Supported: ${model.supportedGenerationMethods.join(', ')}\n`);
            }
        });
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
