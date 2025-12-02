export class Router {
    constructor(routes) {
        this.routes = routes;
        this.contentDiv = document.getElementById('app-content');
        this.loader = document.getElementById('page-loader');
        this.pageTitle = document.getElementById('page-title');
        this.pageSubtitle = document.getElementById('page-subtitle');

        // Monitora a mudança do # na URL
        window.addEventListener('hashchange', () => {
            this.loadRoute(window.location.hash);
        });
    }

    // Navegação manual (opcional, pois agora basta mudar o hash)
    navigateTo(url) {
        window.location.hash = url;
    }

    async loadRoute(hash) {
        // Verifica se o usuário tem credenciais antes de processar a rota
        const userId = localStorage.getItem('userId');
        if (!userId) {
            // Redireciona para o login. O caminho é relativo a 'app/index.html'
            window.location.href = 'authentication/login.html'; 
            return; // Interrompe a execução imediatamente
        }
        // ---------------------------
        // Remove o '#' para comparar com as rotas. Se vazio, vai para /dashboard
        let path = hash ? hash.replace('#', '') : '/dashboard';
        
        // Garante que o path comece com /
        if (!path.startsWith('/')) path = '/' + path;

        // Encontra a rota
        const match = this.routes.find(r => r.path === path) || this.routes[0];

        // Atualiza Sidebar Ativa
        document.querySelectorAll('.sidebar__nav li').forEach(li => li.classList.remove('active'));
        // Procura o link que contém o hash correspondente
        const activeLink = document.querySelector(`.sidebar__nav a[href="#${match.path}"]`);
        if (activeLink) activeLink.parentElement.classList.add('active');

        // Atualiza Títulos
        if (this.pageTitle) this.pageTitle.textContent = match.title;
        if (this.pageSubtitle) this.pageSubtitle.textContent = match.subtitle;

        // Prepara UI
        this.contentDiv.innerHTML = '';
        this.loader.style.display = 'block';

        try {
            // 1. Carrega HTML da View
            const response = await fetch(match.view);
            if (!response.ok) throw new Error(`View não encontrada: ${match.view}`);
            const html = await response.text();
            
            this.loader.style.display = 'none';
            this.contentDiv.innerHTML = html;

            // 2. Carrega e Inicia o Script Controlador
            if (match.controller) {
                const module = await import(match.controller);
                if (module.init) await module.init();
            }

        } catch (error) {
            console.error(error);
            this.loader.style.display = 'none';
            this.contentDiv.innerHTML = '<p class="alert is-error">Erro ao carregar a página.</p>';
        }
    }
}