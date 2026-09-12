# Hyundai Mechanic Diagnostic Tool

A minimal full-stack app to diagnose Hyundai vehicles using a local LLM. (could be customized to be more general diagnostic tool)

## Architecture
Frontend (HTML/JS) → Express Server (Node.js) → Ollama (Local AI)

## Prerequisites
1. **Node.js 20 LTS** installed.
2. **Ollama** installed and running (`ollama serve`).
3. AI model pulled (default: `llama3.2:3b` — configurable via `OLLAMA_MODEL` env var).

> A `Modelfile` is also provided for creating a custom Ollama model based on `qwen2.5:1.5b` with a lower temperature.
> you can see and manage the history through the history tab 
## Setup

### 1. Backend Setup
```bash
cd server
npm install
npm start
```
The server will start at `http://localhost:3000` (configurable via `PORT` env var).

### 2. Usage
1. Open `http://localhost:3000` in your browser.
2. Select a Hyundai model.
3. Enter Year and Symptoms or OBD-II error codes.
4. Click **Lancer le Diagnostic**.

## Environment Variables
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model used for diagnostics |

## Troubleshooting
- **CORS Errors**: The Express server handles CORS for the frontend.
- **Ollama Connection Refused**: Ensure `ollama serve` is running on the configured host.
