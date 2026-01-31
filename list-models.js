import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyA6ku2x9helAoJyRJvXkIBvDhHjiaFGLC0');

async function listModels() {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyA6ku2x9helAoJyRJvXkIBvDhHjiaFGLC0');
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
