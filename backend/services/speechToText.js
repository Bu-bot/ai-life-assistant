// backend/services/speechToText.js
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

class SpeechToTextService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
    }

    async transcribeAudio(audioFilePath) {
        try {
            if (!this.openaiApiKey) {
                console.warn('OpenAI API key not found, using mock transcription');
                return this.mockTranscription();
            }

            const formData = new FormData();
            formData.append('file', fs.createReadStream(audioFilePath));
            formData.append('model', 'whisper-1');
            formData.append('language', 'en');

            const response = await axios.post(
                'https://api.openai.com/v1/audio/transcriptions',
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                    },
                }
            );

            return response.data.text.trim();
        } catch (error) {
            console.error('Transcription error:', error.message);
            return this.mockTranscription();
        }
    }

    mockTranscription() {
        const mockTexts = [
            "Just remembered I need to water the plants tomorrow morning.",
            "Meeting with the team about the project proposal next Tuesday at 2 PM.",
            "Mom called - family dinner this Sunday at 6. Need to bring dessert.",
            "Car needs an oil change soon. Mechanic shop closes at 5 PM on weekdays.",
            "Grocery list: apples, chicken breast, yogurt, and pasta sauce.",
            "Doctor appointment scheduled for Friday at 10 AM. Don't forget insurance card.",
            "Called Mike about the weekend camping trip. He's bringing the tent and sleeping bags.",
            "Need to finish quarterly report by end of week. Schedule meeting with accounting team."
        ];
        
        return mockTexts[Math.floor(Math.random() * mockTexts.length)];
    }
}

module.exports = new SpeechToTextService();