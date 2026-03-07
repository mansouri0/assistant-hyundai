const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT, PUBLIC_DIR } = require('./src/config');
const { runDiagnosticPipeline } = require('./src/diagnosticPipeline');
const { saveResult, getAllHistory, getById, deleteById, closeDb } = require('./src/modules/database');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.post('/api/diagnose', async (req, res) => {
    try {
        const diagnostics = await runDiagnosticPipeline(req.body);
        if (diagnostics.pipe) {
            res.setHeader('Content-Type', 'text/plain');
            diagnostics.pipe(res);
        } else {
            res.json(diagnostics);
        }
    } catch (error) {
        console.error('[Server Error]', error.message);
        if (error.message.includes('Connection') || error.message.includes('ECONNREFUSED')) {
            res.status(503).json({ error: 'AI Service Unavailable - Please check Ollama connection.' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
app.post('/api/history', (req, res) => {
    try {
        const { input, result } = req.body;
        if (!input || !result) {
            return res.status(400).json({ error: 'Missing input or result.' });
        }
        const id = saveResult(input, result);
        res.status(201).json({ id });
    } catch (error) {
        console.error('[History Save Error]', error.message);
        res.status(500).json({ error: 'Failed to save diagnostic.' });
    }
});
app.get('/api/history', (req, res) => {
    try {
        const rows = getAllHistory();
        res.json(rows);
    } catch (error) {
        console.error('[History List Error]', error.message);
        res.status(500).json({ error: 'Failed to retrieve history.' });
    }
});
app.get('/api/history/:id', (req, res) => {
    try {
        const row = getById(req.params.id);
        if (!row) {
            return res.status(404).json({ error: 'Diagnostic not found.' });
        }
        res.json(row);
    } catch (error) {
        console.error('[History Detail Error]', error.message);
        res.status(500).json({ error: 'Failed to retrieve diagnostic.' });
    }
});
app.delete('/api/history/:id', (req, res) => {
    try {
        const deleted = deleteById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Diagnostic not found.' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('[History Delete Error]', error.message);
        res.status(500).json({ error: 'Failed to delete diagnostic.' });
    }
});
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
const shutdown = () => {
    console.log('[Server] Shutting down...');
    closeDb();
    server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
    });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
