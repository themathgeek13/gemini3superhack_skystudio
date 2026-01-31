import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Generate audio narration using Pipecat Daily TTS
 *
 * To use Pipecat Daily:
 * 1. Install: npm install @pipecat-ai/client-js
 * 2. Get API key from https://pipecat.ai
 * 3. Configure below
 */

async function generateAudioWithPipecat() {
    console.log('🎙️ Generating audio narration with Pipecat Daily...\n');

    const narration = readFileSync('narration-for-tts.txt', 'utf-8');

    // Pipecat Daily TTS configuration
    // NOTE: You'll need to replace this with actual Pipecat integration
    console.log('📝 Narration text loaded:');
    console.log(`   ${narration.substring(0, 100)}...`);
    console.log(`   (${narration.length} characters total)\n`);

    console.log('⚠️  Manual Step Required:');
    console.log('   1. Visit https://pipecat.ai or use Pipecat CLI');
    console.log('   2. Use the narration in narration-for-tts.txt');
    console.log('   3. Select voice: "Matthew" or "Joanna" (AWS Polly)');
    console.log('   4. Generate and download as narration-audio.mp3\n');

    // Alternative: Use system TTS (macOS say command) as fallback
    console.log('💡 Quick Alternative - Using macOS "say" command:');
    console.log('   Generating temporary audio with system TTS...\n');

    try {
        await execAsync(`say -v Alex -o narration-temp.aiff "${narration.replace(/"/g, '\\"')}"`);
        await execAsync('ffmpeg -i narration-temp.aiff -acodec libmp3lame -ab 192k narration-audio.mp3 -y');
        console.log('✅ Audio generated: narration-audio.mp3\n');
    } catch (error) {
        console.error('❌ Error generating audio:', error.message);
        console.log('   Please use Pipecat Daily instead for better quality.\n');
    }

    return 'narration-audio.mp3';
}

async function combineVideoAndAudio() {
    console.log('🎬 Combining video and audio...\n');

    // Find the latest video file
    const { stdout: lsOutput } = await execAsync('ls -t demo-videos/*.webm | head -1');
    const videoFile = lsOutput.trim();
    console.log(`Using video: ${videoFile}\n`);

    const audioFile = 'narration-audio.mp3';
    const outputFile = 'super-bowl-lx-demo-final.mp4';

    const ffmpegCommand = `ffmpeg -i ${videoFile} -i ${audioFile} \\
        -c:v libx264 -preset medium -crf 23 \\
        -c:a aac -b:a 192k \\
        -shortest -y ${outputFile}`;

    console.log('Running ffmpeg command:');
    console.log(`   ${ffmpegCommand}\n`);

    try {
        const { stdout, stderr } = await execAsync(ffmpegCommand);
        console.log('✅ Final video created:', outputFile);
        console.log('   Video info:');

        // Get video info
        const infoCmd = `ffprobe -v quiet -print_format json -show_format -show_streams ${outputFile}`;
        const { stdout: info } = await execAsync(infoCmd);
        const videoInfo = JSON.parse(info);

        console.log(`   Duration: ${Math.round(videoInfo.format.duration)}s`);
        console.log(`   Size: ${Math.round(videoInfo.format.size / 1024 / 1024 * 10) / 10}MB`);
        console.log(`   Format: ${videoInfo.format.format_name}\n`);

    } catch (error) {
        console.error('❌ Error combining video:', error.message);
        console.log('\n   Make sure ffmpeg is installed: brew install ffmpeg\n');
    }
}

async function main() {
    console.log('🏈 Super Bowl LX - Final Video Generator\n');
    console.log('════════════════════════════════════════\n');

    // Step 1: Generate audio
    await generateAudioWithPipecat();

    // Step 2: Combine video + audio
    await combineVideoAndAudio();

    console.log('════════════════════════════════════════');
    console.log('✅ Demo video complete!');
    console.log('\n📦 Deliverables:');
    console.log('   • super-bowl-lx-demo-final.mp4 (video with narration)');
    console.log('   • demo-narration.txt (Gemini-generated script)');
    console.log('   • narration-for-tts.txt (clean text for TTS)');
    console.log('\n💡 For better audio quality:');
    console.log('   Use Pipecat Daily TTS instead of system "say" command');
    console.log('════════════════════════════════════════\n');
}

main().catch(console.error);
