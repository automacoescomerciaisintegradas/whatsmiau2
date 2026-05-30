---
trigger: always_on
---

# Workspace Rules - WhatsMiau2

## Linguagem
- Responder em Portugues (pt-BR), com objetividade.
- Explicar decisoes tecnicas de forma curta e clara.

## Stack Oficial do Projeto
- Backend principal: Go (`main.go`, `internal/`)
- BFF/servicos auxiliares: Node.js (`server.js`)
- Frontend: estatico em `public/` e modulo React/Vite em `frontend/`
- Banco: SQLite/PostgreSQL (configuravel), Redis opcional

## Regras de Implementacao
- Preservar padroes existentes; evitar refatoracao ampla sem solicitacao.
- Nao quebrar endpoints existentes sem plano de migracao.
- Validar e sanitizar inputs em handlers e servicos.
- Priorizar confiabilidade dos fluxos de: autenticacao, instancia, mensagem e webhook.

## Seguranca
- Nunca expor credenciais/chaves no codigo.
- Usar variaveis de ambiente para dados sensiveis.
- Tratar erros sem vazar detalhes internos ao cliente.

## Qualidade Minima (Definition of Done)
- Projeto compila e sobe localmente.
- Testes relevantes executados.
- Logs e mensagens de erro suficientes para diagnostico.
- Documentacao atualizada quando houver mudanca funcional.

## Evitar
- Assumir Next.js/FastAPI/Supabase como stack padrao.
- Alteracoes destrutivas sem confirmacao.
- Mudancas breaking sem aviso e plano de rollback.
- Inserir em UI/copy qualquer marca ou URL de concorrente (por exemplo, Z-API).
