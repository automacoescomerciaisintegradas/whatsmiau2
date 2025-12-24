# 🔧 Correção do Problema de Conexão QR Code

## Problema Identificado

O sistema mostrava "conectado" mesmo quando o dispositivo não estava realmente vinculado ao WhatsApp. Isso acontecia por:

1. **Device Store compartilhado**: Todas as instâncias usavam a mesma sessão do WhatsApp
2. **Verificação de conexão incompleta**: Não validava se a sessão ainda era válida no celular
3. **Sessões antigas persistidas**: O arquivo `sessions.db` mantinha sessões inválidas

## Correções Aplicadas

### 1. `internal/whatsapp/manager.go`

**GetOrCreateClient()** - Corrigido para:
- Buscar dispositivos existentes válidos
- Criar novo dispositivo quando necessário
- Logar quando usa dispositivo existente vs novo

**Logout()** - Melhorado para:
- Primeiro desconectar
- Depois fazer logout no WhatsApp 
- **Deletar a sessão do banco de dados** (`c.Store.Delete(ctx)`)
- Isso garante que o próximo connect vai gerar um novo QR Code

**IsConnected()** - Mais robusto:
- Verifica se o cliente whatsmeow está conectado
- **Também verifica se tem um JID válido** (sessão válida)

### 2. `internal/handlers/instance.go`

**GetInstanceStatus()** - Mais inteligente:
- Sincroniza o banco de dados quando detecta inconsistência
- Se a API diz "conectado" mas o cliente não está, atualiza para "desconectado"

## Como Resolver o Problema Agora

### Opção 1: Usar a página de diagnóstico

1. Abra `diagnostico.html` no navegador
2. Clique em **"🗑️ Limpar Sessão (Logout)"**
3. Aguarde 5-10 segundos
4. Clique em **"🔗 Testar Conexão"**
5. Escaneie o novo QR Code

### Opção 2: Via linha de comando

```powershell
# 1. Fazer logout da instância
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance/logout/minha-instancia" `
  -Method Delete -Headers @{apikey = "SUA_API_KEY"}

# 2. Aguardar alguns segundos...

# 3. Solicitar nova conexão
Invoke-RestMethod -Uri "http://localhost:8081/v1/instance/connect/minha-instancia" `
  -Method Get -Headers @{apikey = "SUA_API_KEY"}
```

### Opção 3: Limpar manualmente

1. Pare a aplicação
2. Delete o arquivo `sessions.db`
3. Delete o arquivo `data.db` (ou limpe a tabela `instances`)
4. Inicie a aplicação novamente
5. Crie uma nova instância e escaneie o QR Code

## Passos para Testar

1. **Recompile a aplicação**:
   ```powershell
   go build -o whatsmiau2.exe main.go
   ```

2. **Inicie a aplicação**:
   ```powershell
   ./whatsmiau2.exe
   ```

3. **Acesse a página de diagnóstico**:
   - Abra `diagnostico.html` em um navegador

4. **Limpe a sessão antiga**:
   - Clique em "Limpar Sessão (Logout)"

5. **Reconecte**:
   - Clique em "Testar Conexão"
   - Escaneie o QR Code com seu WhatsApp

## Arquivos Modificados

- `internal/whatsapp/manager.go` - Gestão de sessões melhorada
- `internal/handlers/instance.go` - Verificação de status melhorada
- `diagnostico.html` - **NOVO** - Página de diagnóstico

## Prevenção Futura

Com essas correções, o sistema agora:
- ✅ Limpa sessões corretamente no logout
- ✅ Verifica se a sessão é realmente válida
- ✅ Sincroniza o estado quando detecta inconsistência
- ✅ Sempre gera novo QR Code após logout

---

Data: 20/12/2025
