const codesList = [];
const addCodeBtn = document.getElementById('addCodeBtn');
const newCodeInput = document.getElementById('newCodeInput');
const codesListContainer = document.getElementById('codesList');
const errorCodesInput = document.getElementById('errorCodes');
function updateCodesHiddenInput() {
    errorCodesInput.value = codesList.join(',');
}
const DTC_REGEX = /^[PCBUpbcu]\d{4}$/;
function addCode() {
    const raw = newCodeInput.value.trim();
    if (!raw) return;
    if (!DTC_REGEX.test(raw)) {
        showCodeError('Format invalide. Un code DTC doit être une lettre (P, C, B ou U) suivie de 4 chiffres. Ex : P0300');
        return;
    }
    const code = raw.toUpperCase();
    if (codesList.includes(code)) {
        showCodeError('Ce code est déjà dans la liste.');
        return;
    }
    clearCodeError();
    codesList.push(code);
    updateCodesHiddenInput();
    renderCodes();
    newCodeInput.value = '';
}
function showCodeError(msg) {
    let el = document.getElementById('codeValidationError');
    if (!el) {
        el = document.createElement('div');
        el.id = 'codeValidationError';
        el.className = 'text-danger small mt-1';
        codesListContainer.parentNode.insertBefore(el, codesListContainer.nextSibling);
    }
    el.textContent = msg;
}
function clearCodeError() {
    const el = document.getElementById('codeValidationError');
    if (el) el.remove();
}
function removeCode(code) {
    const index = codesList.indexOf(code);
    if (index > -1) {
        codesList.splice(index, 1);
        updateCodesHiddenInput();
        renderCodes();
    }
}
function renderCodes() {
    codesListContainer.innerHTML = '';
    codesList.forEach(code => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-secondary d-flex align-items-center p-2';
        badge.innerHTML = `${code} <button type="button" class="btn-close btn-close-white ms-2" aria-label="Remove" style="font-size: 0.5rem;"></button>`;
        badge.querySelector('button').addEventListener('click', () => removeCode(code));
        codesListContainer.appendChild(badge);
    });
}
addCodeBtn.addEventListener('click', addCode);
newCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        addCode();
    }
});
document.getElementById('diagnosticForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('loadingSpinner');
    const resultsArea = document.getElementById('resultsArea');
    const diagnosticsList = document.getElementById('diagnosticsList');
    const errorArea = document.getElementById('errorArea');
    const streamLog = document.getElementById('streamLog');
    resultsArea.classList.add('d-none');
    errorArea.classList.add('d-none');
    diagnosticsList.innerHTML = '';
    streamLog.classList.add('d-none');
    streamLog.textContent = '';
    submitBtn.disabled = true;
    const codes = document.getElementById('errorCodes').value;
    const symptoms = document.getElementById('symptoms').value;
    if (!codes && !symptoms.trim()) {
        errorArea.textContent = 'Veuillez renseigner au moins un code erreur ou décrire les symptômes.';
        errorArea.classList.remove('d-none');
        submitBtn.disabled = false;
        return;
    }
    spinner.classList.remove('d-none');
    resultsArea.classList.remove('d-none'); 
    streamLog.classList.remove('d-none');
    streamLog.textContent = 'Initialisation de l\'analyse...\n';
    const formData = {
        model: document.getElementById('model').value,
        year: document.getElementById('year').value,
        fuelType: document.getElementById('engineType').value,
        engineDetails: document.getElementById('engineDetails').value,
        transmission: document.getElementById('transmission').value,
        errorCodes: document.getElementById('errorCodes').value,
        symptoms: document.getElementById('symptoms').value
    };
    try {
        const response = await fetch('/api/diagnose', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur serveur');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = '';
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); 
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.message && json.message.content) {
                        fullText += json.message.content;
                        streamLog.textContent = fullText;
                        streamLog.scrollTop = streamLog.scrollHeight;
                    } else if (json.error) {
                        throw new Error(json.error);
                    }
                } catch (e) {
                    console.warn("Stream line parse fail or non-NDJSON line:", line);
                }
            }
        }
        if (buffer.trim()) {
            try {
                const json = JSON.parse(buffer);
                if (json.message && json.message.content) {
                    fullText += json.message.content;
                    streamLog.textContent = fullText;
                }
            } catch (e) {
                if (!fullText) {
                    fullText = buffer;
                }
            }
        }
        streamLog.textContent += '\n\n[Analyse Terminée] Validation...';
        let data;
        try {
            let cleanText = fullText.trim();
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }
            cleanText = cleanText
                .replace(/,\s*}/g, '}')  
                .replace(/,\s*]/g, ']'); 
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Error on full text:", fullText);
            const preview = (fullText && fullText.length < 500) ? fullText : fullText.substring(0, 500);
            throw new Error(`Erreur de format JSON. \nRecu:\n${preview}...`);
        }
        if (data.diagnostics && data.diagnostics.length > 0) {
            renderDiagnostics(data.diagnostics);
            streamLog.classList.add('d-none'); 
            fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: formData, result: data })
            }).catch(err => console.warn('[History Save]', err.message));
        } else {
            errorArea.textContent = 'Aucun diagnostic retourné.';
            errorArea.classList.remove('d-none');
        }
    } catch (err) {
        errorArea.textContent = 'Erreur: ' + err.message;
        errorArea.classList.remove('d-none');
        streamLog.textContent += `\n[ERREUR] ${err.message}`;
    } finally {
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
    }
});
function renderDiagnostics(diagnostics) {
    const container = document.getElementById('diagnosticsList');
    diagnostics.sort((a, b) => b.certainty - a.certainty);
    diagnostics.forEach((diag, index) => {
        const col = document.createElement('div');
        col.className = 'card mb-3';
        let certaintyClass = 'certainty-low';
        if (diag.certainty >= 75) certaintyClass = 'certainty-high';
        else if (diag.certainty >= 40) certaintyClass = 'certainty-med';
        col.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="card-title text-primary">#${index + 1}: ${diag.cause}</h5>
                    <span class="${certaintyClass}">${diag.certainty}% Certitude</span>
                </div>
                <h6 class="card-subtitle mb-2 text-muted"><strong>Solution:</strong> ${diag.fix}</h6>
                <p class="card-text border-top pt-2 mt-2 fst-italic"><small><strong>Meilleure Pratique:</strong> ${diag.practice}</small></p>
            </div>
        `;
        container.appendChild(col);
    });
}
