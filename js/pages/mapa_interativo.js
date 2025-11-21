export async function init() {
    const mockInstitutions = [
        { name: 'Escola Municipal Santos Dumont', type: 'Escola', conflicts: 12, gravity: 'medium' },
        { name: 'Colégio Estadual Dom Pedro', type: 'Colégio', conflicts: 8, gravity: 'low' },
        { name: 'Centro Madre Teresa', type: 'Centro', conflicts: 23, gravity: 'high' },
    ];

    const mockStats = { totalInstitutions: 3, totalConflicts: 43, highGravity: 1 };

    renderInstitutionList(mockInstitutions);
    renderStats(mockStats);
}

function getGravityClass(gravity) {
    switch (gravity.toLowerCase()) {
        case 'low': return 'status-dot-low';
        case 'medium': return 'status-dot-medium';
        case 'high': return 'status-dot-high';
        default: return 'status-dot-low';
    }
}

function renderInstitutionList(institutions) {
    const listContainer = document.getElementById('institutionList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    institutions.forEach(inst => {
        const statusClass = getGravityClass(inst.gravity);
        const html = `
            <div class="institution-item">
                <div class="institution-details">
                    <p>${inst.name}</p>
                    <small>${inst.type}</small>
                    <span class="conflict-count">${inst.conflicts} conflitos</span>
                </div>
                <span class="${statusClass} institution-status-dot"></span>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', html);
    });
}

function renderStats(stats) {
    const elTotal = document.getElementById('totalInstitutions');
    const elConf = document.getElementById('totalConflicts');
    const elHigh = document.getElementById('highGravity');
    
    if(elTotal) elTotal.textContent = stats.totalInstitutions;
    if(elConf) elConf.textContent = stats.totalConflicts;
    if(elHigh) elHigh.textContent = stats.highGravity;
}