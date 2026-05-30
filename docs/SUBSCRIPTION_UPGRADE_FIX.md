## Solução Implementada: Upgrade/Downgrade Automático de Planos

### Problema
O erro "user already has an active subscription" ocorria porque o sistema estava bloqueando a criação de uma nova assinatura quando o usuário já tinha uma ativa (da simulação anterior).

### Solução
Modifiquei a lógica em `CreateSubscription` para:

1. **Detectar Troca de Plano**: Quando o usuário já tem uma assinatura ativa, o sistema verifica se o plano selecionado é diferente do atual.

2. **Cancelamento Automático**: Se for um plano diferente, o sistema cancela automaticamente a assinatura anterior antes de criar a nova.

3. **Proteção contra Duplicação**: Se o usuário tentar criar uma assinatura com o mesmo plano que já possui, retorna erro informativo.

### Como Funciona Agora

```
Usuário com Plano A → Seleciona Plano B
  ↓
Sistema cancela Plano A automaticamente
  ↓
Cria nova assinatura pendente com Plano B
  ↓
Gera link de pagamento do Mercado Pago
```

### Para Testar

1. **Reinicie o servidor Go** para aplicar as mudanças
2. Acesse `/subscription.html`
3. Clique em qualquer plano - o sistema cancelará a assinatura simulada anterior automaticamente
4. Você será redirecionado para o checkout real do Mercado Pago

### Observação
Se quiser limpar completamente o banco de dados de testes, você pode:
- Deletar o arquivo `data.db` e reiniciar o servidor (ele recriará tudo do zero)
- Ou usar um endpoint de admin para cancelar manualmente: `DELETE /v1/subscription/cancel/:userID`
