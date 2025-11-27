import { getUserData, updateUser, updatePassword } from '../services/apiService.js'; 

export async function init() {
    await loadProfileData();
    setupProfileForm();
    setupAvatarUpload();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><div class="toast-content"><span class="toast-title">${type === 'success' ? 'Sucesso' : 'Erro'}</span><span class="toast-message">${message}</span></div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

async function loadProfileData() {
    const userId = localStorage.getItem('userId');
    if(!userId) return;

    try {
        const user = await getUserData(userId);
        
        // Header Info
        document.getElementById('profileName').textContent = user.nome;
        document.getElementById('profileRoleBadge').textContent = user.cargo.replace(/_/g, ' ');
        
        if(user.instituicaoNome) {
            const instBadge = document.getElementById('profileInstBadge');
            instBadge.style.display = 'inline-flex';
            instBadge.textContent = user.instituicaoNome;
        }

        // Form Fields
        document.getElementById('nome').value = user.nome || '';
        document.getElementById('email').value = user.email || ''; // Disabled no HTML
        document.getElementById('telefone').value = user.telefone || '';
        document.getElementById('cpf').value = user.cpf || ''; // Disabled no HTML
        
        // Campos Travados
        document.getElementById('cargo').value = user.cargo.replace(/_/g, ' ');
        document.getElementById('instituicao').value = user.instituicaoNome || 'Secretaria';

        // Carregar foto salva (Simulação via localStorage)
        const savedImg = localStorage.getItem('profile_avatar_' + userId);
        if(savedImg) {
            document.getElementById('profileImage').src = savedImg;
        }

    } catch(e) {
        showToast('Erro ao carregar perfil', 'error');
    }
}

function setupProfileForm() {
    const form = document.querySelector('.profile-form');
    if(!form) return;
    
    // Clona para limpar listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = newForm.querySelector('button[type="submit"]');
        btn.disabled = true; 
        
        const userId = localStorage.getItem('userId');
        const nome = document.getElementById('nome').value;
        const telefone = document.getElementById('telefone').value;
        const senhaAtual = document.getElementById('senhaAtual').value;
        const novaSenha = document.getElementById('novaSenha').value;

        try {
            // 1. Atualiza Dados Básicos
            await updateUser(userId, { nome, telefone });
            localStorage.setItem('userName', nome);
            document.getElementById('headerUserName').textContent = nome;

            // 2. Atualiza Senha (se preenchida)
            if (senhaAtual && novaSenha) {
                await updatePassword(userId, senhaAtual, novaSenha);
                showToast('Perfil e senha atualizados com sucesso!');
                // Limpa campos de senha
                document.getElementById('senhaAtual').value = '';
                document.getElementById('novaSenha').value = '';
            } else {
                showToast('Dados de perfil atualizados!');
            }

        } catch(err) {
            showToast(err.message || 'Erro ao atualizar.', 'error');
        } finally {
            btn.disabled = false;
        }
    });
}

function setupAvatarUpload() {
    const input = document.getElementById('uploadAvatarInput');
    if(!input) return;

    // Remove listener antigo clonando input
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    newInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Atualiza visualmente
                document.getElementById('profileImage').src = e.target.result;
                
                // Salva no localStorage para persistir (Simulação)
                const userId = localStorage.getItem('userId');
                localStorage.setItem('profile_avatar_' + userId, e.target.result);
                
                // Tenta atualizar o header também
                const headerAvatar = document.querySelector('#headerUserAvatar');
                if(headerAvatar) {
                    headerAvatar.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                }
                
                showToast('Foto de perfil atualizada!');
            }
            reader.readAsDataURL(file);
        }
    });
}