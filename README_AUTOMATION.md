# WhatsMiau2 - Sistema de Automação Comercial com WhatsApp

WhatsMiau2 é um sistema avançado de automação comercial que permite a integração com o WhatsApp para comunicação automatizada com leads e clientes.

## Funcionalidades

### CRM Completo
- Gerenciamento de leads com informações detalhadas
- Classificação por status e temperatura
- Histórico de interações
- Estatísticas e relatórios

### Automação de Mensagens
- Criação de regras de automação
- Triggers baseados em eventos (nova lead, mudança de status, etc.)
- Ações configuráveis (envio de mensagens, atualização de leads)
- Integração com instâncias do WhatsApp

### Integração com WhatsApp
- Compatível com a API Evolution WhatsApp
- Suporte a múltiplas instâncias
- Autenticação via QR Code ou pareamento por número
- Envio de mensagens de texto, mídia e áudio

## API de Automação

### Criar Regra de Automação
```bash
POST /v1/crm/automation/rules
Content-Type: application/json

{
  "name": "Boas-vindas a nova lead",
  "description": "Enviar mensagem de boas-vindas para novos leads",
  "trigger_type": "new_lead",
  "trigger_data": {
    "status": "novo"
  },
  "actions": [
    {
      "action_type": "send_message",
      "action_data": {
        "instance_id": "minha_instancia_whatsapp",
        "message": "Olá! Seja bem-vindo(a)! Agradecemos seu contato.",
        "wait_time": 2
      },
      "order": 1
    }
  ],
  "enabled": true
}
```

### Listar Regras de Automação
```bash
GET /v1/crm/automation/rules?enabled=true
```

### Disparar Manualmente uma Regra
```bash
POST /v1/crm/automation/trigger
Content-Type: application/json

{
  "rule_id": 1,
  "lead_id": 123
}
```

## Configuração

### Variáveis de Ambiente
- `GO_PORT` ou `PORT`: Porta do servidor (padrão: 8085)
- `DEBUG_MODE`: Habilitar modo debug (padrão: false)
- `DIALECT_DB`: Tipo de banco de dados (padrão: sqlite3)
- `DB_URL`: URL de conexão com o banco de dados
- `API_KEY`: Chave de API para autenticação
- `BASIC_AUTH_USERNAME` e `BASIC_AUTH_PASSWORD`: Credenciais de autenticação básica

### Estrutura de Pastas
```
whatsmiau2/
├── internal/
│   ├── config/          # Configurações do sistema
│   ├── crm/            # Sistema de CRM
│   │   ├── models/     # Modelos de dados
│   │   ├── repository/ # Camada de acesso a dados
│   │   ├── services/   # Lógica de negócios
│   │   └── handlers/   # Controladores HTTP
│   ├── whatsapp/       # Integração com WhatsApp
│   └── server/         # Servidor HTTP
├── migrations/         # Migrações de banco de dados
└── main.go             # Ponto de entrada da aplicação
```

## Execução

1. Configure as variáveis de ambiente
2. Execute o servidor:
```bash
go run main.go
```

3. O servidor iniciará na porta especificada (padrão: 8085)

## Contribuição

Sinta-se à vontade para contribuir com o projeto. Abra issues para relatar bugs ou sugerir melhorias, e envie pull requests com novas funcionalidades.

## Licença

Este projeto está licenciado sob os termos descritos no arquivo LICENSE.

---

Desenvolvido com ❤️ para automação comercial eficiente.