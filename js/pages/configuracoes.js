document.addEventListener('DOMContentLoaded', function () {

    // Função que carrega os dados do usuário no cabeçalho (navbar)
    // Nome hardcoded

    function loadHeaderUserData() {
        // Dados mockados para teste local. Em um projeto real, viriam de uma API.
        const userName = 'Alice Oliveira';
        const userCargo = 'Secretário(a) - FUNAI';

        // Simulação de armazenamento local para persistência
        localStorage.setItem('userName', userName);
        localStorage.setItem('userCargo', userCargo);

        if (userName) {
            document.getElementById('headerUserName').textContent = userName;
        } else {
            document.getElementById('headerUserName').textContent = 'Usuário';
        }

        if (userCargo) {
            document.getElementById('headerUserRole').textContent = userCargo;
        }

        // Inicial para o avatar
        const avatar = document.getElementById('headerUserAvatar');
        if (userName && avatar) {
            const inicial = userName.charAt(0).toUpperCase();
            avatar.innerHTML = `<span>${inicial}</span>`;
            avatar.classList.remove('avatar-placeholder');
        }
    }

    loadHeaderUserData();

    // variáveis do sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content'); // Para fechar ao clicar no conteúdo

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede o fechamento imediato se for o toggle
            sidebar.classList.toggle('open');
        });
    }

    // fecha o sidebar quando clicar fora
    if (mainContent && sidebar) {
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }


    
    const switches = document.querySelectorAll('.switch input[type="checkbox"]');

    function loadSwitchState() {
        switches.forEach(sw => {
            const state = localStorage.getItem(sw.id);
            // Define o estado inicial do switch baseado no localStorage ou no padrão HTML (checked)
            if (state !== null) {
                sw.checked = (state === 'true');
            } else {
                // Se não houver nada no localStorage, salva o estado padrão do HTML
                localStorage.setItem(sw.id, sw.checked);
            }
        });
    }

    function saveSwitchState(event) {
        const sw = event.target;
        localStorage.setItem(sw.id, sw.checked);
        console.log(`Configuração: ${sw.id} alterada para ${sw.checked}`);

        // Lógica específica para o switch de notificação push
        if (sw.id === 'pushNotificationsSwitch' && sw.checked) {
            requestPushNotificationPermission();
        }
    }

    // Função para simular a requisição de permissão de notificação
    function requestPushNotificationPermission() {
        if (window.Notification && Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Permissão de Notificação Push concedida!");
                    // Você pode exibir uma notificação de teste aqui, se quiser
                    // new Notification("Notificações Habilitadas", { body: "Você receberá alertas do Painel Sentinela." });
                } else {
                    console.log("Permissão de Notificação Push negada. Desabilitando switch.");
                    document.getElementById('pushNotificationsSwitch').checked = false;
                    localStorage.setItem('pushNotificationsSwitch', 'false');
                }
            });
        }
    }

    loadSwitchState();

    switches.forEach(sw => {
        sw.addEventListener('change', saveSwitchState);
    });

    
    // variáveis dos botões
    const editProfileBtn = document.querySelector('.btn-edit-profile');
    const changePasswordBtn = document.querySelector('.btn-change-password');

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            alert("Funcionalidade 'Editar Perfil' acionada. Implementar modal ou navegação.");
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            alert("Funcionalidade 'Mudar Senha' acionada. Implementar modal ou navegação.");
        });
    }
});