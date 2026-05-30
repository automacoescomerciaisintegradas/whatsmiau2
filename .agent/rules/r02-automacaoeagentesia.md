---
trigger: always_on
---

Projeto de Automação/Agentes IA
markdown# Workspace Rules - AI Agent Workspace

## Artifacts OBRIGATÓRIOS
- ANTES de codar: crie artifacts/plan_[task].md
- DEPOIS de testar: salve logs em artifacts/logs/
- Se modificar UI: inclua screenshot no artifact

## Deep Think
- Use bloco <thought> antes de decisões arquiteturais
- Leia mission.md ANTES de qualquer tarefa
- Consulte .context/coding_style.md para regras

## Permissões
- ✅ Permitido: usar browser headless para verificar docs
- ✅ Permitido: pip install no virtualenv
- ⚠️ Restrito: NÃO submeta forms sem aprovação
- 🚫 Proibido: NUNCA execute rm -rf ou deleções em massa

## LangGraph/LangChain
- Use StateGraph para fluxos complexos
- Checkpointers para persistência
- Memory sempre com summarization

## MCPs Ativos
- Supabase: queries de banco
- Firecrawl: scraping web
- Context7: documentação atualizada