---
description: Auditoria completa de qualidade do código, aplicação e UX/UI do frontend, com validação funcional, técnica e visual, gerando relatório final com status ✓ / X por item.
---

# 🧪 WORKFLOW — Auditoria Completa de Qualidade (Frontend + UX/UI)

## 🎯 Objetivo

Garantir que o frontend esteja:
- Funcional
- Visualmente consistente
- Bem estruturado em código
- Testado
- Livre de erros no console
- Performático
- Pronto para produção

---

## 🧩 Etapas do Workflow

---

## 1️⃣ Funcionalidade

### Verificações
1. Identificar os principais fluxos do app (login, dashboard, formulários críticos)
2. Navegar por cada página verificando se:
   - O app funciona como esperado nos principais fluxos
   - Todos os botões funcionam
   - Todos os links navegam corretamente
   - Formulários submetem sem erros
   - Estados de loading/erro aparecem corretamente

### Ações
```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```
- Abrir o navegador em http://localhost:3000 ou porta configurada
- Navegar manualmente pelos principais fluxos
- Simular erros de API (se possível)
- Testar formulários com dados inválidos

### Resultado
- [ ] Status: ✓ Aprovado / X Reprovado
- Observações: (anotar bugs encontrados)

---

## 2️⃣ Design (UI/UX)

### Verificações
1. Verificar responsividade em diferentes breakpoints:
   - Mobile: 320px
   - Tablet: 768px
   - Desktop: 1024px+

2. Validar consistência visual:
   - Layout segue o design system
   - Cores consistentes
   - Fontes consistentes
   - Espaçamentos padronizados
   - Contraste acessível (WCAG AA)

### Ações
- Usar DevTools (F12) > Toggle Device Toolbar (Ctrl+Shift+M)
- Testar cada breakpoint
- Comparar com Figma/Design System se disponível
- Usar ferramenta de contraste: https://webaim.org/resources/contrastchecker/

### Resultado
- [ ] Status: ✓ Aprovado / X Reprovado
- Observações: (anotar inconsistências)

---

## 3️⃣ Código

### Verificações
1. Rodar linter para identificar problemas
2. Verificar manualmente:
   - Sem código morto
   - Sem blocos comentados desnecessários
   - Variáveis com nomes semânticos
   - Funções pequenas e focadas
   - Componentes com responsabilidade única
   - Sem lógica duplicada

### Ações
```bash
# Rodar linter
npm run lint

# Buscar TODOs e FIXMEs pendentes
findstr /s /i "TODO\|FIXME" src/**/*.js src/**/*.ts src/**/*.tsx src/**/*.jsx
# Ou para Linux/Mac:
# grep -r "TODO\|FIXME" src/
```

### Resultado
- [ ] Status: ✓ Aprovado / X Reprovado
- Lint errors: (quantidade)
- TODOs pendentes: (quantidade)
- Observações:

---

## 4️⃣ Testes

### Verificações
1. Executar suite de testes
2. Verificar cobertura de código
3. Garantir que testes críticos existem

### Ações
```bash
# Rodar testes
npm run test

# Rodar com cobertura
npm run test:coverage
```

### Critérios
- Coverage global >= 70%
- Sem testes quebrados
- Testes unitários principais presentes
- Testes de componentes críticos

### Resultado
- [ ] Status: ✓ Aprovado / X Reprovado
- Coverage: XX%
- Testes passando: XX/XX
- Observações:

---

## 5️⃣ Console

### Verificações
1. Abrir DevTools (F12) > Console
2. Recarregar a aplicação
3. Navegar pelos fluxos principais
4. Verificar:
   - Sem erros no console
   - Sem warnings críticos
   - Sem erros de React (key, hydration, etc)
   - Sem erros de rede (404, 500)

### Ações
- Limpar console e recarregar
- Anotar todos os erros encontrados
- Classificar por severidade

### Resultado
- [ ] Status: ✓ Aprovado / X Reprovado
- Erros: (quantidade)
- Warnings: (quantidade)
- Observações:

---

## 6️⃣ Performance

### Verificações
1. Rodar Lighthouse audit
2. Verificar Network tab
3. Analisar bundle size

### Ações
```bash
# Build de produção para análise
npm run build

# Se disponível
npm run analyze
```

- DevTools > Lighthouse > Generate Report
- DevTools > Network > Recarregar e analisar
- DevTools > Performance > Record durante navegação

### Critérios
- Lighthouse Performance >= 80
- Tempo de carregamento inicial < 3s
- Sem memory leaks óbvios
- Sem re-renders excessivos

### Resultado
- [ ] Status: ✓ Aprovado / X Reprovado
- Lighthouse Score: XX
- Bundle Size: XX KB
- Observações:

---

## 7️⃣ Gerar Relatório Final

Após completar todas as etapas, gerar o relatório no formato abaixo e salvar em `AUDITORIA_REPORT.md`:

```markdown
# 📊 RELATÓRIO DE AUDITORIA — FRONTEND

**Data:** YYYY-MM-DD
**Versão:** X.X.X
**Auditor:** [Nome/IA]

## Resumo

| Categoria      | Status |
|----------------|--------|
| Funcionalidade | ✓ / X  |
| Design (UI/UX) | ✓ / X  |
| Código         | ✓ / X  |
| Testes         | ✓ / X  |
| Console        | ✓ / X  |
| Performance    | ✓ / X  |

## 🚦 Resultado Final

- ✅ **APROVADO**: Todos os itens ✓
- ⚠️ **PARCIAL**: 1–2 itens X
- ❌ **REPROVADO**: 3+ itens X

---

## Detalhamento

### 1. Funcionalidade
- **Status:** ✓ / X
- **Observações:** 

### 2. Design (UI/UX)
- **Status:** ✓ / X
- **Observações:** 

### 3. Código
- **Status:** ✓ / X
- **Lint Errors:** X
- **Observações:** 

### 4. Testes
- **Status:** ✓ / X
- **Coverage:** XX%
- **Observações:** 

### 5. Console
- **Status:** ✓ / X
- **Erros:** X
- **Observações:** 

### 6. Performance
- **Status:** ✓ / X
- **Lighthouse:** XX
- **Observações:** 

---

## Ações Recomendadas

1. [Ação prioritária 1]
2. [Ação prioritária 2]
3. [Ação prioritária 3]
```

---

## 🔧 Comandos Úteis (Turbo)

```bash
# Instalação
npm install

# Lint
npm run lint

# Testes
npm run test
npm run test:coverage

# Build
npm run build

# Análise de bundle (se disponível)
npm run analyze
```

---

## ✅ Checklist Rápido

- [ ] 1. Funcionalidade testada
- [ ] 2. Design validado
- [ ] 3. Código revisado (lint OK)
- [ ] 4. Testes passando (coverage >= 70%)
- [ ] 5. Console limpo
- [ ] 6. Performance OK (Lighthouse >= 80)
- [ ] 7. Relatório gerado
