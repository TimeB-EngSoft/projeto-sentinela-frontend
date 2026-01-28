import { loginUser, recoverPassword, validateToken, resetPassword } from './apiService.js';

// --- FUNÇÃO AUXILIAR PARA EXIBIR TOAST ---
function showToast(message, type = 'success', title = null) {
    const container = document.getElementById('toast-container');
    if (!container) return; // Se não houver container (ex: página errada), não faz nada

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const titleText = title ? title : (type === 'success' ? 'Sucesso' : 'Erro');

    toast.innerHTML = `
        <i class="fas ${icon}" style="font-size: 1.2rem;"></i>
        <div class="toast-content">
            <span class="toast-title">${titleText}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    container.appendChild(toast);

    // Remove o toast após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function getCurrentUser() {
    return {
        id: localStorage.getItem('userId'),
        nome: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        cargo: localStorage.getItem('userCargo'),
        instituicao: localStorage.getItem('userInstituicao')
    };
}

document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA DE LOGIN ---
    const loginForm = document.getElementById('form-login');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const senha = document.getElementById('password').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');

            if (!email.trim() || !senha.trim()) {
                showToast('Por favor, preencha todos os campos.', 'error', 'Atenção');
                return;
            }

            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

            try {
                const usuario = await loginUser(email, senha);

                localStorage.setItem('userId', usuario.id);
                localStorage.setItem('userName', usuario.nome);
                localStorage.setItem('userEmail', usuario.email);
                localStorage.setItem('userCargo', usuario.cargo);
                localStorage.setItem('userInstituicao', usuario.instituicao?.nome || '');

                // SUCESSO: Mostra Toast e redireciona após um breve delay
                showToast(`Bem-vindo, ${usuario.nome}!`, 'success');
                
                setTimeout(() => {
                    window.location.href = '../../app/index.html';
                }, 1500); // 1.5 segundos para o usuário ver a mensagem
                
            } catch (error) {
                // ERRO: Mostra Toast e reabilita o botão
                showToast(error.message || 'Credenciais inválidas.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar no Sistema';
            }
        });
    }

    // --- LÓGICA DE RECUPERAÇÃO DE SENHA ---
    const recoveryForm = document.getElementById('recovery-form');
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const submitButton = recoveryForm.querySelector('button[type="submit"]');

            if (!email.trim()) {
                showToast('Por favor, digite seu e-mail.', 'error');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                const resultMessage = await recoverPassword(email);
                showToast(resultMessage, 'success');
                setTimeout(() => window.location.href = 'inserir_token.html', 2000);
            } catch (error) {
                showToast(error.message || 'Erro ao processar solicitação.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Instruções';
            }
        });
    }

    // --- LÓGICA DE VALIDAÇÃO DE TOKEN ---
    const tokenForm = document.getElementById('token-form');
    if (tokenForm) {
        tokenForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const token = document.getElementById('token').value;
            const submitButton = tokenForm.querySelector('button[type="submit"]');

            if (token.trim().length < 6) {
                showToast('Insira um token válido.', 'error');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Verificando...';

            try {
                await validateToken(token);
                showToast('Código verificado!', 'success');
                setTimeout(() => window.location.href = `redefinir_senha.html?token=${token}`, 1000);
            } catch (error) {
                showToast(error.message || 'Token inválido.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Verificar Código';
            }
        });
    }

    // --- LÓGICA DE REDEFINIÇÃO DE SENHA ---
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            showToast('Token não encontrado.', 'error');
            setTimeout(() => window.location.href = 'recuperar_senha.html', 2000);
            return;
        }

        resetPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const newPassword = document.getElementById('nova-senha').value;
            const confirmPassword = document.getElementById('confirmar-senha').value;
            const submitButton = resetPasswordForm.querySelector('button[type="submit"]');

            if (newPassword !== confirmPassword) {
                showToast('As senhas não coincidem.', 'error');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            try {
                const resultMessage = await resetPassword(token, newPassword);
                showToast(resultMessage, 'success');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } catch (error) {
                showToast(error.message || 'Erro ao redefinir senha.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Nova Senha';
            }
        });
    }
});