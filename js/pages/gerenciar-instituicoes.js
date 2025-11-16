import { listarInstituicoes } from '../services/apiService.js';

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

    return `
        <article class="institution-card card">
            <div class="inst-card-header">
                <div class="inst-card-id">
                    <div class="inst-card-icon"><i class="fas fa-landmark"></i></div>
                    <div class="inst-card-title">
                        <h3>${sigla}</h3>
                        <div class="inst-card-tags">
                            <span class="tag tag-neutral">${tipo}</span>
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

        setFeedback('', 'info');
        container.innerHTML = institutions.map(buildInstitutionCard).join('');
    } catch (error) {
        console.error('Erro ao carregar instituições:', error);
        setFeedback(error?.message || 'Não foi possível carregar as instituições agora.', 'error');
    }
}

function bootstrap() {
    loadHeaderUserData();
    setupSidebarToggle();
    loadInstitutions();
}

document.addEventListener('DOMContentLoaded', bootstrap);