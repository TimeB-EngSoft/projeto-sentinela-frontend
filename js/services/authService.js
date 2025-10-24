// Importa as funções do nosso novo serviço de API
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

            // Desabilita o botão para evitar múltiplos cliques
            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';

            try {
                // Chama a função de login da API
                const result = await loginUser(emailInput, passwordInput);

                // Se o login for bem-sucedido, o back-end geralmente retorna um token
                // Você deve salvar esse token (por exemplo, no localStorage)
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
                    alert('Login bem-sucedido! Redirecionando...');
                    // Redireciona para a página principal do sistema
                    window.location.href = '../secretaria/secretaria.html';
                } else {
                     alert('Ocorreu um erro inesperado. Tente novamente.');
                }

            } catch (error) {
                // Se a API retornar um erro (ex: senha incorreta), ele será capturado aqui
                console.error('Erro no login:', error);
                alert(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
            } finally {
                // Reabilita o botão após a tentativa de login
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
                // Chama a função de recuperação de senha da API
                const result = await recoverPassword(emailInput);
                alert(result.message || 'Instruções de recuperação enviadas com sucesso! Verifique seu e-mail.');
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