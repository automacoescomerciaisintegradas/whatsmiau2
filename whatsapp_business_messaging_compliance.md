# Declaração de Conformidade com a Permissão `whatsapp_business_messaging`

## 1. Como o aplicativo utiliza a permissão

- **Fluxo de Cadastro Incorporado (Embedded Signup)**: usamos o endpoint `FB.login` do SDK do Facebook para iniciar o fluxo de registro de empresas no WhatsApp Business. Essa chamada requer a permissão `whatsapp_business_messaging` para criar/gerenciar contas de WhatsApp Business (WABA) e associar números de telefone.
- **Adição de números de telefone**: através da chamada `POST /{business_id}/add_phone_numbers` (exemplo `curl` fornecido) adicionamos números pré‑verificados ao WABA, habilitando‑os a enviar mensagens.
- **Envio de mensagens**: após o registro, o backend pode usar a Graph API (`/v25.0/<WHATSAPP_BUSINESS_ACCOUNT_ID>/messages`) para enviar mensagens **transacionais** (ex.: confirmações de pagamento, atualizações de status) para usuários que optaram por receber comunicações.

## 2. Políticas do `whatsapp_business_messaging`
| Requisito da política | Como atendemos |
|------------------------|----------------|
| **Opt‑in explícito** | O usuário só recebe mensagens após concluir o fluxo de cadastro incorporado e aceitar os termos. O JSON de pré‑preenchimento pode incluir um campo `user_consent: true` que o backend valida antes de enviar mensagens. |
| **Mensagens não promocionais** | Nosso aplicativo envia apenas mensagens **transacionais** (confirmação de inscrição, status de pedido, alertas de entrega). Não enviamos publicidade nem conteúdo promocional. |
| **Limite de mensageria** | Respeitamos o limite de 1 mensagem por 24 h para usuários que não iniciaram a conversa, conforme a guia de qualidade do WhatsApp. |
| **Proteção de dados** | Dados sensíveis (tokens, números de telefone) são armazenados apenas no backend em variáveis de ambiente; nunca são expostos ao frontend. |
| **Revisão de conteúdo** | Antes de enviar, o conteúdo passa por validação de formato e tamanho (máx 1024 caracteres) para garantir conformidade com as políticas de uso. |

## 3. Screencast (experiência de ponta a ponta)
1. **Abertura da página** – usuário navega ao nosso site e vê o botão **"Cadastrar WhatsApp"**.
2. **Clique no botão** – o script `whatsapp_signup.js` chama `launchWhatsAppSignup()` que executa `FB.login` com `response_type=code`.
3. **Tela de autorização do Facebook** – usuário autoriza a aplicação.
4. **Callback** – recebemos o `code`, enviamos ao backend (`/api/whatsapp/exchange-code`).
5. **Redirecionamento** – o backend devolve a URL de cadastro já preenchida (`prefill_data` em Base64). O navegador redireciona para `https://wa.me/<CONFIGURATION_ID>?prefill_data=...`.
6. **Formulário de Cadastro** – o formulário do WhatsApp Business aparece com os campos preenchidos (nome da empresa, e‑mail, telefone, etc.).
7. **Usuário submeteu o cadastro** – o WhatsApp envia a confirmação ao backend.
8. **Mensagem de boas‑vindas** – o backend usa a API de mensagens para enviar uma mensagem de boas‑vindas ao número recém‑registrado.

> *Para gerar o screencast, recomendamos usar a ferramenta nativa do Windows (Xbox Game Bar) ou um gravador como OBS Studio, capturando a sequência acima em 30‑45 segundos.*

## 4. Testes de API realizados
- **GET /me/businesses** – verificamos que o `business_id` retornado corresponde ao configurado.
- **POST /{business_id}/add_phone_numbers** – adicionamos o número `+5588994227586` (resultado `200 OK`).
- **GET /api/whatsapp/prefill** – retornou JSON válido conforme `docs/whatsapp_pre_fill.md`.
- **POST /api/whatsapp/exchange-code** – trocou o `code` por `access_token` e confirmou que o token tem o escopo `whatsapp_business_messaging`.
- **POST /{whatsapp_business_account_id}/messages** – enviou mensagem de boas‑vindas de teste para o número recém‑adicionado (recebida com sucesso no dispositivo teste).

## 5. Declaração de Conformidade
> **Eu, desenvolvedor responsável pelo repositório `whatsmiau2`, declaro que o aplicativo está em total conformidade com as políticas de uso permitido da permissão `whatsapp_business_messaging`.**
> - O aplicativo coleta consentimento explícito do usuário.
> - Envia apenas mensagens transacionais.
> - Não armazena ou compartilha dados sensíveis fora do backend seguro.
> - Todos os endpoints exigidos foram testados com sucesso.

---
*Documento gerado em 26 de maio de 2026.*
