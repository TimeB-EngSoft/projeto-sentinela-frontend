// Importa a nova função do apiService
import { cadastrarCompleto } from '../services/apiService.js';

// --- Função auxiliar para exibir toast de notificação ---
// Esta função cria um elemento de toast dentro do container #toast-container,
// definindo o ícone e o título automaticamente com base no tipo de mensagem.
function showToast(message, type = 'success', title = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const titleText = title || (type === 'success' ? 'Sucesso' : 'Atenção');
    toast.innerHTML = `
        <i class="fas ${icon}" style="font-size: 1.2rem;"></i>
        <div class="toast-content">
            <span class="toast-title">${titleText}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    container.appendChild(toast);
    // Remove o toast após 3 segundos com animação suave
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('finishRegistrationForm');
    
    // 1. Pegar o Token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Se o token não estiver presente, avisa via toast e redireciona
    if (!token) {
        showToast('Token de finalização não encontrado. Por favor, use o link enviado para seu e-mail.', 'error', 'Atenção');
        // Redireciona para o login, pois não há o que fazer aqui
        window.location.href = '../../app/authentication/finalizar-cadastro.html';
        return;
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submitButton = registrationForm.querySelector('button[type="submit"]');

            // 2. Coletar dados do formulário
            const cpf = document.getElementById('cpf').value;
            const telefone = document.getElementById('telefone').value;
            const dataNascimento = document.getElementById('dataNascimento').value;
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;

            // 3. Validações
            if (senha !== confirmarSenha) {
                showToast('As senhas não coincidem. Tente novamente.', 'error', 'Atenção');
                return;
            }
            if (!cpf || !telefone || !dataNascimento || !senha) {
                showToast('Por favor, preencha todos os campos obrigatórios (*).', 'error', 'Atenção');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Finalizando...';

            try {
                // 4. Enviar para a API (com o token)
                const message = await cadastrarCompleto(token, senha, telefone, dataNascimento, cpf);
                // Exibe mensagem de sucesso através do toast
                showToast(message, 'success');
                
                // Redireciona para o login
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Erro ao finalizar cadastro:', error);
                showToast(error.message || 'Não foi possível finalizar seu cadastro. O token pode ter expirado.', 'error', 'Atenção');
                submitButton.disabled = false;
                submitButton.textContent = 'Finalizar Cadastro';
            }
        });
    }
});