const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// Use CORS to allow requests
app.use(cors());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TODO: Add other security middleware when installed
// const cors = require('cors');
// app.use(cors());
// const rateLimit = require('express-rate-limit');
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// app.use('/api/', limiter);

// TODO: Add logging when morgan is installed
// const morgan = require('morgan');
// app.use(morgan('dev'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Cache the dictionary in memory
const dictionary = require('./dictionary.json');

// Route for root path to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to fetch the dictionary for the frontend state manager
app.get('/api/dictionary', (req, res) => {
    res.json(dictionary);
});

// Endpoint to fetch the image words for the games
app.get('/api/imagewords', (req, res) => {
    try {
        const imageWords = JSON.parse(fs.readFileSync(path.join(__dirname, 'imagewords.json'), 'utf8'));
        res.json(imageWords);
    } catch (err) {
        console.error("Error loading imagewords.json:", err);
        res.status(500).json({ error: 'Failed to load image words' });
    }
});
const { Credentials, Translator } = require('@translated/lara');

// Initialize Lara Translator
const LARA_ACCESS_KEY_ID = process.env.LARA_ACCESS_KEY_ID;
const LARA_ACCESS_KEY_SECRET = process.env.LARA_ACCESS_KEY_SECRET;

const credentials = new Credentials(LARA_ACCESS_KEY_ID, LARA_ACCESS_KEY_SECRET);
const lara = new Translator(credentials);

// Translation Endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLang } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        // Lara translation (source lang 'en-US' assumed for now, or detect if Lara supports null)
        // Adjust language codes as needed for Lara (e.g., 'lt-LT' for Lithuanian)
        const result = await lara.translate(text, 'en-US', targetLang || 'lt-LT');
        
        res.json({ 
            original: text,
            translated: result.translation,
            sourceLang: 'en-US'
        });
    } catch (error) {
        console.error("Lara Translation Error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});
// Error handling middleware (should be last)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;