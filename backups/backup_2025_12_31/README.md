# Backup VPS - WhatsMiau2

## Backup Realizado em: 31/12/2025

### Informações do Backup

- **Data**: 31/12/2025 07:31:20
- **Tamanho**: 11.3 MB (compactado)
- **Localização**: `backups/backup_2025_12_31/backup_2025_12_31_073120.zip`

### Conteúdo do Backup

Este backup contém:

1. **Arquivos de Configuração**
   - `.env` e `.env.example`
   - Todos os arquivos `docker-compose.yml`
   - Dockerfiles
   - `nginx.conf`
   - `package.json`, `go.mod`
   - `main.go`, `server.js`

2. **Código-Fonte**
   - `/public` - Arquivos públicos da aplicação
   - `/internal` - Código Go interno
   - `/cmd` - Comandos CLI
   - `/migrations` - Migrações de banco de dados
   - `/scripts` - Scripts de automação
   - `/services` - Serviços da aplicação
   - `/frontend` - Código React/Frontend

3. **Bancos de Dados**
   - `data.db` - Banco de dados principal
   - `sessions.db` - Sessões do WhatsApp

4. **Dados Persistentes**
   - `/data` - Dados de runtime

5. **Documentação**
   - `/docs` - Documentação do projeto
   - `/tests` - Testes automatizados

### Como Usar o Backup

#### 1. Extrair o Backup

```powershell
# Extrair para uma pasta específica
Expand-Archive -Path "backups\backup_2025_12_31\backup_2025_12_31_073120.zip" -DestinationPath "restore_temp"
```

#### 2. Restaurar Arquivos Específicos

```powershell
# Restaurar apenas configurações
Copy-Item -Path "restore_temp\full_*\config\*" -Destination "." -Force

# Restaurar bancos de dados
Copy-Item -Path "restore_temp\full_*\databases\*" -Destination "." -Force

# Restaurar código-fonte
Copy-Item -Path "restore_temp\full_*\public" -Destination "." -Recurse -Force
```

#### 3. Restauração Completa

Use o script de restauração:

```powershell
.\scripts\restore-backup.ps1 -BackupFile "backups\backup_2025_12_31\backup_2025_12_31_073120.zip"
```

### Criar Novos Backups

Para criar um novo backup:

```powershell
# Backup completo (com compactação)
.\scripts\backup-vps.ps1

# Backup sem compactação
.\scripts\backup-vps.ps1 -CompressBackup:$false
```

### Automação de Backups

#### Windows Task Scheduler

1. Abra o Agendador de Tarefas
2. Crie uma nova tarefa
3. Configure para executar diariamente
4. Ação: `powershell.exe`
5. Argumentos: `-ExecutionPolicy Bypass -File "C:\projetos2025\whatsmiau2\scripts\backup-vps.ps1"`

#### Script de Agendamento Rápido

```powershell
# Criar tarefa agendada para backup diário às 3h da manhã
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File C:\projetos2025\whatsmiau2\scripts\backup-vps.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "WhatsMiau2 Daily Backup" -Description "Backup diário automático do WhatsMiau2"
```

### Backup para Servidor Remoto

Para enviar backups para um servidor remoto (VPS), você pode usar:

#### Via SCP (SSH)

```powershell
# Instalar módulo Posh-SSH se necessário
Install-Module -Name Posh-SSH -Force

# Enviar backup via SCP
$session = New-SFTPSession -ComputerName "seu-servidor.com" -Credential (Get-Credential)
Set-SFTPFile -SessionId $session.SessionId -LocalFile "backups\backup_2025_12_31\backup_2025_12_31_073120.zip" -RemotePath "/backups/"
Remove-SFTPSession -SessionId $session.SessionId
```

#### Via FTP

```powershell
# Configurar credenciais FTP
$ftpServer = "ftp://seu-servidor.com/backups/"
$ftpUser = "usuario"
$ftpPass = "senha"

# Upload
$webclient = New-Object System.Net.WebClient
$webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
$webclient.UploadFile("$ftpServer/backup_2025_12_31_073120.zip", "backups\backup_2025_12_31\backup_2025_12_31_073120.zip")
```

### Retenção de Backups

Por padrão, os backups são organizados por data. Recomenda-se:

- **Backups Diários**: Manter por 7 dias
- **Backups Semanais**: Manter por 4 semanas
- **Backups Mensais**: Manter por 12 meses

Script de limpeza automática disponível em: `scripts/cleanup-old-backups.ps1`

### Verificação de Integridade

Para verificar a integridade do backup:

```powershell
# Testar se o arquivo ZIP está íntegro
Test-Path "backups\backup_2025_12_31\backup_2025_12_31_073120.zip"

# Listar conteúdo sem extrair
Expand-Archive -Path "backups\backup_2025_12_31\backup_2025_12_31_073120.zip" -DestinationPath "temp_test" -Force
Get-ChildItem "temp_test" -Recurse
Remove-Item "temp_test" -Recurse -Force
```

### Suporte

Para problemas ou dúvidas sobre backups:
- Verifique os logs em: `backups/backup_2025_12_31/BACKUP_INFO.txt`
- Consulte a documentação em: `/docs`

---

**Importante**: Sempre teste a restauração de backups periodicamente para garantir que estão funcionando corretamente!
