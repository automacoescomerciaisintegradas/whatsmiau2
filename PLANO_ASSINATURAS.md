# 📋 Roteiro de Implementação: Sistema de Assinaturas e Automação WhatsApp

Este documento detalha o plano de execução passo a passo para implementar o painel de assinaturas com controle automático de acesso e notificações via WhatsApp no **WhatsMiau2**.

> **Objetivo:** Automatizar a gestão de assinantes, bloqueando automaticamente inadimplentes e enviando notificações via WhatsApp API.

---

## 🏗️ Fase 1: Modelagem de Dados e Banco de Dados

### 1.1. Criar Tabelas de Assinatura
**Finalidade:** Armazenar planos, status de assinaturas e histórico de pagamentos.
**Arquivos para Modificar:**
- Criar nova migration SQL (ex: `internal/database/migrations/00X_subscriptions.sql`)
- Atualizar models em `internal/database/models.go`

**Tarefas:**
1.  **Tabela `plans`**:
    -   `id`, `name`, `price`, `duration_days`, `features` (JSON), `active`.
2.  **Tabela `subscriptions`**:
    -   `id`, `user_id`, `plan_id`, `status` (active, pending, cancelled, past_due), `start_date`, `next_billing_date`, `payment_provider_id`.
3.  **Tabela `payments`**:
    -   `id`, `subscription_id`, `amount`, `status`, `transaction_id`, `created_at`.
4.  **Alterar Tabela `users`**:
    -   Adicionar coluna `is_subscriber` (boolean) e `subscription_status`.

### 1.2. Integração com GORM (Go)
**Finalidade:** Mapear as novas tabelas para structs Go.
**Arquivos:** `internal/database/structs.go`
**Validação:** Verificar se as migrations rodam sem erros ao iniciar o backend.

---

## ⚙️ Fase 2: Backend - Lógica de Negócio (Go)

### 2.1. Serviço de Assinaturas
**Finalidade:** Gerenciar o ciclo de vida da assinatura.
**Local:** `internal/crm/subscription_service.go` (Novo arquivo)

**Funcionalidades:**
1.  **`CreateSubscription`**: Associar usuário a um plano.
2.  **`CheckAccess`**: Middleware para verificar se o usuário está ativo antes de liberar recursos premium.
3.  **`CancelSubscription`**: Marcar status como cancelado e programar remoção de acesso.

### 2.2. Webhooks de Pagamento (O Coração da Automação)
**Finalidade:** Receber notificações do gateway (Stripe/MercadoPago/ASAAS) para ativar/desativar contas automaticamente.
**Local:** `internal/handlers/webhook_payment.go` (Novo arquivo)

**Lógica de Execução:**
-   **Evento `payment.succeeded`**:
    -   Buscar `subscription` pelo ID.
    -   Atualizar `status` para `active`.
    -   Estender `next_billing_date`.
    -   Enviar mensagem WhatsApp de confirmação.
-   **Evento `payment.failed` ou `subscription.canceled`**:
    -   Atualizar `status` para `inactive` ou `past_due`.
    -   **Ação Crítica:** Atualizar tabela `users` definindo `is_subscriber = false`.
    -   Enviar mensagem WhatsApp de aviso/cobrança.

### 2.3. Integração WhatsApp AP (Notification Service)
**Finalidade:** Enviar mensagens transacionais baseadas em eventos de assinatura.
**Utilização da API Existente:**
-   Usar a função interna correspondente ao curl: `https://HOST/message/sendText`

**Tarefas:**
1.  Criar `internal/services/notifier.go`.
2.  Implementar métodos:
    -   `NotifyWelcome(phone, name)`
    -   `NotifyPaymentReceived(phone, amount)`
    -   `NotifyAccessRevoked(phone, reason)`
3.  Assegurar que essas notificações usem a "Instância do Sistema" (Admin) definida no `.env`.

---

## 💻 Fase 3: API Endpoints (Backend Go -> Frontend Node)

Expor rotas para o frontend consumir.
**Arquivos:** `internal/server/server.go` e `internal/handlers/subscription_handler.go`

**Endpoints Necessários:**
1.  `GET /v1/plans`: Listar planos disponíveis.
2.  `GET /v1/subscription/me`: Status da assinatura do usuário logado.
3.  `POST /v1/subscription/checkout`: Criar link de pagamento para um plano.
4.  `POST /v1/webhook/payment`: Endpoint público para receber callbacks do Gateway.
5.  `POST /v1/admin/subscription/:id/cancel`: Cancelamento manual por admin.

---

## 🖥️ Fase 4: Frontend - Painel de Assinatura

### 4.1. Página de Assinatura ("Minha Conta")
**Finalidade:** Usuário visualizar seu status e invoices.
**Arquivo:** `public/subscription.html` (Novo) / `public/assets/js/subscription.js`

**Elementos:**
-   Card com status atual (Ativo/Inativo).
-   Botão "Gerenciar Assinatura" ou "Assinar Agora".
-   Lista de Planos (se não assinante).
-   Integração com o endpoint `checkout` para redirecionar ao gateway.

### 4.2. Bloqueio de UI
**Finalidade:** Impedir acesso visual a recursos premium para não pagantes.
**Arquivo:** `public/assets/js/auth.js` ou `check_access.js`

**Lógica:**
-   Ao carregar o Dashboard, verificar flag `user.is_subscriber`.
-   Se `false`, ocultar menus (Disparador, CRM) e mostrar banner "Faça Upgrade".

### 4.3. Landing Page de Vendas (Incorporada)
**Finalidade:** Usar o texto de marketing fornecido.
**Arquivo:** `public/plans.html` ou seção em `home.html`.

**Conteúdo:**
-   Inserir copy "Potencialize a Experiência dos Seus Clientes".
-   Mostrar diferencial da integração com WhatsApp.

---

## 🧪 Fase 5: Validação e Testes

### 5.1. Teste de Fluxo de Pagamento
1.  Simular webhook de `payment.succeeded`.
2.  **Verificar:** Usuário passa de inativo para ativo no banco.
3.  **Verificar:** Mensagem de WhatsApp chega no número do usuário.

### 5.2. Teste de Inadimplência (Auto-Exclusão)
1.  Simular webhook de `subscription.past_due`.
2.  **Verificar:** Acesso do usuário é revogado imediatamente.
3.  **Verificar:** Mensagem de "Renove seu plano para continuar" enviada.

### 5.3. Teste de Interface
1.  Logar com usuário Free -> Tentar acessar rotas Premium -> Deve ser bloqueado.
2.  Logar com usuário Premium -> Acesso liberado.

---

## 📝 Resumo de Dependências
-   **Gateway de Pagamento:** **Mercado Pago** (Configurado no `.env`).
    -   Webhooks processarão eventos como `payment.created` e `payment.updated`.
-   **Instância Admin WhatsApp:** **Evolution API** (Configurado no `.env`).
    -   Endpoint: `https://evolution.automacoescomerciais.com.br`
    -   Instância: `pagamentos`
    -   Uso: Envio de comprovantes e avisos de cobrança.
