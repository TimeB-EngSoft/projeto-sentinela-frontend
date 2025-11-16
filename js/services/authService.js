// Importa as funções necessárias do serviço de API
import { loginUser, recoverPassword, validateToken, resetPassword } from './apiService.js';

document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA DE LOGIN ---
    const loginForm = document.getElementById('form-login');

/**
 * Retorna a página de destino correta com base no cargo do usuário.
 */
function getRedirectPageByCargo(cargo) {
    const basePath = '../../app/users/';
    
    // Mapeia os cargos para suas respectivas páginas
    const rolePages = {
        'SECRETARIA': 'secretaria/secretaria.html',
        'GESTOR_SECRETARIA': 'gestor-secretaria/gestor-secretaria.html',
        'GESTOR_INSTITUICAO': 'gestor-instituicao/gestor-instituicao.html',
        'USUARIO_SECRETARIA': 'usuario-secretaria/usuario-secretaria.html',
        'USUARIO_INSTITUICAO': 'usuario-instituicao/usuario-instituicao.html' // Exemplo: redireciona para a mesma tela de usuário
        // Adicione outros cargos e páginas conforme necessário
    };

    // Retorna a página do cargo ou uma página padrão (ex: secretaria.html) se o cargo não for encontrado
    return basePath + (rolePages[cargo] || 'secretaria.html');
}

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
            // A função loginUser agora retorna o objeto do usuário diretamente
            const usuario = await loginUser(email, senha);

            // Salva os dados do usuário logado no localStorage
            localStorage.setItem('userId', usuario.id);
            localStorage.setItem('userName', usuario.nome);
            localStorage.setItem('userEmail', usuario.email);
            localStorage.setItem('userCargo', usuario.cargo);
            localStorage.setItem('userInstituicao', usuario.instituicao?.nome || '');

            alert('Login efetuado com sucesso! Bem-vindo, ' + usuario.nome);
            
            // *** MUDANÇA PRINCIPAL AQUI ***
            // Redireciona para a página correta baseada no cargo
            const redirectPage = getRedirectPageByCargo(usuario.cargo);
            window.location.href = redirectPage;

        } catch (error) {
            // A mensagem de erro agora vem da propriedade 'message' do JSON
            alert(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar no Sistema';
        }
    });
}

    // --- LÓGICA DE RECUPERAÇÃO DE SENHA (SOLICITAÇÃO) ---
    const recoveryForm = document.getElementById('recovery-form');
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const submitButton = recoveryForm.querySelector('button[type="submit"]');

            if (!email.trim()) {
                alert('Por favor, digite seu e-mail.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                const resultMessage = await recoverPassword(email);
                alert(resultMessage); // Ex: "Instruções enviadas para seu e-mail!"
                // Após o sucesso, redireciona para a tela de inserir o token
                window.location.href = 'inserir_token.html';
            } catch (error) {
                alert(error.message || 'Não foi possível processar sua solicitação. Verifique o e-mail digitado.');
            } finally {
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

            if (token.trim().length < 6) { // Validação básica do tamanho do token
                alert('Por favor, insira um token válido.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Verificando...';

            try {
                await validateToken(token);
                // Em caso de sucesso, redireciona para a redefinição de senha, passando o token na URL
                window.location.href = `redefinir_senha.html?token=${token}`;
            } catch (error) {
                alert(error.message || 'Token inválido ou expirado. Por favor, tente novamente.');
            } finally {
                // Garante que o botão seja reativado se a validação falhar
                submitButton.disabled = false;
                submitButton.textContent = 'Verificar Código';
            }
        });
    }

    // --- LÓGICA DE REDEFINIÇÃO DE SENHA (FINAL) ---
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        // 1. Extrai o token da URL assim que a página carregar
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        // 2. Medida de segurança: se não houver token, redireciona para o início do processo
        if (!token) {
            alert('Token de redefinição não encontrado. Por favor, inicie o processo novamente.');
            window.location.href = 'recuperar_senha.html';
            return; // Interrompe a execução do script
        }

        // 3. Adiciona o listener para o envio do formulário
        resetPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const newPassword = document.getElementById('nova-senha').value;
            const confirmPassword = document.getElementById('confirmar-senha').value;
            const submitButton = resetPasswordForm.querySelector('button[type="submit"]');

            if (!newPassword.trim() || !confirmPassword.trim()) {
                alert('Por favor, preencha os dois campos de senha.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('As senhas não coincidem. Tente novamente.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            try {
                // Usa o token da URL e a nova senha para chamar a API
                const resultMessage = await resetPassword(token, newPassword);
                alert(resultMessage); // Ex: "Senha redefinida com sucesso!"
                // Redireciona para o login após o sucesso
                window.location.href = 'login.html';
            } catch (error) {
                alert(error.message || 'Não foi possível redefinir sua senha. O token pode ter expirado.');
                // Apenas reabilita o botão em caso de erro
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Nova Senha';
            }
        });
    }
});
