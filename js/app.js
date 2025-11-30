import { Router } from './router.js';
import { initNavigation } from './components/navigation.js';
import { listUsersByStatus, listarDenuncias } from './services/apiService.js'; // Importe os serviços

const routes = [
    { 
        path: '/dashboard', 
        view: 'views/secretaria.html', 
        controller: '../js/pages/secretaria.js', 
        title: 'Visão Geral', 
        subtitle: 'Monitoramento e indicadores' 
    },
    { 
        path: '/denuncias', 
        view: 'views/gerenciar-denuncias.html', 
        controller: '../js/pages/secretaria/denuncias.js',
        title: 'Gerenciamento de Denúncias',
        subtitle: 'Visualize e valide denúncias'
    },
    { 
        path: '/conflitos', 
        view: 'views/gerenciar-conflitos.html', 
        controller: '../js/pages/secretaria/conflitos.js',
        title: 'Conflitos',
        subtitle: 'Gestão de casos ativos'
    },
    { 
        path: '/gestores', 
        view: 'views/gerenciar-gestores.html', 
        controller: '../js/pages/gerenciar-gestores.js',
        title: 'Gerenciar Gestores',
        subtitle: 'Administração de acesso'
    },
    { 
        path: '/instituicoes', 
        view: 'views/gerenciar-instituicoes.html', 
        controller: '../js/pages/gerenciar-instituicoes.js',
        title: 'Instituições',
        subtitle: 'Entes parceiros'
    },
    { 
        path: '/equipe', 
        view: 'views/minha-equipe.html', 
        controller: '../js/pages/minha-equipe.js',
        title: 'Minha Equipe',
        subtitle: 'Gestão interna'
    },
    { 
        path: '/usuarios', 
        view: 'views/usuarios-sistema.html', 
        controller: '../js/pages/usuarios-sistema.js',
        title: 'Usuários do Sistema',
        subtitle: 'Aprovações e acessos'
    },
    { 
        path: '/mapa', 
        view: 'views/mapa_interativo.html',
        controller: '../js/pages/mapa_interativo.js',
        title: 'Mapa Interativo',
        subtitle: 'Georreferenciamento'
    },
    { 
        path: '/relatorios', 
        view: 'views/relatorios.html', 
        controller: '../js/pages/relatorios.js',
        title: 'Relatórios',
        subtitle: 'Exportação de dados'
    },
    { 
        path: '/auditoria', 
        view: 'views/auditoria.html', 
        controller: '../js/pages/auditoria.js',
        title: 'Auditoria',
        subtitle: 'Logs do sistema'
    },
    { 
        path: '/perfil', 
        view: 'views/perfil.html', 
        controller: '../js/pages/perfil.js',
        title: 'Meu Perfil',
        subtitle: 'Dados pessoais'
    },
    { 
        path: '/configuracoes', 
        view: 'views/configuracoes.html', 
        controller: '../js/pages/configuracoes.js',
        title: 'Configurações',
        subtitle: 'Preferências do sistema'
    },
    { 
        path: '/cadastrar-denuncia', 
        view: 'views/cadastrar-denuncia.html', 
        controller: '../js/pages/cadastrar-denuncia.js', // Novo controlador vinculado
        title: 'Nova Denúncia', 
        subtitle: 'Registro manual' 
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificação de Segurança
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../authentication/login.html';
        return;
    }

    // 2. Carregar Sidebar e Header User Navigation
    initNavigation();
    setupGlobalSidebar();
    setupNotifications();
    
    // **NOVA CHAMADA AQUI**
    setupHeaderUserNavigation(); 

    // 3. Configurar Usuário no Header
    const userName = localStorage.getItem('userName');
    const headerName = document.getElementById('headerUserName');
    if(headerName) headerName.textContent = userName || 'Usuário';

    // 4. Iniciar Router (Hash Mode)
    const router = new Router(routes);
    
    // LÓGICA DE REDIRECIONAMENTO POR CARGO
    const userCargo = localStorage.getItem('userCargo');
    let defaultRoute = '#/dashboard';

    // Se for Usuário Instituição ou Secretaria, a home é o cadastro
    if (userCargo === 'USUARIO_INSTITUICAO' || userCargo === 'USUARIO_SECRETARIA') {
        defaultRoute = '#/cadastrar-denuncia';
    }

    // Carrega a rota baseada no Hash atual ou vai para o padrão definido acima
    router.loadRoute(window.location.hash || defaultRoute);
});

// ... (Resto do código: setupGlobalSidebar e setupNotifications mantidos iguais)
function setupGlobalSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (!menuToggle || !sidebar) return;
    const newToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newToggle, menuToggle);
    newToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
    });
    document.addEventListener('click', (event) => {
        if (sidebar.classList.contains('open')) {
            if (!sidebar.contains(event.target) && !newToggle.contains(event.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

async function setupNotifications() {
    const btn = document.getElementById('notification-btn');
    const badge = document.getElementById('notif-count');
    const list = document.getElementById('notif-list');
    const dropdown = document.getElementById('notification-dropdown');
    const markRead = document.getElementById('mark-read');
    
    if(!btn || !list) return;

    const userCargo = localStorage.getItem('userCargo');
    const userInstName = localStorage.getItem('userInstituicao');

    if (userCargo === 'USUARIO_INSTITUICAO' || userCargo === 'USUARIO_SECRETARIA') {
        badge.style.display = 'none';
        list.innerHTML = '<li style="padding:15px; text-align:center; color:#999;">Nenhuma notificação nova</li>';
        return; 
    }

    let notifications = [];
    
    // Arrays para manter os dados no escopo para a lógica do markRead
    let allPendingUsers = [];
    let allPendingDenuncias = [];

    try {
        const [pendingUsers, denuncias] = await Promise.all([
            listUsersByStatus('PENDENTE').catch(() => []),
            listarDenuncias().catch(() => [])
        ]);

        // 1. Filtro de Usuários
        let myPendingUsers = [];
        if (['SECRETARIA', 'GESTOR_SECRETARIA'].includes(userCargo)) {
            myPendingUsers = pendingUsers;
        } else if (userCargo === 'GESTOR_INSTITUICAO') {
            myPendingUsers = pendingUsers.filter(u => u.instituicaoNome === userInstName);
        }

        const seenUserIds = JSON.parse(localStorage.getItem('sentinela_seen_users') || '[]');
        allPendingUsers = myPendingUsers.filter(u => !seenUserIds.includes(u.id));

        if(allPendingUsers.length > 0) {
            notifications.push({
                text: `${allPendingUsers.length} usuários aguardando aprovação`,
                time: 'Ação Necessária',
                icon: 'fa-user-clock',
                color: '#f0ad4e',
                route: '#/usuarios',
            });
        }

        // 2. Filtro de Denúncias
        let myPendingDenuncias = [];
        const rawPendingDenuncias = denuncias.filter(d => d.status === 'PENDENTE');

        if (['SECRETARIA', 'GESTOR_SECRETARIA'].includes(userCargo)) {
            myPendingDenuncias = rawPendingDenuncias;
        } else if (userCargo === 'GESTOR_INSTITUICAO') {
            myPendingDenuncias = rawPendingDenuncias.filter(d => 
                d.instituicao && d.instituicao.nome === userInstName
            );
        }

        const seenDenunciaIds = JSON.parse(localStorage.getItem('sentinela_seen_denuncias') || '[]');
        allPendingDenuncias = myPendingDenuncias.filter(d => !seenDenunciaIds.includes(d.id));

        if(allPendingDenuncias.length > 0) {
            notifications.push({
                text: `${allPendingDenuncias.length} novas denúncias recebidas`,
                time: 'Recente',
                icon: 'fa-file-alt',
                color: '#d9534f',
                route: '#/denuncias',
            });
        }

    } catch(e) { console.log('Erro notif', e); }
    
    // 4. Renderização
    badge.textContent = notifications.length;
    badge.style.display = notifications.length > 0 ? 'inline-flex' : 'none';
    
    if (notifications.length === 0) {
        list.innerHTML = '<li style="padding:15px; text-align:center; color:#999;">Nenhuma notificação nova</li>';
    } else {
        list.innerHTML = notifications.map(n => `
            <li onclick="
                // 1. Força o clique no botao 'Limpar' para executar a logica de persistencia e limpeza da UI.
                document.getElementById('mark-read').click(); 
                
                // 2. Redireciona para a rota desejada APOS a limpeza.
                // Aumentamos o setTimeout para 50ms para dar tempo do evento click() terminar.
                setTimeout(() => {
                    window.location.hash = '${n.route}';
                }, 50); 
            " 
                style="padding: 12px 15px; border-bottom: 1px solid #f5f5f5; display: flex; gap: 10px; align-items: start; cursor: pointer; transition: background 0.2s;"
                onmouseover="this.style.background='#f9f9f9'" 
                onmouseout="this.style.background='transparent'">
                
                <div style="background:${n.color}20; color:${n.color}; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fas ${n.icon}" style="font-size:0.8rem"></i>
                </div>
                <div>
                    <p style="margin:0; font-size:0.85rem; font-weight:500;">${n.text}</p>
                    <small style="color:#999; font-size:0.75rem;">${n.time}</small>
                </div>
            </li>
        `).join('');
    }

    // Toggle Dropdown (Logica visual)
    const toggleDropdown = (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
    };

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', toggleDropdown);

    document.addEventListener('click', (e) => {
        if(dropdown && !dropdown.contains(e.target) && !newBtn.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // A FAZER: individualizar o clique, pois agora qualquer clique no conjunto de notificações apaga as duas
    // Botao Limpar (Mark Read) - Contem a logica de persistencia e limpeza da UI
    if(markRead) {
        const newMark = markRead.cloneNode(true);
        markRead.parentNode.replaceChild(newMark, markRead);
        
        newMark.addEventListener('click', () => {
            // Lógica de Persistência (OK)
            const storedUsers = JSON.parse(localStorage.getItem('sentinela_seen_users') || '[]');
            const storedDenuncias = JSON.parse(localStorage.getItem('sentinela_seen_denuncias') || '[]');

            const newSeenUserIds = allPendingUsers.map(u => u.id);
            const newSeenDenunciaIds = allPendingDenuncias.map(d => d.id);

            const updatedUsers = [...new Set([...storedUsers, ...newSeenUserIds])];
            const updatedDenuncias = [...new Set([...storedDenuncias, ...newSeenDenunciaIds])];

            localStorage.setItem('sentinela_seen_users', JSON.stringify(updatedUsers));
            localStorage.setItem('sentinela_seen_denuncias', JSON.stringify(updatedDenuncias));

            // Logica de Limpeza da UI
            list.innerHTML = '<li style="padding:15px; text-align:center; color:#999;">Nenhuma notificação nova</li>';
            
            document.getElementById('notif-count').style.display = 'none'; 
            
            dropdown.style.display = 'none';
        });
    }
}

function setupHeaderUserNavigation() {
    // Seleciona os elementos do Avatar e do Nome de Usuario
    const avatar = document.getElementById('headerUserAvatar');
    const userName = document.getElementById('headerUserName');
    
    // Rota para o perfil
    const profileRoute = '#/perfil';

    // Função que lida com o clique e navega
    const navigateToProfile = () => {
        if (window.location.hash !== profileRoute) {
            window.location.hash = profileRoute;
        }
    };

    // Adiciona o evento de clique no avatar e no nome
    if (avatar) {
        avatar.style.cursor = 'pointer'; // Adiciona um cursor para indicar clicável
        avatar.addEventListener('click', navigateToProfile);
    }

    if (userName) {
        userName.style.cursor = 'pointer'; // Adiciona um cursor para indicar clicável
        userName.addEventListener('click', navigateToProfile);
    }
}