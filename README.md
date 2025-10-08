# DOCUMENTO DE VISÃO DO PRODUTO - Studify

**Autor:** William (revisado e atualizado pela IA)
**Data:** agosto/2025
**Versão:** 2.0

---

## 1. REQUISITOS

### 1.1 Concepção dos Requisitos

#### 1.1.1 Identificação do Domínio

**Domínio:** Educação / Produtividade Pessoal — gerenciamento de tempo e atividades de estudo via aplicação web.

**Objetivo do produto:**
Desenvolver uma aplicação web responsiva (Next.js) para estudantes que auxilie no planejamento e execução de sessões de estudo. A aplicação incluirá timers (ex.: Pomodoro), lembretes, acompanhamento de progresso e relatórios de uso do tempo. O objetivo é aumentar a produtividade, reduzir procrastinação e melhorar o desempenho acadêmico.

**Problema identificado:**
Estudantes frequentemente têm dificuldade para organizar horários de estudo, priorizar tarefas e manter o foco. Essas dificuldades levam a estresse e baixa eficiência.

**Público‑alvo:**
Estudantes de ensino médio e superior que buscam ferramentas para planejar e controlar sessões de concentração.

---

### 1.2 Elicitação dos Requisitos

#### 1.2.1 Requisitos Funcionais (RF)

| ID   | Requisito                               | Prioridade | Status       |
| ---- | --------------------------------------- | ---------- | ------------ |
| RF01 | Gerenciar Conta com Provedor Google     | Must       | Implementado |
| RF02 | Criar e Gerenciar Atividades de Estudo  | Must       | Implementado |
| RF03 | Timer / Sessões de Estudo (Pomodoro)    | Must       | Implementado |
| RF04 | Histórico e Relatórios de Uso           | Should     | Implementado |
| RF05 | Preferências e Configurações do Usuário | Should     | Implementado |
| RF06 | Privacidade e Controle de Dados (LGPD)  | Must       | A Fazer      |

#### 1.2.2 Requisitos Não‑Funcionais (RNF)

| ID    | Requisito                        | Prioridade | Status       |
| ----- | -------------------------------- | ---------- | ------------ |
| RNF01 | Responsividade e Usabilidade     | Must       | Implementado |
| RNF02 | Compatibilidade de Navegadores   | Must       | Implementado |
| RNF03 | Persistência e Banco de Dados    | Must       | Implementado |
| RNF04 | Segurança de Autenticação        | Must       | Implementado |
| RNF05 | Criptografia em Trânsito (HTTPS) | Must       | Implementado |
| RNF06 | Performance                      | Should     | Implementado |

---

### 1.3 Especificação dos Requisitos — Histórias de Usuário (Revisadas)

#### Épico A — Gerenciar Conta e Acesso (RF01)

**HU-A1 — Login ou Cadastro com Conta Google**

- **Como:** um usuário novo ou existente,
- **Eu quero:** usar minha conta Google para acessar a aplicação,
- **Para que:** eu possa acessar minha conta de forma rápida e segura, sem precisar de senha.
- **Critérios de aceite:**
  - Dado que o usuário clica em "Sign in with Google", quando autoriza o acesso, então ele é autenticado com sucesso e redirecionado para o dashboard.
  - Dado que a autenticação falha, então uma mensagem de erro é exibida.
- **Priorização:** Must

#### Épico B — Gerenciar Atividades de Estudo (RF02)

**HU-B1 — Criar, Editar e Excluir Atividades**

- **Como:** um usuário autenticado,
- **Eu quero:** poder adicionar, modificar e remover atividades de estudo, especificando título, matéria, duração e prioridade,
- **Para que:** organizar meu plano de estudos.
- **Priorização:** Must

#### Épico C — Timer e Sessões de Estudo (RF03)

**HU-C1 — Iniciar uma Sessão de Estudo (Pomodoro)**

- **Como:** um usuário autenticado,
- **Eu quero:** selecionar uma atividade e iniciar um timer Pomodoro para focar no meu estudo,
- **Para que:** executar minhas tarefas sem distração e registrar meu tempo de foco.
- **Priorização:** Must

---

### 1.4 Projeto Técnico (Revisado)

#### 1.4.1 Tecnologias e Ferramentas

| Tecnologia / Ferramenta       | Objetivo                                           |
| ----------------------------- | -------------------------------------------------- |
| **Next.js**                   | Frontend (React) e UI do lado do servidor.         |
| **TypeScript**                | Linguagem estática para maior segurança do código. |
| **Firebase Firestore**        | Banco de dados NoSQL para persistência de dados.   |
| **Firebase Authentication**   | Serviço de autenticação (Google Sign-In).          |
| **Genkit (Google AI)**        | Toolkit para funcionalidades de IA.                |
| **ShadCN UI & Tailwind**      | Componentes de UI e estilização.                   |
| **Vercel / Firebase Hosting** | Plataforma de deploy e CI/CD.                      |
| **Lucide React**              | Biblioteca de ícones.                              |

#### 1.4.2 Modelo de Dados (Firestore)

Utilizamos uma estrutura NoSQL baseada em coleções.

- **`activities` (Coleção)**

  - `userId` (string)
  - `title` (string)
  - `subject` (string)
  - `estimatedDuration` (number)
  - `priority` (string: 'low', 'medium', 'high')
  - `status` (string: 'todo', 'in-progress', 'done')

- **`studySessions` (Coleção)**
  - `userId` (string)
  - `activityId` (string)
  - `startTime` (timestamp)
  - `endTime` (timestamp)
  - `duration` (number)
  - `subject` (string)

**Observação:** O `userId` é usado para garantir que os dados de cada usuário sejam consultados de forma segura e eficiente, aplicando regras de segurança do Firestore.
