// Dados Mockados (agora no escopo global do módulo)
const mockLogs = [
    { dateTime: '2024-03-20<br>14:35:22', user: 'maria.silva', action: 'Login', module: 'Autenticação', details: 'Sucesso', level: 'info', ip: '192.168.1.100' },
    { dateTime: '2024-03-20<br>13:22:15', user: 'joao.santos', action: 'Acesso negado', module: 'Autorização', details: 'Sem permissão', level: 'aviso', ip: '192.168.1.105' },
    { dateTime: '2024-03-19<br>11:20:45', user: 'carlos.admin', action: 'Erro sistema', module: 'Relatórios', details: 'Timeout', level: 'erro', ip: '192.168.1.95' },
];

const mockActionsFrequency = [
    { action: 'Login no sistema', count: 156 },
    { action: 'Aprovação de usuários', count: 83 },
    { action: 'Consulta de relatórios', count: 38 }
];

const mockUsersActivity = [
    { user: 'maria.silva', count: 89 },
    { user: 'joao.santos', count: 57 }
];

export async function init() {
    renderLogsTable(mockLogs);
    renderFrequencyList('actionsFrequencyList', mockActionsFrequency);
    renderFrequencyList('usersActivityList', mockUsersActivity);
}

function renderLogsTable(logs) {
    const tableBody = document.getElementById('logsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    logs.forEach(log => {
        const levelTag = `<span class="level-tag ${log.level}">${log.level.toUpperCase()}</span>`;
        const moduleTag = `<span class="module-tag">${log.module}</span>`;
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${log.dateTime}</td>
            <td>${log.user}</td>
            <td>${log.action}</td>
            <td>${moduleTag}</td>
            <td>${log.details}</td>
            <td>${levelTag}</td>
            <td>${log.ip}</td>
        `;
    });
}

function renderFrequencyList(listId, data) {
    const listContainer = document.getElementById(listId);
    if (!listContainer) return;
    listContainer.innerHTML = '';

    data.forEach(item => {
        const isActionList = !!item.action;
        const textContent = isActionList ? item.action : item.user;
        const badgeLabel = isActionList ? 'ações' : 'acessos';

        const html = `
            <div class="frequency-item">
                <p>${textContent}</p>
                <span class="frequency-badge">${item.count} ${badgeLabel}</span>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', html);
    });
}