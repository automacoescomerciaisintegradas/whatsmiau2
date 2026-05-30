# AGENTS.md - Instrucoes do Projeto WhatsMiau2

Este arquivo define o guia rapido para agentes e desenvolvedores trabalhando neste repositorio.

## 1. Objetivo do Projeto

- Backend principal em Go para API WhatsApp (baseada em `whatsmeow`).
- BFF/Proxy em Node (`server.js`) para integracoes e frontend estatico.
- Frontend principal em arquivos estaticos (`public/`) e uma versao em React/Vite (`frontend/`).
- Foco: automacao comercial confiavel, seguranca e estabilidade.

## 2. Stack Real (fonte da verdade)

- Go `1.24+` (API principal)
- Node.js (scripts e BFF)
- SQLite/PostgreSQL (via configuracao)
- Redis opcional
- Frontend estatico + React/Vite em modulo separado

## 3. Como Rodar Localmente

1. Copiar `.env.example` para `.env` e ajustar variaveis.
2. Backend Go:
   - `go mod tidy`
   - `go run main.go`
3. Alternativa com Docker:
   - `docker-compose up -d --build`
4. Acesso local padrao:
   - API/UI: `http://localhost:8085` (ver `.env` e configs se necessario)

## 4. Comandos de Validacao Essenciais

- `go test ./...`
- `go run cmd/test_mp/main.go`
- `go run cmd/test_webhook/main.go`
- `go run cmd/test_message/main.go`

Se houver mudanca em frontend React (`frontend/`):

- `cd frontend`
- `npm install`
- `npm run build`

## 5. Estrutura Importante

- `main.go`: entrada do backend Go
- `internal/`: logica principal (handlers, services, middleware, models, crm)
- `public/`: frontend estatico
- `frontend/`: frontend React/Vite (modulo novo)
- `migrations/`: SQL de migracoes
- `cmd/`: utilitarios e testes executaveis
- `docs/`: guias tecnicos, negocio e manutencao
- `scripts/`: automacoes de deploy e operacao

## 6. Regras de Implementacao

- Preservar arquitetura atual; evitar refatoracao ampla sem pedido explicito.
- Preferir mudancas incrementais e de baixo risco.
- Nao quebrar compatibilidade dos endpoints existentes.
- Reutilizar padroes de codigo ja presentes em `internal/` antes de criar novos.
- Adicionar logs claros em fluxos criticos (pagamento, envio de mensagem, webhook).

## 7. Seguranca (Obrigatorio)

- Nunca commitar segredo, token ou credencial.
- Validar e sanitizar todo input externo.
- Manter autenticacao/autorizacao consistente nos handlers.
- Evitar expor erros internos detalhados para cliente final.

## 8. Qualidade e Definicao de Pronto

Antes de finalizar uma tarefa:

1. Codigo compila e sobe localmente.
2. Testes relevantes executados sem erro.
3. Sem regressao obvia nos fluxos de autenticacao, instancia e mensagem.
4. Documentacao atualizada quando houver mudanca funcional.
5. Mudanca explicada de forma curta e verificavel (arquivos + impacto).

## 9. Prioridade de Decisao

1. Funcionalidade correta
2. Seguranca
3. Confiabilidade operacional
4. Manutenibilidade
5. Performance

## 10. Evitar

- Alterar stack assumindo Next.js/FastAPI/Supabase como padrao global.
- Remover codigo legado sem confirmar impacto.
- Fazer mudancas breaking sem plano de migracao.
- Executar operacoes destrutivas em banco ou arquivos sem backup/confirmacao.
- Exibir nome, logo ou URL de concorrentes (ex.: Z-API) em textos, links, mockups ou paginas publicas.
