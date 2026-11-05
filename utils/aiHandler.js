const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class AIHandler {
    constructor() {
        this.keys = (process.env.OPENROUTER_KEYS || '').split(',').map(k => k.trim()).filter(k => k);
        this.currentKeyIndex = 0;
        this.model = process.env.DEFAULT_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    }

    getKey() {
        if (this.keys.length === 0) return null;
        const key = this.keys[this.currentKeyIndex];
        return key;
    }

    rotateKey() {
        if (this.keys.length > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
            console.log(`[AI] Rotated to key index ${this.currentKeyIndex}`);
        }
    }

    async askOpenRouter(prompt, systemContext = null) {
        if (!this.keys.length) return "Error: No API keys configured.";

        let attempts = 0;
        const maxAttempts = this.keys.length;

        const defaultSystem = "You are a helpful AI assistant. You must provide short, concise, and high-quality answers. Avoid unnecessary verbosity.";
        const finalSystem = systemContext || defaultSystem;

        while (attempts < maxAttempts) {
            const apiKey = this.getKey();
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": this.model,
                        "messages": [
                            { "role": "system", "content": finalSystem },
                            { "role": "user", "content": prompt }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[AI] Error with key index ${this.currentKeyIndex}: ${response.status} - ${errorText}`);

                    if (response.status === 401 || response.status === 402 || response.status === 429) {
                        this.rotateKey();
                        attempts++;
                        continue;
                    }
                    return `Error: OpenRouter API returned ${response.status}`;
                }

                const data = await response.json();
                if (data.choices && data.choices.length > 0) {
                    return data.choices[0].message.content;
                } else {
                    return "Error: No response content from AI.";
                }

            } catch (error) {
                console.error(`[AI] Request failed`, error);
                this.rotateKey();
                attempts++;
            }
        }

        return "Error: All API keys failed or quota exceeded.";
    }
}

module.exports = new AIHandler();
