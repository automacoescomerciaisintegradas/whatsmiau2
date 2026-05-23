# Guia de Instalação e Execução - WhatsMiau2

## 1. Instalar Go

Como você ainda não tem Go instalado, siga estas etapas:

### Windows

1. **Baixe o instalador**:
   - Acesse: https://go.dev/dl/
   - Baixe o arquivo `.msi` mais recente (ex: `go1.24.windows-amd64.msi`)

2. **Execute o instalador**:
   - Clique duas vezes no arquivo baixado
   - Siga as instruções do instalador
   - O Go será instalado em `C:\Go` por padrão

3. **Verifique a instalação**:
   ```powershell
   go version
   ```
   Deve mostrar algo como: `go version go1.24 windows/amd64`

## 2. Instalar Dependências

Após instalar o Go, abra um novo terminal PowerShell e execute:

```powershell
cd c:\projetos2025\whatsmiau2
go mod tidy
```

Este comando vai baixar todas as dependências automaticamente.

## 3. Executar o Projeto

### Modo desenvolvimento (recomendado para testes)

```powershell
cd c:\projetos2025\whatsmiau2
go run main.go
```

### Compilar para produção

```powershell
cd c:\projetos2025\whatsmiau2
go build -o whatsmiau2.exe main.go
.\whatsmiau2.exe
```

## 4. Executar com Docker

Se preferir usar Docker (não precisa instalar Go):

```powershell
cd c:\projetos2025\whatsmiau2
docker-compose up -d --build
```

Ver logs:
```powershell
docker-compose logs -f
```

## 5. Testar a API

Após iniciar o servidor, teste com:

### Health Check
```powershell
curl http://localhost:8081/health
```

### Criar Instância
```powershell
curl -X POST http://localhost:8081/v1/instance `
  -H "Content-Type: application/json" `
  -H "apikey: your-api-key-here" `
  -d '{\"instanceName\": \"teste\", \"qrcode\": true}'
```

### Listar Instâncias
```powershell
curl http://localhost:8081/v1/instance `
  -H "apikey: your-api-key-here"
```

## 6. Configuração

Edite o arquivo `.env` para personalizar:

- `PORT`: Porta do servidor (padrão: 8081)
- `API_KEY`: Chave de autenticação
- `DEBUG_MODE`: Ativa logs detalhados
- `DIALECT_DB`: Tipo de banco de dados (sqlite3 ou postgres)

## Próximos Passos

1. Instale o Go conforme instruções acima
2. Execute `go mod tidy` para baixar dependências
3. Execute `go run main.go` para iniciar o servidor
4. Use a API conforme documentação no README.md

## Problemas Comuns

### "go: command not found"
- Reinicie o terminal após instalar o Go
- Verifique se Go está no PATH: `$env:PATH`

### Erro de compilação CGO
O projeto usa SQLite que precisa de CGO. No Windows, você pode precisar instalar:
1. MinGW-w64: https://www.mingw-w64.org/
2. Ou usar a versão Docker

### Porta em uso
Se a porta 8081 estiver em uso, altere no arquivo `.env`:
```
PORT=8082
```
