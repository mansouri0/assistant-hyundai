const axios = require('axios');
const { OLLAMA_API_URL, OLLAMA_MODEL } = require('../config');
async function generateDiagnostic(messages) {
    try {
        const response = await axios.post(OLLAMA_API_URL, {
            model: OLLAMA_MODEL,
            messages: messages,
            stream: true,
            format: "json",
            options: {
                temperature: 0,
                seed: 42
            }
        }, {
            responseType: 'stream', 
            timeout: 60000 
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`Ollama Error: ${error.response.status} - ${error.response.statusText}`);
        }
        throw new Error(`Ollama Connection Error: ${error.message} - Ensure Ollama is running at ${OLLAMA_API_URL}`);
    }
}
module.exports = { generateDiagnostic };
