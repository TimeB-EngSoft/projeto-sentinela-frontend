# 🌍 Projeto Sentinela

## 🧭 Visão Geral

O **Projeto Sentinela** tem como objetivo desenvolver uma **ferramenta de mapeamento georreferenciado e monitoramento de conflitos agrários coletivos** no estado de **Pernambuco**.  
A iniciativa atende a uma demanda da **Secretaria de Justiça, Direitos Humanos e Prevenção à Violência (SJDH-PE)**, buscando aprimorar a gestão desses conflitos, promover a **justiça social** e contribuir para o **desenvolvimento sustentável**.

O sistema será composto por módulos de cadastro, gestão, validação e visualização de dados, com **níveis de acesso hierárquicos** e uma **área pública** para consulta de informações e envio de denúncias.

---

## 🎯 Objetivos do Projeto

- Criar uma **plataforma web segura e integrada** para registrar e acompanhar conflitos agrários.  
- Disponibilizar **painéis interativos** de visualização de dados e indicadores.  
- Facilitar o **recebimento de denúncias públicas** e sua validação pelos gestores.  
- Centralizar informações em um **banco de dados unificado**, com possibilidade de importação de bases públicas existentes.

---

## 🧩 Módulos Principais

### 🔐 Autenticação
- Login, logout e recuperação de senha.
- Controle de perfis e níveis de acesso.

### 👥 Usuários
- Auto cadastro e aprovação por níveis superiores.
- CRUD completo de usuários internos.

### 🏛️ Instituições
- Cadastro de instituições (ONGs, secretarias, etc.).
- Associação de gestores e usuários a suas respectivas instituições.

### ⚠️ Denúncias
- Formulário público de envio de denúncias.
- Cadastro interno por funcionários autorizados.
- Fluxo de validação e aprovação das denúncias.

### 🌐 Monitoramento
- Visualização e atualização de status dos conflitos.
- Filtros, buscas e histórico dos registros.

### 📊 Relatórios e Dashboard
- Indicadores gerais e gráficos interativos.
- Exportação de dados em PDF e CSV.
- Mapas georreferenciados dos conflitos.

---

## 🧱 Perfis de Usuário e Hierarquia

| Nível | Permissões Principais |
|-------|------------------------|
| **Secretaria** | Aprovar cadastros de gestores e validar relatórios gerais. |
| **Gestor (Secretaria)** | Aprovar usuários e instituições; validar denúncias. |
| **Gestor (Instituição)** | Aprovar usuários da própria instituição; validar denúncias. |
| **Usuário** | Cadastrar conflitos e denúncias internas. |
| **Público** | Enviar denúncias anônimas e visualizar indicadores. |

---

## 🧮 Casos de Uso Principais

O sistema conta com **35 casos de uso** definidos, incluindo:

- UC01 – Fazer Login  
- UC09 – Criar Nova Denúncia  
- UC15 – Atualizar Status de um Conflito  
- UC21 – Visualizar Mapa Interativo  
- UC25 – Gerar Relatório Consolidado em PDF  
- UC30 – Cadastrar Instituição  

*(Ver lista completa no Plano de Projeto — Seção 2)*

---

## 🧠 Entendimento do Problema (Diagrama de Ishikawa)

O **Diagrama de Causa e Efeito** identificou os principais fatores que agravam a ausência de monitoramento eficaz de conflitos agrários em Pernambuco:

- **Dados:** escassez de informações atualizadas e falta de integração entre bases.  
- **Método:** ausência de protocolos unificados e processos lentos de validação.  
- **Mão de Obra:** falta de capacitação técnica e carência de equipes de campo.  
- **Meio Ambiente:** áreas rurais de difícil acesso e extensão territorial ampla.  
- **Legislação:** insegurança jurídica e resistência em compartilhar informações.  
- **Software:** falta de painéis interativos e alto custo de soluções proprietárias.
---

### 🏗️ Estrutura do Front-end (Projeto Sentinela-Front)
A arquitetura do front-end foi definida como uma Aplicação de Múltiplas Páginas (MPA) com Componentes Dinâmicos. Esta abordagem combina a organização de arquivos HTML distintos para cada seção principal com o poder do JavaScript para renderizar elementos de interface (menus, botões, etc.) de acordo com o perfil do usuário logado.

A estrutura de arquivos foi organizada da seguinte forma:

```
/projeto-sentinela-frontend
│
├── css/
│   ├── style.css
│   └── dashboard.css
├── js/
│   ├── services/
│   │   ├── authService.js
│   │   └── apiService.js
│   ├── components/
│   │   └── navigation.js
│   ├── pages/
│   │   └── dashboard.js
│   └── main.js
├── app/
│   ├── dashboard.html
│   └── conflitos.html
├── login.html
└── index.html
```

## 👨‍💻 Equipe de Desenvolvimento

| Nome | Funções |
|------|----------|
| **Caio Vinícius Marinho** | Dev Back-end (50%), UX/UI (30%), Testador (20%) |
| **Cauã Wallacy Gomes Teodoro** | Dev Front-end (50%), Líder Técnico (30%), UX/UI (10%), Scrum Master (10%) |
| **Danilo de Pádua Walfrido Aguiar** | UX/UI (30%), Scrum Master (30%), Dev Front-end (20%), Testador (20%) |
| **Matheus Guilherme Moreira de Lima** | Dev Back-end (70%), Testador (30%) |
| **Pedro Galdino Gomes do Vale** | Dev Back-end (40%), Front-end (40%), Testador (20%) |
| **Samara Monteiro Xavier** | Dev Back-end (30%), UX/UI (40%), Líder Técnico (30%) |
| **Caio Nogueira de Mello Neto** | Dev Back-end (70%), Testador (30%) |

---

## 🧰 Ferramentas Utilizadas

| Categoria | Ferramentas |
|------------|-------------|
| **Back-end** | Java, Spring Boot |
| **Front-end** | HTML, CSS, JavaScript |
| **Design** | Figma |
| **Comunicação** | Discord, WhatsApp |
| **Controle de Versão** | Git, GitHub |
| **Documentação** | Google Drive, Google Docs |

---

## 🔧 Recursos Técnicos

- **Banco de Dados:** MySQL (com integração via Spring Data JPA)  
- **Hospedagem:** Servidor em nuvem  
- **IDE:** IntelliJ IDEA Ultimate  
- **Frameworks de Teste:** JUnit, Mockito (planejados)  
- **Metodologia:** Scrum  

---

## 🗂️ Comunicação e Gestão

- **Dailies:** 3x por semana (Seg, Qua, Sex)  
- **Reuniões com o Stakeholder:** Semanais  
- **Sprint Planning e Retrospective:** No início e fim de cada sprint  
- **Reuniões de Subgrupos:** 1x por semana (front e back separadamente)

---

## ⚠️ Principais Riscos Identificados

| Risco | Mitigação |
|-------|------------|
| Falta de comunicação | Reuniões regulares e acompanhamento pelo Scrum Master |
| Atrasos nas tarefas | Quebra de tarefas em partes menores e monitoramento |
| Entrega defeituosa | Implementar cultura de testes e code reviews |
| Falha de integração com sistemas externos | Provas de conceito (PoC) antecipadas |
| Violação de LGPD | Políticas claras de acesso e Privacy by Design |

---

## 📆 Cronograma Simplificado

| Data | Entregas | Status |
|------|-----------|--------|
| 08/10/25 | 1° Status Report | Em andamento |
| 20/10/25 | 2° Status Report | Não iniciado |
| 12/11/25 | 3° Status Report | Não iniciado |
| 03/12/25 | 4° Status Report | Não iniciado |

---

## 🧭 Repositórios

- 🔗 **Back-end:** [projeto-backend.git](https://github.com/TimeB-EngSoft/projeto-backend.git)  
- 🔗 **Front-end:** [projeto-frontend.git](https://github.com/TimeB-EngSoft/projeto-frontend.git)  
- 📄 **Documentação:** [Google Drive](https://drive.google.com/drive/folders/1647lsQUz8KhWXxOxqgvxXQYhGF7DI5kc?usp=drive_link)

---

## ⚖️ Licença

Este projeto é de uso acadêmico e institucional, com fins educacionais e de pesquisa, desenvolvido como parte do curso de **Engenharia de Software**.