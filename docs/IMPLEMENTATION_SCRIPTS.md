# Scripts de Migração e Implementação - Controle de Assinaturas

## 1. Script de Migração do Banco de Dados

### Migração para adicionar campos de controle de assinatura
```sql
-- migration_001_add_subscription_fields.sql
-- Adiciona campos necessários para controle de assinaturas e inadimplência

-- Adiciona coluna UserID à tabela instances para associação com usuário
ALTER TABLE instances ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Adiciona índice para otimizar buscas por usuário
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);

-- Adiciona nova coluna de status para instâncias
-- O valor padrão será 'disconnected' e converteremos os valores antigos
ALTER TABLE instances ADD COLUMN IF NOT EXISTS new_status TEXT DEFAULT 'disconnected';
UPDATE instances SET new_status = 
    CASE 
        WHEN status = 'open' THEN 'connected'
        WHEN status = 'connecting' THEN 'connecting'
        ELSE 'disconnected'
    END;
ALTER TABLE instances DROP COLUMN status;
ALTER TABLE instances RENAME COLUMN new_status TO status;

-- Cria tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start DATETIME NOT NULL,
    current_period_end DATETIME NOT NULL,
    grace_period_end DATETIME,
    canceled_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cria índice para otimizar buscas por usuário
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Cria índice para otimizar buscas por status e data de término
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period ON subscriptions(status, current_period_end);

-- Cria trigger para atualizar o campo updated_at
CREATE TRIGGER IF NOT EXISTS update_subscriptions_updated_at 
AFTER UPDATE ON subscriptions
BEGIN
    UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### Script de inicialização de dados
```sql
-- migration_002_seed_plans.sql
-- Insere planos padrão no sistema

INSERT OR IGNORE INTO plans (id, name, price, currency, interval, features, limits, created_at, updated_at) VALUES
('free', 'Free', 0, 'BRL', 'month', '["5 conexões", "1000 mensagens/mês", "Suporte básico"]', '{"instances": 5, "messages_per_month": 1000}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('basic', 'Básico', 4990, 'BRL', 'month', '["10 conexões", "10000 mensagens/mês", "Suporte prioritário", "Relatórios avançados"]', '{"instances": 10, "messages_per_month": 10000}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('premium', 'Premium', 9990, 'BRL', 'month', '["25 conexões", "50000 mensagens/mês", "Suporte 24/7", "Relatórios avançados", "Automações ilimitadas"]', '{"instances": 25, "messages_per_month": 50000}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enterprise', 'Empresarial', 19990, 'BRL', 'month', '["Conexões ilimitadas", "Mensagens ilimitadas", "Infraestrutura dedicada", "Suporte 24/7", "Personalização completa"]', '{"instances": 9999, "messages_per_month": 999999}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

## 2. Script de Implementação em Go

### Implementação do serviço de processamento de assinaturas
```go
// cmd/migrate/main.go
package main

import (
    "fmt"
    "log"
    "time"

    "whatsmiau2/internal/config"
    "whatsmiau2/internal/database"
    "whatsmiau2/internal/models"

    "go.uber.org/zap"
)

func main() {
    // Inicializar logger
    logger := initLogger()
    defer logger.Sync()
    zap.ReplaceGlobals(logger)

    // Carregar configuração
    cfg, err := config.Load()
    if err != nil {
        log.Fatal("Failed to load configuration:", err)
    }

    // Inicializar banco de dados
    db, err := database.New(cfg)
    if err != nil {
        log.Fatal("Failed to initialize database:", err)
    }
    defer db.Close()

    // Executar migrações
    if err := runMigrations(db); err != nil {
        log.Fatal("Failed to run migrations:", err)
    }

    fmt.Println("Migrações executadas com sucesso!")
}

func runMigrations(db *database.Database) error {
    // Executar migrações para adicionar campos de controle de assinatura
    if err := db.AutoMigrate(&models.Subscription{}, &models.Instance{}); err != nil {
        return fmt.Errorf("falha ao migrar modelos: %w", err)
    }

    // Atualizar todas as instâncias existentes para ter um user_id
    // (atribuindo a um usuário padrão ou criando usuários para instâncias órfãs)
    if err := assignUsersToInstances(db); err != nil {
        return fmt.Errorf("falha ao atribuir usuários às instâncias: %w", err)
    }

    // Criar plano gratuito padrão para usuários sem assinatura
    if err := createDefaultSubscriptions(db); err != nil {
        return fmt.Errorf("falha ao criar assinaturas padrão: %w", err)
    }

    return nil
}

func assignUsersToInstances(db *database.Database) error {
    var instances []models.Instance
    if err := db.Find(&instances).Error; err != nil {
        return err
    }

    for _, instance := range instances {
        // Se a instância não tem user_id, atribuir um padrão ou criar usuário
        if instance.UserID == "" {
            // Para simplificação, vamos atribuir a um usuário padrão
            // Na implementação real, talvez seja necessário criar usuários individuais
            instance.UserID = "default_user"
            if err := db.Save(&instance).Error; err != nil {
                return err
            }
        }
    }

    return nil
}

func createDefaultSubscriptions(db *database.Database) error {
    var users []models.User
    if err := db.Find(&users).Error; err != nil {
        return err
    }

    for _, user := range users {
        // Verificar se o usuário já tem uma assinatura
        var existingSub models.Subscription
        if err := db.Where("user_id = ?", user.ID).First(&existingSub).Error; err != nil {
            // Criar assinatura gratuita padrão para usuários sem assinatura
            freeSub := models.Subscription{
                UserID:             user.ID,
                PlanID:             "free",
                Status:             models.StatusActive,
                CurrentPeriodStart: time.Now(),
                CurrentPeriodEnd:   time.Now().AddDate(0, 1, 0), // 1 mês
            }

            if err := db.Create(&freeSub).Error; err != nil {
                return err
            }
        }
    }

    return nil
}

func initLogger() *zap.Logger {
    logger, _ := zap.NewProduction()
    return logger
}
```

## 3. Script de Configuração do Serviço

### Script de inicialização do serviço com novos componentes
```bash
#!/bin/bash
# deploy_with_subscription_control.sh

set -e

echo "Iniciando implantação com controle de assinaturas..."

# Executar migrações do banco de dados
echo "Executando migrações..."
go run cmd/migrate/main.go

# Compilar o servidor principal com novos recursos
echo "Compilando servidor..."
go build -o bin/server main.go

# Iniciar o servidor
echo "Iniciando servidor com controle de assinaturas..."
./bin/server

echo "Implantação concluída com sucesso!"