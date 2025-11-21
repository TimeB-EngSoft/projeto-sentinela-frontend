export async function init() {
    const switches = document.querySelectorAll('.switch input[type="checkbox"]');
    loadSwitchState(switches);
    
    // Reatribui listeners (para toggle imediato se quiser, ou só no salvar)
    switches.forEach(sw => {
        const newSw = sw.cloneNode(true); 
        sw.parentNode.replaceChild(newSw, sw);
        newSw.checked = localStorage.getItem(newSw.id) === 'true';
        newSw.addEventListener('change', (e) => localStorage.setItem(e.target.id, e.target.checked));
    });

    setupSaveButton();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><div class="toast-content"><span class="toast-title">${type === 'success' ? 'Sucesso' : 'Aviso'}</span><span class="toast-message">${message}</span></div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

function setupSaveButton() {
    const saveBtn = document.querySelector('.export-btn'); // Botão "Salvar configurações"
    const modal = document.getElementById('modal-confirm-save-config');
    
    if(!saveBtn || !modal) return;

    // Clonar botão salvar
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener('click', () => {
        modal.classList.add('show');
    });

    // Modal Controls
    const close = () => modal.classList.remove('show');
    document.getElementById('close-config-modal').addEventListener('click', close);
    document.getElementById('btn-cancel-config').addEventListener('click', close);
    
    document.getElementById('btn-confirm-config').addEventListener('click', () => {
        // Aqui salvaria no backend se houvesse endpoint
        // Como já salvamos no localStorage no 'change', apenas simulamos o sucesso
        showToast('Configurações salvas com sucesso!');
        close();
    });
}

function loadSwitchState(switches) {
    switches.forEach(sw => {
        const val = localStorage.getItem(sw.id);
        if(val !== null) sw.checked = (val === 'true');
    });
}