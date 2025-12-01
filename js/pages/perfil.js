import { getUserData, updateUser, updatePassword } from '../services/apiService.js'; 
import { getCurrentUser } from '../services/authService.js';

export async function init() {
    await loadProfileData();
    setupProfileForm();
    setupAvatarUpload();
}

// Função de Toast local (caso não exista global)
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; // Assume que o container existe no layout principal
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="toast-content">
            <span class="toast-title">${type === 'success' ? 'Sucesso' : 'Atenção'}</span>
            <span class="toast-message">${message}</span>
        </div>`;
        
    container.appendChild(toast);
    
    // Animação de entrada
    requestAnimationFrame(() => toast.classList.add('show'));
    
    // Remoção automática
    setTimeout(() => { 
        toast.classList.remove('show'); 
        setTimeout(() => toast.remove(), 300); 
    }, 3500);
}

async function loadProfileData() {
    const userLocal = getCurrentUser(); // Pega ID do localStorage
    if(!userLocal || !userLocal.id) return;

    try {
        const user = await getUserData(userLocal.id);
        
        // 1. Preencher Cabeçalho do Perfil
        document.getElementById('profileName').textContent = user.nome;
        document.getElementById('profileRoleBadge').textContent = formatRole(user.cargo);
        
        const instBadge = document.getElementById('profileInstBadge');
        if(user.instituicaoNome) {
            instBadge.style.display = 'inline-flex';
            instBadge.textContent = user.instituicaoNome;
        } else {
            instBadge.style.display = 'none';
        }

        // 2. Preencher Formulário
        setValue('nome', user.nome);
        setValue('email', user.email);
        setValue('telefone', user.telefone);
        setValue('cpf', user.cpf);
        setValue('cargo', formatRole(user.cargo));
        setValue('instituicao', user.instituicaoNome || 'Sem Vínculo / Secretaria');

        // 3. Carregar foto (Simulação via LocalStorage para persistência no navegador)
        const savedImg = localStorage.getItem('profile_avatar_' + user.id);
        if(savedImg) {
            const imgEl = document.getElementById('profileImage');
            if(imgEl) imgEl.src = savedImg;
        }

    } catch(e) {
        console.error(e);
        showToast('Não foi possível carregar os dados do perfil.', 'error');
    }
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if(el) el.value = value || '';
}

function formatRole(role) {
    if(!role) return 'Usuário';
    return role.replace(/_/g, ' ');
}

function setupProfileForm() {
    const form = document.querySelector('.profile-form');
    if(!form) return;
    
    // Clona o formulário para remover listeners antigos ao navegar entre páginas
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = newForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        
        btn.disabled = true; 
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        const userLocal = getCurrentUser();
        const nome = document.getElementById('nome').value;
        const telefone = document.getElementById('telefone').value;
        const senhaAtual = document.getElementById('senhaAtual').value;
        const novaSenha = document.getElementById('novaSenha').value;

        try {
            // 1. Atualizar Dados Cadastrais
            await updateUser(userLocal.id, { nome, telefone });
            
            // Atualiza nome no menu lateral/header se existir
            const headerName = document.getElementById('headerUserName');
            if(headerName) headerName.textContent = nome;

            // 2. Atualizar Senha (se preenchido)
            if (senhaAtual || novaSenha) {
                if(!senhaAtual || !novaSenha) {
                    throw new Error("Para alterar a senha, preencha a senha atual e a nova.");
                }
                await updatePassword(userLocal.id, senhaAtual, novaSenha);
                
                // Limpa campos de senha após sucesso
                document.getElementById('senhaAtual').value = '';
                document.getElementById('novaSenha').value = '';
                showToast('Perfil e senha atualizados com sucesso!');
            } else {
                showToast('Dados de perfil atualizados!');
            }

        } catch(err) {
            showToast(err.message || 'Erro ao atualizar perfil.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

function setupAvatarUpload() {
    const input = document.getElementById('uploadAvatarInput');
    if(!input) return;

    // Remove listener antigo
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    newInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            // Verifica tamanho (ex: max 2MB)
            if(file.size > 2 * 1024 * 1024) {
                showToast('A imagem deve ter no máximo 2MB.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                const result = evt.target.result;
                
                // 1. Atualiza na tela de perfil
                document.getElementById('profileImage').src = result;
                
                // 2. Salva no localStorage (Simulando banco de dados)
                const userLocal = getCurrentUser();
                if(userLocal && userLocal.id) {
                    localStorage.setItem('profile_avatar_' + userLocal.id, result);
                }
                
                // 3. Atualiza no Header (Avatar pequeno) se existir
                const headerAvatar = document.querySelector('#headerUserAvatar img'); // Se for <img>
                const headerAvatarDiv = document.querySelector('.user-avatar'); // Se for div background ou texto
                
                if(headerAvatar) {
                    headerAvatar.src = result;
                } else if (headerAvatarDiv) {
                    // Se o header usar iniciais, substitui por imagem
                    headerAvatarDiv.innerHTML = `<img src="${result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                    headerAvatarDiv.style.background = 'none';
                    headerAvatarDiv.textContent = '';
                }
                
                showToast('Foto de perfil atualizada!');
            }
            reader.readAsDataURL(file);
        }
    });
}