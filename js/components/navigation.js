(() => {
    const NAVIGATION_SECTIONS = [
        {
            title: 'GESTÃO',
            items: [
                { key: 'overview', label: 'Visão Geral', icon: 'fas fa-home', href: 'secretaria.html' },
                { key: 'managers', label: 'Gerenciar Gestores', icon: 'fas fa-users-cog', href: 'gerenciar-gestores.html' },
                { key: 'institutions', label: 'Gerenciar Instituições', icon: 'fas fa-building', href: 'gerenciar-instituicoes.html' },
                { key: 'team', label: 'Minha Equipe', icon: 'fas fa-users', href: 'minha-equipe.html' },
                { key: 'systemUsers', label: 'Usuários do Sistema', icon: 'fas fa-user-shield', href: 'usuarios-sistema.html' }
            ]
        },
        {
            title: 'MONITORAMENTO',
            items: [
                { key: 'complaints', label: 'Gerenciar Denúncias', icon: 'fas fa-file-alt', href: 'gerenciar-denuncias.html' },
                { key: 'conflicts', label: 'Gerenciar Conflitos', icon: 'fas fa-exclamation-triangle', href: 'gerenciar-conflitos.html' },
                { key: 'map', label: 'Mapa Interativo', icon: 'fas fa-map-marked-alt', href: 'mapa_interativo.html' },
                { key: 'reports', label: 'Relatórios', icon: 'fas fa-chart-bar', href: 'relatorios.html' },
                { key: 'audit', label: 'Auditoria', icon: 'fas fa-shield-alt', href: 'auditoria.html' }
            ]
        },
        {
            title: 'SISTEMA',
            items: [
                { key: 'profile', label: 'Meu Perfil', icon: 'fas fa-user-circle', href: 'perfil.html' },
                { key: 'settings', label: 'Configurações', icon: 'fas fa-cog', href: 'configuracoes.html' },
                { key: 'logout', label: 'Sair', icon: 'fas fa-sign-out-alt', href: '../../authentication/logout.html', skipBase: true }
            ]
        }
    ];

    const isAbsoluteHref = (href) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);

    const resolveHref = (href, basePath = '', skipBase = false) => {
        if (skipBase || !basePath || basePath === '.' || href.startsWith('../') || href.startsWith('./') || href.startsWith('/') || isAbsoluteHref(href)) {
            return href;
        }

        const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
        return normalizedBase ? `${normalizedBase}/${href}` : href;
    };

    const createNavList = (sections, activeKey, basePath) => {
        return sections.map(section => {
            const itemsHtml = section.items.map(item => {
                const href = resolveHref(item.href, basePath, item.skipBase);
                const isActive = item.key === activeKey;
                return `
                    <li class="${isActive ? 'active' : ''}">
                        <a href="${href}">
                            <i class="${item.icon}"></i> ${item.label}
                        </a>
                    </li>
                `;
            }).join('');

            return `
                <li class="nav-section-title">${section.title}</li>
                ${itemsHtml}
            `;
        }).join('');
    };

    function removeNavItem(key) {
        for (const section of NAVIGATION_SECTIONS) {
            const index = section.items.findIndex(i => i.key === key);
            if (index !== -1) {
                section.items.splice(index, 1);
                return true;
            }
        }
        return false;
    }

    const renderSidebar = (sidebar) => {
        const activeKey = sidebar.dataset.activeNav || '';
        const basePath = sidebar.dataset.basePath || '';
        const logoPath = sidebar.dataset.logoPath || 'assets/images/logo.png';
        const logoAlt = sidebar.dataset.logoAlt || 'Logo Sentinela';
        const title = sidebar.dataset.sidebarTitle || 'SENTINELA';
        const subtitle = sidebar.dataset.sidebarSubtitle || 'Painel Secretaria';


        const cargos = {
            GESTOR_SECRETARIA: ['systemUsers'],
            GESTOR_INSTITUICAO: ['managers', 'institutions', 'systemUsers', 'audit'],
            USUARIO_SECRETARIA: ['managers', 'institutions', 'team', 'systemUsers', 'conflicts', 'reports', 'audit'],
            USUARIO_INSTITUICAO: ['managers', 'institutions', 'team', 'systemUsers', 'conflicts', 'reports', 'audit']
        };

        
        // 1. Pega o cargo do usuário que foi salvo no localStorage durante o login
        const userCargo = localStorage.getItem('userCargo');

        // 2. Verifica se esse cargo existe no mapa de permissões 'cargos'
        if (userCargo && cargos[userCargo]) {
            
            // 3. Pega a lista de itens a serem removidos para esse cargo
            const itemsToRemove = cargos[userCargo]; // Estava "userCargo"
            
            // 4. Itera e remove cada item da navegação
            for (const itemKey of itemsToRemove) {
                removeNavItem(itemKey);
            }
        }
        // O bloco 'if/else if' anterior que checava o 'sidebar.dataset.sidebarSubtitle' foi removido.


        const navigationHtml = createNavList(NAVIGATION_SECTIONS, activeKey, basePath);

        sidebar.innerHTML = `
            <div class="sidebar__header">
                <img src="${logoPath}" alt="${logoAlt}" class="sidebar__logo">
                <div class="sidebar__title">
                    <h1>${title}</h1>
                    <p>${subtitle}</p>
                </div>
            </div>
            <nav class="sidebar__nav">
                <ul>
                    ${navigationHtml}
                </ul>
            </nav>
        `;
    };

    document.addEventListener('DOMContentLoaded', () => {
        const sidebars = document.querySelectorAll('[data-sidebar]');
        sidebars.forEach(renderSidebar);
    });
})();