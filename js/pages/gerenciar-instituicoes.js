// Assumindo que você tem um módulo 'apiService.js' no local correto
import { logoutUser } from '../services/apiService.js'; 

document.addEventListener('DOMContentLoaded', function() {
    
    // ===========================================
    // ===== CÓDIGO DO HEADER/SIDEBAR =====
    // ===========================================

    /**
     * Carrega os dados do usuário (nome e avatar) no cabeçalho.
     */
    function loadHeaderUserData() {
        const userName = localStorage.getItem('userName');
        
        if (userName) {
            document.getElementById('headerUserName').textContent = userName;
        } else {
            document.getElementById('headerUserName').textContent = 'Usuário';
        }

        // Esta tela não exibe o "cargo" no header.
        // const userCargo = localStorage.getItem('userCargo');
        // if (userCargo) {
        //     document.getElementById('headerUserRole').textContent = userCargo;
        // }

        // Lógica do Avatar: Usa a inicial do nome ou um ícone placeholder.
        const avatar = document.getElementById('headerUserAvatar');
        if (userName && avatar) {
            const inicial = userName.charAt(0).toUpperCase();
            // Remove a classe placeholder e define a inicial
            avatar.classList.remove('avatar-placeholder');
            avatar.innerHTML = `<span>${inicial}</span>`;
            
            // Adiciona estilo para a inicial
            avatar.style.backgroundColor = 'var(--color-light-beige)'; 
            avatar.style.color = 'var(--color-dark-brown)';

        } else if (avatar) {
             // Garante que o ícone de usuário apareça se não houver nome
            avatar.innerHTML = `<i class="fas fa-user"></i>`;
            avatar.classList.add('avatar-placeholder');
            // Remove estilos de inicial se houver
            avatar.style.backgroundColor = ''; 
            avatar.style.color = '';
        }
    }

    // Chama a função ao carregar a página
    loadHeaderUserData();
    
    // Lógica para o menu hambúrguer em telas móveis
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Lógica para fechar a sidebar ao clicar fora dela
    document.addEventListener('click', (event) => {
        if (sidebar && sidebar.classList.contains('open')) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnMenuToggle = menuToggle ? menuToggle.contains(event.target) : false;

            if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });

});