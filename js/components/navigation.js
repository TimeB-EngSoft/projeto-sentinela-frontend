export function initNavigation() {
    const NAVIGATION_SECTIONS = [
        {
            title: 'GESTÃO',
            items: [
                { key: 'overview', label: 'Visão Geral', icon: 'fas fa-home', href: '#/dashboard' },
                { key: 'newComplaint', label: 'Nova Denúncia', icon: 'fas fa-plus-circle', href: '#/cadastrar-denuncia' },
                { key: 'managers', label: 'Gerenciar Gestores', icon: 'fas fa-users-cog', href: '#/gestores' },
                { key: 'institutions', label: 'Gerenciar Instituições', icon: 'fas fa-building', href: '#/instituicoes' },
                { key: 'team', label: 'Minha Equipe', icon: 'fas fa-users', href: '#/equipe' },
                { key: 'systemUsers', label: 'Usuários do Sistema', icon: 'fas fa-user-shield', href: '#/usuarios' }
            ]
        },
        {
            title: 'MONITORAMENTO',
            items: [
                { key: 'complaints', label: 'Gerenciar Denúncias', icon: 'fas fa-file-alt', href: '#/denuncias' },
                { key: 'conflicts', label: 'Gerenciar Conflitos', icon: 'fas fa-exclamation-triangle', href: '#/conflitos' },
                { key: 'map', label: 'Mapa Interativo', icon: 'fas fa-map-marked-alt', href: '#/mapa' },
                { key: 'reports', label: 'Relatórios', icon: 'fas fa-chart-bar', href: '#/relatorios' },
                { key: 'audit', label: 'Auditoria', icon: 'fas fa-shield-alt', href: '#/auditoria' }
            ]
        },
        {
            title: 'SISTEMA',
            items: [
                { key: 'profile', label: 'Meu Perfil', icon: 'fas fa-user-circle', href: '#/perfil' },
                { key: 'settings', label: 'Configurações', icon: 'fas fa-cog', href: '#/configuracoes' },
                { key: 'logout', label: 'Sair', icon: 'fas fa-sign-out-alt', href: 'authentication/logout.html', skipBase: true, external: true }
            ]
        }
    ];

    const userCargo = localStorage.getItem('userCargo');
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    // Regras de restrição (O que NÃO mostrar)
    const restrictions = {
        // Secretaria vê tudo menos denuncia
        SECRETARIA: [
            'newComplaint'
        ],

        GESTOR_SECRETARIA: [
            'newComplaint'
        ], 
        
        GESTOR_INSTITUICAO: [
            'managers',      // Não gerencia gestores globais
            'institutions',  // Não cria instituições
            'audit',         // Não vê auditoria global
            'newComplaint'
        ],
        
        USUARIO_SECRETARIA: [
            'managers', 'institutions', 'systemUsers', 'audit', 
            'conflicts',   // Apenas vê (se permitido) ou bloqueado
            'overview'
        ],
        
        USUARIO_INSTITUICAO: [
            'managers', 'institutions', 'systemUsers', 'audit', 
            'conflicts', 'overview'
        ]
    };

    const subtitles = {
        SECRETARIA: 'Painel Secretaria',
        GESTOR_SECRETARIA: "Gestor Secretaria",
        GESTOR_INSTITUICAO: "Gestor Instituição",
        USUARIO_SECRETARIA: "Usuário Secretaria",
        USUARIO_INSTITUICAO: "Usuário Instituição"
    };

    if(subtitles[userCargo]) sidebar.dataset.sidebarSubtitle = subtitles[userCargo];

    const navHtml = NAVIGATION_SECTIONS.map(section => {
        const allowedItems = section.items.filter(item => {
            if (restrictions[userCargo] && restrictions[userCargo].includes(item.key)) return false;
            return true;
        });

        if (allowedItems.length === 0) return '';

        const itemsHtml = allowedItems.map(item => `
            <li>
                <a href="${item.href}" ${item.external ? '' : ''}>
                    <i class="${item.icon}"></i> ${item.label}
                </a>
            </li>
        `).join('');

        return `<li class="nav-section-title">${section.title}</li>${itemsHtml}`;
    }).join('');

    sidebar.innerHTML = `
        <div class="sidebar__header">
            <img src="${sidebar.dataset.logoPath}" class="sidebar__logo">
            <div class="sidebar__title">
                <h1>${sidebar.dataset.sidebarTitle}</h1>
                <p>${sidebar.dataset.sidebarSubtitle}</p>
            </div>
        </div>
        <nav class="sidebar__nav"><ul>${navHtml}</ul></nav>
    `;
}