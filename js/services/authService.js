// Importa as funções do nosso serviço de API atualizado
import { loginUser, recoverPassword } from './apiService.js';

document.addEventListener('DOMContentLoaded', function() {
    // --- LÓGICA DE LOGIN ---
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const emailInput = document.getElementById('email').value;
            const passwordInput = document.getElementById('password').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');

            if (emailInput.trim() === '' || passwordInput.trim() === '') {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';

            try {
                // Chama a função de login da API (que agora envia FormData)
                const successMessage = await loginUser(emailInput, passwordInput);

                // O back-end retorna uma string de sucesso, não um token
                alert(successMessage);
                
                // Em uma aplicação real com tokens, você salvaria o token aqui.
                // localStorage.setItem('userMessage', successMessage);

                // Redireciona para a página principal do sistema
                window.location.href = '../secretaria/secretaria.html'; // Mude para a sua página de dashboard

            } catch (error) {
                console.error('Erro no login:', error);
                alert(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
            } finally {
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
            const emailInput = document.getElementById('email').value;
            const submitButton = recoveryForm.querySelector('button[type="submit"]');

            if (emailInput.trim() === '') {
                alert('Por favor, digite seu e-mail.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                // Chama a função de recuperação (que agora envia FormData e usa a URL correta)
                const resultMessage = await recoverPassword(emailInput);
                alert(resultMessage);
                recoveryForm.reset();
            } catch (error) {
                console.error('Erro na recuperação:', error);
                alert(error.message || 'Não foi possível processar sua solicitação. Verifique o e-mail digitado.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Instruções';
            }
        });
    }
});