const path = require('path');
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
module.exports = {
    PORT: process.env.PORT || 3000,
    OLLAMA_API_URL: `${OLLAMA_HOST}/api/chat`,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    PUBLIC_DIR: path.join(__dirname, '../../public')
};
