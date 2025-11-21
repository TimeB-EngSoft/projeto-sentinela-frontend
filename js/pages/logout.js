import { logoutUser } from '../services/apiService.js';

document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirm-logout-btn');
    const cancelBtn = document.getElementById('cancel-logout-btn');

    if (!confirmBtn || !cancelBtn) return;

    // Botão Confirmar (Sair)
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Saindo...';

        try {
            // 1. Tenta avisar o backend (opcional)
            await logoutUser();
        } catch (error) {
            console.warn('Erro de rede ao sair, continuando logout local:', error);
        } finally {
            // 2. Limpa dados locais
            localStorage.clear();
            sessionStorage.clear();

            // 3. Redirecionamento Absoluto e Seguro
            // Sai da pasta 'app/authentication' e vai para 'app/authentication/login.html'
            // Usamos window.location.pathname para garantir o caminho correto
            
            // Se estiver rodando localmente ou em servidor, forçamos o caminho do login
            window.location.href = 'login.html'; 
        }
    });

    // Botão Cancelar (Voltar)
    cancelBtn.addEventListener('click', () => {
        // Volta para o painel principal (../index.html)
        // Se o arquivo logout.html está em /app/authentication, subir um nível leva para /app
        window.location.href = '../index.html';
    });
});