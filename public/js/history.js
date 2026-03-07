const sidebarList = document.getElementById('sidebarList');
const sidebarEmpty = document.getElementById('sidebarEmpty');
const historyCount = document.getElementById('historyCount');
const detailArea = document.getElementById('detailArea');
const detailPlaceholder = document.getElementById('detailPlaceholder');
let activeId = null;
async function loadSidebar() {
    try {
        const res = await fetch('/api/history');
        if (!res.ok) throw new Error('Failed to load history');
        const items = await res.json();
        historyCount.textContent = items.length;
        sidebarList.innerHTML = '';
        if (items.length === 0) {
            sidebarEmpty.classList.remove('d-none');
            return;
        }
        sidebarEmpty.classList.add('d-none');
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'sidebar-item' + (item.id === activeId ? ' active' : '');
            div.dataset.id = item.id;
            const date = new Date(item.created_at + 'Z');
            const dateStr = date.toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const codesPreview = item.error_codes
                ? item.error_codes.substring(0, 30) + (item.error_codes.length > 30 ? '…' : '')
                : 'Aucun code';
            div.innerHTML = `
                <div class="si-model">Hyundai ${item.model} (${item.year || '—'})</div>
                <div class="si-meta">${dateStr}</div>
                <div class="si-codes">${codesPreview}</div>
            `;
            div.addEventListener('click', () => loadDetail(item.id));
            sidebarList.appendChild(div);
        });
    } catch (err) {
        console.error('[History]', err);
        sidebarEmpty.textContent = 'Erreur de chargement.';
        sidebarEmpty.classList.remove('d-none');
    }
}
async function loadDetail(id) {
    activeId = id;
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.toggle('active', Number(el.dataset.id) === id);
    });
    try {
        const res = await fetch(`/api/history/${id}`);
        if (!res.ok) throw new Error('Not found');
        const row = await res.json();
        const result = JSON.parse(row.result_json);
        const date = new Date(row.created_at + 'Z');
        const dateStr = date.toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        let html = `
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h3 class="mb-1">Hyundai ${row.model} (${row.year || '—'})</h3>
                    <small class="text-muted">${dateStr}</small>
                </div>
                <button class="btn btn-outline-danger btn-sm delete-btn" onclick="deleteDiagnostic(${id})">
                    Supprimer
                </button>
            </div>
            <div class="vehicle-info-grid">
                ${infoItem('Modèle', row.model)}
                ${infoItem('Année', row.year)}
                ${infoItem('Carburant', row.fuel_type)}
                ${infoItem('Moteur', row.engine)}
                ${infoItem('Transmission', row.transmission)}
                ${infoItem('Codes DTC', row.error_codes || 'Aucun')}
            </div>
        `;
        if (row.symptoms) {
            html += `
                <div class="mb-4">
                    <strong>Symptômes :</strong>
                    <p class="text-muted mt-1">${escapeHtml(row.symptoms)}</p>
                </div>
            `;
        }
        html += '<h4 class="mb-3">Résultats du Diagnostic</h4>';
        if (result.diagnostics && result.diagnostics.length > 0) {
            result.diagnostics.sort((a, b) => b.certainty - a.certainty);
            result.diagnostics.forEach((diag, i) => {
                let certClass = 'certainty-low';
                if (diag.certainty >= 75) certClass = 'certainty-high';
                else if (diag.certainty >= 40) certClass = 'certainty-med';
                html += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="card-title text-primary">#${i + 1}: ${escapeHtml(diag.cause)}</h5>
                                <span class="${certClass}">${diag.certainty}% Certitude</span>
                            </div>
                            <h6 class="card-subtitle mb-2 text-muted"><strong>Solution:</strong> ${escapeHtml(diag.fix)}</h6>
                            <p class="card-text border-top pt-2 mt-2 fst-italic"><small><strong>Meilleure Pratique:</strong> ${escapeHtml(diag.practice)}</small></p>
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<p class="text-muted">Aucun résultat disponible.</p>';
        }
        detailArea.innerHTML = html;
    } catch (err) {
        console.error('[Detail]', err);
        detailArea.innerHTML = '<div class="alert alert-danger">Impossible de charger ce diagnostic.</div>';
    }
}
async function deleteDiagnostic(id) {
    if (!confirm('Supprimer ce diagnostic ?')) return;
    try {
        const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        activeId = null;
        detailArea.innerHTML = '<div class="empty-state">Diagnostic supprimé.</div>';
        loadSidebar();
    } catch (err) {
        console.error('[Delete]', err);
        alert('Erreur lors de la suppression.');
    }
}
function infoItem(label, value) {
    return `
        <div class="info-item">
            <div class="info-label">${label}</div>
            <div class="info-value">${escapeHtml(value || '—')}</div>
        </div>
    `;
}
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}
loadSidebar();
