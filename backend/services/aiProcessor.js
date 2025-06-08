// backend/services/aiProcessor.js
const axios = require('axios');

class AIProcessor {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    async extractEntities(text) {
        try {
            if (!this.openaiApiKey) {
                return this.mockEntityExtraction(text);
            }

            const prompt = `Extract structured information from this personal recording:
"${text}"

Return a JSON object with these categories (only include if present):
- people: names mentioned
- tasks: action items or things to do
- events: meetings, appointments, social events
- dates: specific dates or time references
- times: specific times
- locations: addresses or place names
- items: shopping lists, objects mentioned
- topics: main subjects discussed

Example: {"people": ["John"], "tasks": ["call dentist"], "dates": ["tomorrow"]}`;

            const response = await axios.post(this.apiUrl, {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that extracts structured information from text. Always return valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 300,
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = response.data.choices[0].message.content.trim();
            return JSON.parse(result);
        } catch (error) {
            console.error('Entity extraction error:', error.message);
            return this.mockEntityExtraction(text);
        }
    }

    async generateResponse(question, recordings) {
        try {
            if (!this.openaiApiKey) {
                return this.mockResponse(question, recordings);
            }

            const context = recordings.map(r => 
                `[${r.timestamp.toLocaleDateString()}] ${r.text}`
            ).join('\n');

            const prompt = `You are a personal AI assistant. Answer the user's question based on their recorded information.

Personal recordings:
${context}

User question: ${question}

Provide a helpful, specific answer based on the recordings. If no relevant information is found, say so politely and suggest what type of information would be helpful to record.`;

            const response = await axios.post(this.apiUrl, {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful personal assistant that answers questions based on the user\'s recorded information.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 300,
                temperature: 0.3
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Response generation error:', error.message);
            return this.mockResponse(question, recordings);
        }
    }

    mockEntityExtraction(text) {
        const entities = {};
        const words = text.toLowerCase().split(' ');
        
        // Simple keyword matching for demo
        const peopleKeywords = ['sarah', 'bob', 'mike', 'mom', 'dad', 'john', 'mary'];
        const taskKeywords = ['need', 'remember', 'call', 'buy', 'pick up', 'schedule'];
        const timeKeywords = ['tomorrow', 'today', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        entities.people = peopleKeywords.filter(person => text.toLowerCase().includes(person));
        
        if (taskKeywords.some(task => words.includes(task))) {
            entities.tasks = ['extracted task from recording'];
        }
        
        entities.dates = timeKeywords.filter(time => words.includes(time));
        
        return entities;
    }

    mockResponse(question, recordings) {
        const lowerQuestion = question.toLowerCase();
        
        // Simple keyword matching for demo
        if (lowerQuestion.includes('bob') || lowerQuestion.includes('party')) {
            return "Based on your recordings, Bob's birthday party is this Saturday at 7 PM at 123 Oak Street. You mentioned you need to bring a bottle of wine.";
        } else if (lowerQuestion.includes('sarah') || lowerQuestion.includes('job')) {
            return "You had lunch with Sarah recently. She's looking for a new job in marketing and asked if you know anyone at tech companies.";
        } else if (lowerQuestion.includes('dentist') || lowerQuestion.includes('appointment')) {
            return "You recorded a reminder to call the dentist tomorrow to schedule a cleaning appointment.";
        } else if (lowerQuestion.includes('groceries') || lowerQuestion.includes('shopping')) {
            return "You need to pick up groceries: milk, eggs, and bread.";
        } else if (lowerQuestion.includes('tasks') || lowerQuestion.includes('todo')) {
            const tasks = [];
            recordings.forEach(r => {
                if (r.entities && r.entities.tasks) {
                    tasks.push(...r.entities.tasks);
                }
            });
            return tasks.length > 0 ? `Here are your tasks: ${tasks.join(', ')}` : "I don't see any specific tasks in your recordings yet.";
        } else {
            return `I searched through your ${recordings.length} recordings but couldn't find specific information about "${question}". Try asking about Bob's party, Sarah's job search, your dentist appointment, or general tasks.`;
        }
    }
}

module.exports = new AIProcessor();