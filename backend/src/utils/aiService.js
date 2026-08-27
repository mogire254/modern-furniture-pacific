// backend/src/utils/aiService.js
const axios = require('axios');

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

if (!STABILITY_API_KEY) {
    console.warn('⚠️ STABILITY_API_KEY not set. AI features will use mock data.');
}

// ===== GENERATE IMAGE =====
async function generateImage(prompt, style = 'modern', imageBase64 = null) {
    try {
        if (!STABILITY_API_KEY) {
            throw new Error('STABILITY_API_KEY not configured');
        }

        // Determine style based on selection
        const styleMap = {
            'modern': 'modern, clean, minimalist, furniture showcase, professional photography',
            'luxury': 'luxury, premium, elegant, gold accents, furniture showcase, high-end photography',
            'festive': 'festive, colorful, celebration, bright, furniture showcase, joyful atmosphere',
            'minimal': 'minimal, simple, clean, white space, furniture showcase, zen aesthetic',
            'bold': 'bold, vibrant, eye-catching, dramatic, furniture showcase, striking composition'
        };
        
        const stylePrompt = styleMap[style] || styleMap['modern'];
        const fullPrompt = `${prompt}, ${stylePrompt}, high quality, professional photography style, 4k, detailed, sharp focus`;

        // Text-to-image generation
        const response = await axios.post(
            'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            {
                text_prompts: [{ text: fullPrompt }],
                cfg_scale: 7,
                height: 1024,
                width: 1024,
                steps: 30,
                samples: 1
            },
            {
                headers: {
                    'Authorization': `Bearer ${STABILITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );
        
        return response.data.artifacts[0].base64;
    } catch (error) {
        console.error('❌ AI Image Generation error:', error.response?.data || error.message);
        throw new Error(`AI generation failed: ${error.response?.data?.message || error.message}`);
    }
}

// ===== GENERATE VIDEO AD =====
async function generateVideoAd(prompt, style, imageBase64 = null) {
    try {
        // For video generation, we simulate with enhanced images
        // In production, you'd use a video generation API
        
        const options = [];
        const cartoonStyles = ['cartoon', 'animated', 'character-driven', 'storytelling', 'funny'];
        
        for (let i = 1; i <= 3; i++) {
            const cartoonStyle = cartoonStyles[(i - 1) % cartoonStyles.length];
            const videoPrompt = `${prompt} - Create a ${cartoonStyle} video ad with a friendly character presenting the furniture. The character should be animated, talking, and engaging. The ad should be fun, informative, and include a call to action.`;
            
            // Generate a series of frames (simulated)
            let imageData = await generateImage(videoPrompt, style, imageBase64);
            
            options.push({
                id: `video_${i}_${Date.now()}`,
                title: `Video Ad Option ${i} - ${cartoonStyle} character`,
                imageData: imageData,
                prompt: videoPrompt,
                style: style,
                type: 'video',
                isVideo: true,
                duration: '15-30 seconds',
                cartoonStyle: cartoonStyle,
                description: `🎬 ${cartoonStyle.charAt(0).toUpperCase() + cartoonStyle.slice(1)} animated character presenting the offer`
            });
        }
        
        return options;
    } catch (error) {
        console.error('❌ Generate Video Ad error:', error);
        throw error;
    }
}

// ===== GENERATE AD OPTIONS =====
async function generateAdOptions(prompt, style, type, imageBase64 = null) {
    try {
        const options = [];
        
        // Generate 3 different variations
        for (let i = 1; i <= 3; i++) {
            const variationTypes = [
                'Focus on the product features',
                'Focus on the lifestyle benefits', 
                'Focus on the promotion and value'
            ];
            const variationPrompt = `${prompt} - Variation ${i}: ${variationTypes[i-1]}`;
            
            // Generate the image
            let imageData = await generateImage(variationPrompt, style, imageBase64);
            
            options.push({
                id: `ad_${i}_${Date.now()}`,
                title: `Ad Option ${i}`,
                imageData: imageData,
                prompt: variationPrompt,
                style: style,
                type: type || 'image',
                isVideo: false
            });
        }
        
        return options;
    } catch (error) {
        console.error('❌ Generate Ad Options error:', error);
        throw error;
    }
}

// ===== DOWNLOAD AD =====
function downloadAd(imageData, filename = 'ad.png') {
    const binaryString = atob(imageData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

module.exports = {
    generateImage,
    generateAdOptions,
    generateVideoAd,
    downloadAd
};