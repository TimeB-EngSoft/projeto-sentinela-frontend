import { listarInstituicoes, cadastrarInstituicao } from '../services/apiService.js';

function loadHeaderUserData() {
    const userName = localStorage.getItem('userName');
    const headerName = document.getElementById('headerUserName');
    if (headerName) {
        headerName.textContent = userName || 'Usuário';
    }

    const avatar = document.getElementById('headerUserAvatar');
    if (avatar) {
        if (userName) {
            avatar.classList.remove('avatar-placeholder');
            avatar.innerHTML = `<span>${userName.charAt(0).toUpperCase()}</span>`;
            avatar.style.backgroundColor = 'var(--color-light-beige)';
            avatar.style.color = 'var(--color-dark-brown)';
        } else {
            avatar.classList.add('avatar-placeholder');
            avatar.innerHTML = '<i class="fas fa-user"></i>';
            avatar.style.backgroundColor = '';
            avatar.style.color = '';
        }
    }
}

function setupSidebarToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    document.addEventListener('click', (event) => {
        if (sidebar && sidebar.classList.contains('open')) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnMenuToggle = menuToggle ? menuToggle.contains(event.target) : false;

            if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function setFeedback(message, type = 'info') {
    const feedback = document.getElementById('institutionsFeedback');
    if (!feedback) return;

    const stateClass = type === 'error' ? 'is-error' : 'is-info';
    feedback.className = ['card', 'empty-card', stateClass].join(' ');
    feedback.textContent = message;
    feedback.dataset.state = type;
    feedback.style.display = message ? 'block' : 'none';
}

function formatLocation(instituicao) {
    const cidade = instituicao?.cidade || instituicao?.municipio;
    const estado = instituicao?.estado || instituicao?.uf;
    const partes = [cidade, estado].filter(Boolean);
    if (!partes.length && instituicao?.endereco) return instituicao.endereco;
    return partes.join(' - ') || 'Localização não informada';
}

function buildInstitutionCard(instituicao) {
    const tipo = instituicao?.tipo || instituicao?.categoria || 'Instituição';
    const sigla = instituicao?.sigla || instituicao?.nomeCurto || instituicao?.nome || 'Instituição';
    const nome = instituicao?.nome || instituicao?.razaoSocial || sigla;
    const gestor = instituicao?.gestorResponsavel || instituicao?.gestor || '—';

    // Ajusta o tipo com base nos campos disponíveis
    const tipoReal = instituicao.areaAtuacao || tipo;

    return `
        <article class="institution-card card">
            <div class="inst-card-header">
                <div class="inst-card-id">
                    <div class="inst-card-icon"><i class="fas fa-landmark"></i></div>
                    <div class="inst-card-title">
                        <h3>${sigla}</h3>
                        <div class="inst-card-tags">
                            <span class="tag tag-neutral">${tipoReal}</span>
                        </div>
                    </div>
                </div>
                <button class="icon-button" title="Mais opções"><i class="fas fa-ellipsis-v"></i></button>
            </div>
            <p class="inst-card-fullname">${nome}</p>
            <p class="inst-card-location"><i class="fas fa-map-marker-alt"></i> ${formatLocation(instituicao)}</p>
            <div class="inst-card-stats">
                <div class="stat-item">
                    <span>${instituicao?.totalUsuarios ?? '—'}</span>
                    <p><i class="fas fa-users"></i> Usuários</p>
                </div>
                <div class="stat-item">
                    <span>${instituicao?.totalConflitos ?? '—'}</span>
                    <p><i class="fas fa-exclamation-triangle"></i> Conflitos</p>
                </div>
            </div>
            <div class="inst-card-footer">
                <small>Gestor Responsável</small>
                <p>${gestor}</p>
            </div>
        </article>
    `;
}

async function loadInstitutions() {
    const container = document.getElementById('institutionsContainer');
    if (!container) return;

    setFeedback('Carregando instituições...', 'info');
    container.innerHTML = '';

    try {
        const institutions = await listarInstituicoes();
        if (!Array.isArray(institutions) || institutions.length === 0) {
            setFeedback('Nenhuma instituição encontrada no momento.', 'info');
            return;
        }

        setFeedback('', 'info'); // Limpa o feedback
        container.innerHTML = institutions.map(buildInstitutionCard).join('');
    } catch (error) {
        console.error('Erro ao carregar instituições:', error);
        setFeedback(error?.message || 'Não foi possível carregar as instituições agora.', 'error');
    }
}


// ##################################################################
// ##               LÓGICA DO MODAL (CADASTRAR)                  ##
// ##################################################################

/**
 * Configura os listeners para abrir, fechar e enviar o modal de cadastro.
 */
function setupModalListeners() {
    const modal = document.getElementById('add-institution-modal');
    const openButton = document.getElementById('addInstitutionButton');
    const closeButton = document.getElementById('modal-inst-close-button');
    const cancelButton = document.getElementById('modal-inst-cancel-button');
    const form = document.getElementById('add-institution-form');

    if (!modal || !openButton || !closeButton || !cancelButton || !form) {
        console.warn('Elementos do modal de cadastro não encontrados.');
        return;
    }

    // Abrir o modal
    openButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Função para fechar o modal
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    
    // Fechar ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // Listener de submit do formulário
    form.addEventListener('submit', handleRegisterSubmit);
}

/**
 * Lida com o envio do formulário de cadastro de instituição.
 */
async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('modal-inst-submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    // Coleta os dados do formulário
    const instituicaoData = {
        nome: document.getElementById('inst-nome').value,
        sigla: document.getElementById('inst-sigla').value,
        cnpj: document.getElementById('inst-cnpj').value,
        email: document.getElementById('inst-email').value,
        telefone: document.getElementById('inst-telefone').value,
        areaAtuacao: document.getElementById('inst-area').value,
        descricao: document.getElementById('inst-descricao').value,
    };

    try {
        // Chama a API
        const novaInstituicao = await cadastrarInstituicao(instituicaoData);
        
        alert(`Instituição "${novaInstituicao.nome}" cadastrada com sucesso!`);
        
        // Fecha o modal
        document.getElementById('modal-inst-close-button').click();
        
        // Recarrega a lista de instituições para mostrar a nova
        await loadInstitutions();

    } catch (error) {
        console.error('Erro ao cadastrar instituição:', error);
        alert(`Erro: ${error.message || 'Não foi possível cadastrar a instituição.'}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Instituição';
    }
}


// ##################################################################
// ##                  INICIALIZAÇÃO DA PÁGINA                     ##
// ##################################################################

function bootstrap() {
    loadHeaderUserData();
    setupSidebarToggle();
    loadInstitutions();
    setupModalListeners(); // Adiciona o listener do modal
}

document.addEventListener('DOMContentLoaded', bootstrap);   