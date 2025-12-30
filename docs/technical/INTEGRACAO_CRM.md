# 🔌 Guia de Integração do CRM

## Como Integrar o CRM no WhatsMiau2

### 1. Atualizar o main.go

Adicione as seguintes importações:

```go
import (
    // ... imports existentes
    "github.com/automacoescomerciaisintegradas/whatsmiau2/internal/crm"
)
```

### 2. Inicializar o CRM Server

No seu `main()`, após inicializar o banco de dados:

```go
func main() {
    // ... código existente de inicialização do DB
    
    // Inicializar CRM
    crmServer := crm.NewServer(db)
    
    // Executar migrations (primeira vez)
    if err := crmServer.RunMigrations(); err != nil {
        log.Fatal("Failed to run CRM migrations:", err)
    }
    
    // Registrar rotas do CRM
    mux := http.NewServeMux()
    crmServer.RegisterRoutes(mux)
    
    // ... resto do código
}
```

### 3. Exemplo Completo de Integração

```go
package main

import (
    "database/sql"
    "log"
    "net/http"
    
    _ "github.com/mattn/go-sqlite3"
    "github.com/automacoescomerciaisintegradas/whatsmiau2/internal/crm"
)

func main() {
    // Abrir banco de dados
    db, err := sql.Open("sqlite3", "./data.db?_foreign_keys=on")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()
    
    // Inicializar CRM
    crmServer := crm.NewServer(db)
    
    // Executar migrations
    if err := crmServer.RunMigrations(); err != nil {
        log.Fatal("Failed to run CRM migrations:", err)
    }
    
    // Criar router
    mux := http.NewServeMux()
    
    // Registrar rotas do CRM
    crmServer.RegisterRoutes(mux)
    
    // Rotas existentes do WhatsMiau2
    // ... suas rotas atuais aqui
    
    // Iniciar servidor
    log.Println("🚀 Server starting on :8081")
    log.Println("📊 CRM available at http://localhost:8081/api/crm")
    
    if err := http.ListenAndServe(":8081", mux); err != nil {
        log.Fatal(err)
    }
}
```

---

## 📡 Endpoints Disponíveis

### Leads

#### Criar Lead
```http
POST /api/crm/leads
Content-Type: application/json

{
  "nome": "João Silva",
  "whatsapp": "5511999999999",
  "email": "joao@example.com",
  "empresa": "Empresa XYZ",
  "valor": 5000.00,
  "fonte": "instagram",
  "status": "novo",
  "temperatura": "quente"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "lead": {
    "id": 1,
    "nome": "João Silva",
    "whatsapp": "5511999999999",
    ...
  }
}
```

#### Listar Leads
```http
GET /api/crm/leads
GET /api/crm/leads?status=novo
GET /api/crm/leads?temperatura=quente
GET /api/crm/leads?search=joão
GET /api/crm/leads?limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "leads": [...]
}
```

#### Buscar Lead por ID
```http
GET /api/crm/leads?id=1
```

**Response:**
```json
{
  "success": true,
  "lead": {...}
}
```

#### Atualizar Lead
```http
PUT /api/crm/leads?id=1
Content-Type: application/json

{
  "status": "negociacao",
  "temperatura": "quente",
  "observacoes": "Cliente interessado"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead updated successfully"
}
```

#### Deletar Lead
```http
DELETE /api/crm/leads?id=1
```

**Response:**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

#### Estatísticas
```http
GET /api/crm/leads/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 100,
    "novos": 30,
    "em_contato": 25,
    "negociacao": 20,
    "fechados": 15,
    "perdidos": 10,
    "valor_total": 150000.00,
    "conversao": 15.0
  }
}
```

---

## 🧪 Testando com cURL

### Criar Lead
```bash
curl -X POST http://localhost:8081/api/crm/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Santos",
    "whatsapp": "5511988888888",
    "email": "maria@example.com",
    "empresa": "Tech Solutions",
    "valor": 10000.00,
    "fonte": "google",
    "temperatura": "quente"
  }'
```

### Listar Leads
```bash
curl http://localhost:8081/api/crm/leads
```

### Buscar Lead
```bash
curl http://localhost:8081/api/crm/leads?id=1
```

### Atualizar Lead
```bash
curl -X PUT http://localhost:8081/api/crm/leads?id=1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "fechado",
    "observacoes": "Venda concluída!"
  }'
```

### Deletar Lead
```bash
curl -X DELETE http://localhost:8081/api/crm/leads?id=1
```

### Estatísticas
```bash
curl http://localhost:8081/api/crm/leads/stats
```

---

## 🔧 Executar Migrations Manualmente

Se preferir executar as migrations manualmente via SQLite:

```bash
# Windows (PowerShell)
Get-Content migrations\001_create_leads_table.sql | sqlite3 data.db
Get-Content migrations\002_create_messages_table.sql | sqlite3 data.db
Get-Content migrations\003_create_payments_table.sql | sqlite3 data.db
Get-Content migrations\004_create_email_campaigns_table.sql | sqlite3 data.db
Get-Content migrations\005_create_templates_table.sql | sqlite3 data.db
Get-Content migrations\006_create_activities_table.sql | sqlite3 data.db

# Ou criar um script PowerShell:
$migrations = @(
    "001_create_leads_table.sql",
    "002_create_messages_table.sql",
    "003_create_payments_table.sql",
    "004_create_email_campaigns_table.sql",
    "005_create_templates_table.sql",
    "006_create_activities_table.sql"
)

foreach ($migration in $migrations) {
    Write-Host "Running $migration..."
    Get-Content "migrations\$migration" | sqlite3 data.db
}

Write-Host "✅ All migrations completed!"
```

---

## 📝 Próximos Passos

1. ✅ Integrar CRM no main.go
2. ✅ Executar migrations
3. ✅ Testar endpoints com cURL ou Postman
4. ⏳ Criar handlers de Messages
5. ⏳ Criar handlers de Payments
6. ⏳ Integrar com frontend existente (crm.html)

---

## 🐛 Troubleshooting

### Erro: "table already exists"
Se você já executou as migrations antes, pode ignorar este erro ou dropar as tabelas:
```sql
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS messages;
-- etc...
```

### Erro: "FOREIGN KEY constraint failed"
Certifique-se de que `?_foreign_keys=on` está na connection string:
```go
db, err := sql.Open("sqlite3", "./data.db?_foreign_keys=on")
```

### Erro: "package not found"
Execute:
```bash
go mod tidy
```

---

**Última Atualização**: 28/12/2025  
**Status**: ✅ Pronto para Integração
