// js/pages/perfil.js 

import { updateUser, updatePassword, getUserData } from '../services/apiService.js'; // 1. Importe a nova função

document.addEventListener('DOMContentLoaded', function() {

    // Função para carregar dados iniciais do localStorage enquanto busca os dados atualizados da API
    function loadInitialDataFromStorage() {
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        const userCargo = localStorage.getItem('userCargo');
        const userInstituicao = localStorage.getItem('userInstituicao');

        // Preenche o cabeçalho principal
        document.getElementById('headerUserName').textContent = userName || 'Usuário';
        const roleElement = document.getElementById('headerUserRole');
        if (roleElement) {
            roleElement.textContent = userCargo || '';
        }

        // Preenche a seção de informações do perfil
        document.getElementById('profileName').textContent = userName || 'Carregando...';
        document.getElementById('profileRole').textContent = userCargo || '';
        document.getElementById('profileInstitution').textContent = userInstituicao || '';

        // Preenche os campos do formulário
        document.getElementById('nome').value = userName || '';
        document.getElementById('email').value = userEmail || '';
        document.getElementById('cargo').value = userCargo || '';
        document.getElementById('instituicao').value = userInstituicao || '';
    }

    async function fetchAndDisplayLatestUserData() {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Erro de autenticação: ID do usuário não encontrado. Por favor, faça login novamente.');
            window.location.href = '../authentication/login.html';
            return;
        }

        try {
            // Busca os dados mais recentes do usuário da API
            const user = await getUserData(userId);

            // Atualiza o localStorage com os dados mais recentes
            localStorage.setItem('userName', user.nome);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userCargo', user.cargo);
            localStorage.setItem('userInstituicao', user.instituicao?.nome || '');

            // Re-chama a função de carregar dados para garantir que a tela inteira seja atualizada
            loadInitialDataFromStorage();

        } catch (error) {
            console.error('Falha ao buscar dados atualizados do usuário:', error);
            // Não mostramos um alerta de erro aqui para não interromper o usuário,
            // pois a tela já está com os dados do localStorage.
        }
    }

    loadInitialDataFromStorage();       // Executa primeiro para carregar a tela instantaneamente
    fetchAndDisplayLatestUserData();    // Executa em seguida para buscar e atualizar os dados


    // ====== Atualizar Perfil ======
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = profileForm.querySelector('button[type="submit"]');
            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert('Erro de autenticação: ID do usuário não encontrado.');
                return;
            }

            // CORREÇÃO: Pega os valores diretamente dos elementos no momento do envio
            const userData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                instituicaoNome: document.getElementById('instituicao').value,
                cargo: document.getElementById('cargo').value.toUpperCase().replace(/ /g, '_')
            };

            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            try {
                const result = await updateUser(userId, userData);
                
                // Atualiza o localStorage com os dados retornados pela API
                localStorage.setItem('userName', result.nome);
                localStorage.setItem('userEmail', result.email);
                localStorage.setItem('userCargo', result.cargo);
                localStorage.setItem('userInstituicao', result.instituicao?.nome || '');

                // CORREÇÃO: Chama a função correta para recarregar os dados na tela
                loadInitialDataFromStorage(); 
                alert('Perfil atualizado com sucesso!');

            } catch (error) {
                alert('Erro ao salvar: ' + (error.message || 'Falha na comunicação com o servidor.'));
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Alterações';
            }
        });
    }

    // ====== Alterar Senha (lógica existente, sem alterações) ======
    const passwordForm = document.querySelector('.password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const senhaAtual = document.getElementById('senhaAtual').value.trim();
            const novaSenha = document.getElementById('novaSenha').value.trim();
            const confirmarSenha = document.getElementById('confirmarSenha').value.trim();

            if (!senhaAtual || !novaSenha || !confirmarSenha) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            if (novaSenha !== confirmarSenha) {
                alert('As senhas não coincidem.');
                return;
            }

            try {
                const userId = localStorage.getItem('userId');
                const message = await updatePassword(userId, senhaAtual, novaSenha);
                alert(message || 'Senha atualizada com sucesso!');
                passwordForm.reset();
            } catch (error) {
                alert('Erro ao atualizar senha: ' + error.message);
            }
        });
    }
});
