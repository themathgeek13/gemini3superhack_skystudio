import { readFileSync } from 'fs';

// Read the narration script
const narrationText = readFileSync('demo-narration.txt', 'utf-8');

// Extract just the spoken text (remove formatting)
const scenes = [
    {
        time: "0-12s",
        text: "Super Bowl Sixty is here, but the way we watch it is stuck in the past. Traditional broadcasts rely on static angles that miss over sixty percent of the action. On the world's biggest stage, those 'game-winning inches' are often hidden in the shadows. Until now."
    },
    {
        time: "12-25s",
        text: "Introducing a revolution in the sky. Twelve autonomous, AI-coordinated drones, working in perfect sync to provide eighty percent field coverage. They don't just follow the ball—they anticipate the play, ensuring no blind spots, no limits, and total immersion."
    },
    {
        time: "25-42s",
        text: "This is real-time volumetric capture. Powered by collision-free flight and Gemini-enhanced bullet-time replays, we're freezing time in three dimensions. Every jersey tug, every toe-tap, rendered instantly from every conceivable perspective."
    },
    {
        time: "42-52s",
        text: "The data speaks for itself. Our coverage heatmap shows twice the visibility of a standard broadcast at just one-third of the operational cost. Higher production value, lower footprint, zero compromise."
    },
    {
        time: "52-60s",
        text: "From immersive VR broadcasts to AI-driven highlight reels, the choice is yours. Any angle, on demand, in the palm of your hand. Welcome to Super Bowl LX. Welcome to the future of the game."
    }
];

// Combine all narration into one script
const fullNarration = scenes.map(s => s.text).join(' ');

console.log('🎙️ Narration Script for Pipecat Daily TTS:\n');
console.log('════════════════════════════════════════\n');
console.log(fullNarration);
console.log('\n════════════════════════════════════════\n');

console.log('📝 Scene-by-scene breakdown:\n');
scenes.forEach(scene => {
    console.log(`[${scene.time}]`);
    console.log(`${scene.text}\n`);
});

console.log('════════════════════════════════════════');
console.log('\n💡 Next Steps:');
console.log('1. Use Pipecat Daily TTS to generate audio from narration above');
console.log('2. Use ffmpeg to combine video + audio:');
console.log('   ffmpeg -i demo-videos/<video-file>.webm -i narration-audio.mp3 \\');
console.log('          -c:v libx264 -c:a aac -shortest super-bowl-lx-demo.mp4');
console.log('\n════════════════════════════════════════\n');

// Save clean narration for TTS
import { writeFileSync } from 'fs';
writeFileSync('narration-for-tts.txt', fullNarration);
console.log('✅ Clean narration saved to: narration-for-tts.txt\n');
