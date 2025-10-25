import { logoutUser } from '../services/apiService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os botões pelos novos IDs
    const confirmBtn = document.getElementById('confirm-logout-btn');
    const cancelBtn = document.getElementById('cancel-logout-btn');

    if (!confirmBtn || !cancelBtn) {
        console.error('Botões de confirmação de logout não encontrados na página.');
        return;
    }

    // Evento para o botão de confirmação de saída
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Saindo...';

        try {
            // Chama a função da API para fazer logout
            const message = await logoutUser();
            alert(message); // Exibe a mensagem de sucesso (ex: "Logout efetuado com sucesso!")

            // Limpa o armazenamento local e de sessão por segurança
            localStorage.clear();
            sessionStorage.clear();
            
            // Redireciona o usuário para a página de login
            window.location.href = './login.html'; 

        } catch (error) {
            console.error('Erro ao efetuar logout:', error);
            alert(error.message || 'Não foi possível encerrar a sessão. Tente novamente.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Sim, Sair';
        }
    });

    // Evento para o botão de cancelar
    cancelBtn.addEventListener('click', () => {
        // Retorna para a página anterior no histórico do navegador (o painel)
        window.history.back();
    });
});