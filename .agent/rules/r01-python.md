---
trigger: always_on
---

2. Projeto Python/FastAPI (API Backend)
markdown# Workspace Rules - Agent Smith API

## Stack
- Python 3.11+
- FastAPI com async/await
- SQLAlchemy 2.0 para ORM
- Pydantic v2 para validação
- Alembic para migrations

## Padrões de Código
- Type hints em TODAS as funções
- Docstrings no formato Google
- Use async def para endpoints
- Máximo 20 linhas por função

## Estrutura
- /app/api/v1 - endpoints versionados
- /app/models - modelos SQLAlchemy
- /app/schemas - schemas Pydantic
- /app/services - lógica de negócio
- /app/core - config e dependências

## Testes
- pytest para todos os testes
- Cobertura mínima: 80%
- Fixtures em conftest.py

## Banco de Dados
- NUNCA faça queries raw sem parameterização
- Use migrations para TODA alteração de schema
- Ambiente: Supabase PostgreSQL

## Ambiente
- Use python-dotenv para .env
- Variáveis sensíveis NUNCA no código