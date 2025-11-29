import { listarLogsAuditoria, obterStatsAuditoria } from '../services/apiService.js';

export async function init() {
    await loadStats();
    await loadLogs();
}

async function loadStats() {
    try {
        const stats = await obterStatsAuditoria();
        
        // Atualiza os cards superiores (ajuste os seletores conforme seu HTML)
        updateCard(0, stats.totalLogs);
        updateCard(1, stats.acoesHoje);
        updateCard(2, stats.avisos);
        updateCard(3, stats.erros);

        // Atualiza listas de frequência
        renderFrequencyList('usersActivityList', stats.topUsuarios, false);
        renderFrequencyList('actionsFrequencyList', stats.topAcoes, true);

    } catch (e) {
        console.error("Erro ao carregar estatísticas:", e);
    }
}

function updateCard(index, value) {
    const cards = document.querySelectorAll('.audit-card .stat-card__info span');
    if (cards[index]) cards[index].textContent = value;
}

async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Carregando logs...</td></tr>';

    try {
        const logs = await listarLogsAuditoria();
        tbody.innerHTML = '';
        
        if(logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Nenhum log encontrado.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const date = new Date(log.dataHora).toLocaleString();
            const levelClass = log.nivel.toLowerCase(); // INFO, AVISO, ERRO
            
            const row = `
                <tr>
                    <td>${date}</td>
                    <td>${log.usuario || '-'}</td>
                    <td>${log.acao}</td>
                    <td><span class="module-tag">${log.modulo}</span></td>
                    <td>${log.detalhes || ''}</td>
                    <td><span class="level-tag ${levelClass}">${log.nivel}</span></td>
                    <td>${log.ip || '-'}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red">Erro de conexão.</td></tr>';
    }
}

function renderFrequencyList(containerId, data, isAction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999">Sem dados</p>';
        return;
    }

    data.forEach(item => {
        // O backend retorna array de objetos [nome, contagem]
        const name = item[0];
        const count = item[1];
        
        const html = `
            <div class="frequency-item">
                <p>${name}</p>
                <span class="frequency-badge">${count}</span>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}