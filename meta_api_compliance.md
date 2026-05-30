# Conformidade do Aplicativo com a API do WhatsApp Business Messaging (Meta)

## Visão geral
Este documento resume como o aplicativo **WhatsMiau2** utiliza a permissão `whatsapp_business_messaging` da Meta, demonstra o cumprimento das políticas exigidas e fornece evidências de teste.

---

## 1. Uso da permissão `whatsapp_business_messaging`
- **Embedded Signup (Cadastro Incorporado)** – inicia o fluxo de registro usando `FB.login` com `response_type=code`. O código devolvido é trocado por um **access token** que contém a permissão `whatsapp_business_messaging`.
- **Adicionar números de telefone** – chamada `POST /{business_id}/add_phone_numbers` para registrar números pré‑verificados no WhatsApp Business Account (WABA).
- **Envio de mensagens transacionais** – uso do endpoint `/v25.0/<WHATSAPP_BUSINESS_ACCOUNT_ID>/messages` para enviar notificações como boas‑vindas, confirmação de inscrição e atualizações de status.

---

## 2. Conformidade com as políticas da Meta
| Política da Meta | Como o aplicativo cumpre |
|------------------|--------------------------|
| **Opt‑in explícito** | O usuário só recebe mensagens após concluir o fluxo de cadastro e aceitar os termos. O backend valida o campo `user_consent: true` antes de enviar qualquer mensagem. |
| **Mensagens transacionais apenas** | Enviamos apenas notificações de serviço (confirmação de cadastro, status de pedido). Não há mensagens promocionais. |
| **Limite de 24 h** | Respeitamos o limite de 1 mensagem por 24 h para usuários que não iniciaram a conversa. |
| **Proteção de dados** | Tokens e números de telefone são armazenados exclusivamente no backend (variáveis de ambiente). Não são expostos ao frontend. |
| **Revisão de conteúdo** | Cada mensagem passa por validação de tamanho (≤ 1024 caracteres) e formato antes do envio. |
| **Uso de endpoints aprovados** | Utilizamos apenas os endpoints documentados: `add_phone_numbers`, `exchange-code`, `messages` e `prefill` (GET). |

---

## 3. Experiência do usuário (screencast)
1. Usuário acessa a página e clica em **"Cadastrar WhatsApp"**.
2. `launchWhatsAppSignup()` chama `FB.login` e o usuário autoriza a aplicação.
3. O backend troca o `code` por um token com escopo `whatsapp_business_messaging`.
4. O backend gera o JSON de pré‑preenchimento, o codifica em Base64 e redireciona para `https://wa.me/<CONFIG_ID>?prefill_data=...`.
5. O formulário do WhatsApp aparece já preenchido (nome da empresa, e‑mail, telefone, etc.).
6. Usuário completa o cadastro; o WhatsApp confirma ao backend.
7. O backend envia uma mensagem de boas‑vindas utilizando a API de mensagens.

> **Screencast**: gravado com a Xbox Game Bar (30‑45 s) e incluído na submissão da Meta.

---

## 4. Testes de API realizados
- `GET /me/businesses` – verifica o `business_id` correto.
- `POST /{business_id}/add_phone_numbers` – adiciona o número `+5588994227586` (200 OK).
- `GET /api/whatsapp/prefill` – devolve JSON válido conforme `docs/whatsapp_pre_fill.md`.
- `POST /api/whatsapp/exchange-code` – troca o `code` por `access_token` contendo `whatsapp_business_messaging`.
- `POST /{whatsapp_business_account_id}/messages` – envia mensagem de boas‑vindas de teste (recebida com sucesso).

---

## 5. Declaração de conformidade
> **Eu, desenvolvedor responsável pelo repositório `whatsmiau2`, declaro que o aplicativo cumpre integralmente as políticas de uso permitido da permissão `whatsapp_business_messaging` da Meta.**
> - Consentimento explícito do usuário é obtido antes de qualquer mensagem. 
> - Só enviamos mensagens transacionais. 
> - Dados sensíveis permanecem protegidos no backend. 
> - Todos os endpoints exigidos foram testados com sucesso.

---

*Documento gerado em 26 de maio de 2026.*
