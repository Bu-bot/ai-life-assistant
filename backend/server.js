const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const speechToText = require('./services/speechToText');
const aiProcessor = require('./services/aiProcessor');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `recording-${Date.now()}.wav`);
    }
});

const upload = multer({ storage });

// In-memory storage for demo (use database in production)
let recordings = [
    {
        id: 1,
        timestamp: new Date(Date.now() - 3600000),
        text: "Reminder: Call the dentist tomorrow to schedule a cleaning appointment. Also need to pick up groceries - milk, eggs, and bread.",
        entities: {
            tasks: ["call dentist", "pick up groceries"],
            items: ["milk", "eggs", "bread"],
            people: ["dentist"],
            dates: ["tomorrow"]
        }
    },
    {
        id: 2,
        timestamp: new Date(Date.now() - 7200000),
        text: "Had lunch with Sarah today. She mentioned she's looking for a new job in marketing and asked if I know anyone at tech companies.",
        entities: {
            people: ["Sarah"],
            topics: ["job search", "marketing", "tech companies"],
            events: ["lunch"]
        }
    },
    {
        id: 3,
        timestamp: new Date(Date.now() - 10800000),
        text: "Bob's birthday party is this Saturday at 7 PM. Need to bring a bottle of wine. His address is 123 Oak Street.",
        entities: {
            people: ["Bob"],
            events: ["birthday party"],
            dates: ["Saturday"],
            times: ["7 PM"],
            locations: ["123 Oak Street"],
            tasks: ["bring wine"]
        }
    }
];

// Routes
app.get('/api/recordings', (req, res) => {
    res.json(recordings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

app.post('/api/recordings', upload.single('audio'), async (req, res) => {
    try {
        let transcription;
        
        if (req.file) {
            // Process actual audio file
            transcription = await speechToText.transcribeAudio(req.file.path);
            
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
        } else if (req.body.text) {
            // Handle direct text input (for testing)
            transcription = req.body.text;
        } else {
            return res.status(400).json({ error: 'No audio file or text provided' });
        }

        // Extract entities and context
        const entities = await aiProcessor.extractEntities(transcription);
        
        const newRecording = {
            id: recordings.length + 1,
            timestamp: new Date(),
            text: transcription,
            entities: entities
        };

        recordings.push(newRecording);
        
        res.json(newRecording);
    } catch (error) {
        console.error('Error processing recording:', error);
        res.status(500).json({ error: 'Failed to process recording' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // Generate response based on recordings
        const response = await aiProcessor.generateResponse(question, recordings);
        
        res.json({ response });
    } catch (error) {
        console.error('Error generating response:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});