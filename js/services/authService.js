import { loginUser, recoverPassword, validateToken, resetPassword } from './apiService.js';

document.addEventListener('DOMContentLoaded', function() {

    // --- LOGIN ---
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const senha = document.getElementById('password').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');

            if (!email.trim() || !senha.trim()) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';

            try {
                const response = await loginUser(email, senha);

                // Salva dados do usuário logado
                if (response.user) {
                    localStorage.setItem('userId', response.user.id);
                    localStorage.setItem('userName', response.user.nome);
                    localStorage.setItem('userEmail', response.user.email);
                    localStorage.setItem('userCargo', response.user.cargo);
                    localStorage.setItem('userInstituicao', response.user.instituicao);
                }

                alert(response.message || 'Login efetuado!');
                window.location.href = '../secretaria/secretaria.html';

            } catch (error) {
                alert(error.message || 'Credenciais inválidas.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar no Sistema';
            }
        });
    }

    // --- RECUPERAÇÃO E REDEFINIÇÃO DE SENHA ---
    const recoveryForm = document.getElementById('recovery-form');
    if (recoveryForm) { /* ... mantém igual ... */ }

    const tokenForm = document.getElementById('token-form');
    if (tokenForm) { /* ... mantém igual ... */ }

    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) { /* ... mantém igual ... */ }
});
