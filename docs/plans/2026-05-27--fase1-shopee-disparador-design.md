# Design: Fase 1 - Busca Shopee + Disparador WhatsApp

**Date:** 2026-05-27  
**Author:** Codex  
**Status:** Proposto

## Objetivo
Permitir que o WhatsMiau2:

1. Busque ofertas/produtos da Shopee por palavra-chave.
2. Salve resultados relevantes como "ofertas".
3. Use essas ofertas para montar mensagem de campanha no disparador já existente.

Foco da Fase 1: integração incremental e baixo risco, sem quebrar `/disparador` atual.

## Escopo
### Em Escopo
- Endpoints novos em `/v1/shopee/*` e `/v1/offers/*`.
- Persistência SQL para ofertas, buscas e log de envio.
- Reuso do envio atual (`/v1/message/sendText/:instance` e `/v1/message/sendMedia/:instance`).
- Frontend do disparador consumindo nova origem de conteúdo/ofertas.

### Fora de Escopo (Fase 2+)
- Worker assíncrono robusto com fila distribuída.
- Enriquecimento automático de contatos a partir da Shopee.
- Segmentação avançada por comportamento e scoring.

## Premissas Técnicas
- Autenticação: mesma do projeto (`AuthMiddleware` JWT).
- Banco: compatível com SQLite e PostgreSQL (tipos simples).
- Fonte Shopee: conector desacoplado (SDK/API oficial quando disponível para o caso de uso; fallback de coleta controlada quando permitido no ambiente).

## Arquitetura (Fase 1)
1. `ShopeeConnectorService`:
- Entrada: `keyword`, `country`, `limit`, `sort`.
- Saída: lista normalizada de ofertas (`external_item_id`, `title`, `price`, `shop`, `url`, etc.).

2. `OfferService`:
- Salva/atualiza ofertas normalizadas.
- Mantém vínculo com usuário (`user_id`).

3. `DispatchBindingService`:
- Recebe `offer_id` + template.
- Gera mensagem final para o disparador atual.
- Registra tentativa em `dispatch_logs`.

## Endpoints Propostos (Fase 1)
### 1) Buscar Shopee (sem persistir)
`POST /v1/shopee/search`

Request:
```json
{
  "keyword": "fritadeira air fryer",
  "country": "BR",
  "limit": 30,
  "sort": "relevance"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "external_item_id": "1234567890",
        "title": "Air Fryer 4L",
        "price": 289.9,
        "currency": "BRL",
        "shop_name": "Loja Exemplo",
        "item_url": "https://shopee.com.br/...",
        "image_url": "https://...",
        "sold_count": 1200,
        "rating": 4.8
      }
    ]
  }
}
```

### 2) Buscar Shopee e salvar
`POST /v1/shopee/search-and-save`

Request:
```json
{
  "keyword": "fritadeira air fryer",
  "country": "BR",
  "limit": 30,
  "sort": "relevance",
  "tag": "cozinha"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "saved_count": 18,
    "updated_count": 4
  }
}
```

### 3) Listar ofertas salvas
`GET /v1/offers?source=shopee&keyword=air%20fryer&page=1&page_size=20`

Response:
```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "page_size": 20,
    "total": 0
  }
}
```

### 4) Atualizar metadata da oferta
`PATCH /v1/offers/:id`

Request:
```json
{
  "is_active": true,
  "label": "top-conversao",
  "notes": "bom CPC no Meta Ads"
}
```

### 5) Criar campanha vinculada a oferta
`POST /v1/offers/:id/campaigns`

Request:
```json
{
  "instance": "minha-instancia",
  "name": "campanha-airfryer-maio",
  "message_template": "Oferta: {{title}} por R$ {{price}}. Link: {{item_url}}",
  "delay_seconds": 8,
  "recipients": [
    "5511999999999",
    "5511988888888"
  ]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "campaign_id": 101,
    "queued": 2
  }
}
```

### 6) Disparo síncrono da campanha (reuso do fluxo atual)
`POST /v1/campaigns/:id/dispatch`

Request:
```json
{
  "mode": "sync"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "campaign_id": 101,
    "total": 2,
    "sent": 2,
    "failed": 0
  }
}
```

## SQL Schema (Fase 1)
Referência completa em: `migrations/007_create_shopee_phase1_tables.sql`.

Tabelas:
- `marketplace_searches`: histórico de buscas executadas.
- `marketplace_offers`: ofertas normalizadas (source = `shopee`).
- `offer_campaigns`: configuração de campanha por oferta.
- `offer_campaign_recipients`: destinatários da campanha.
- `dispatch_logs`: auditoria de envio por destinatário.

## Regras de Validação
- `delay_seconds`: mínimo `3`, máximo `1800`.
- `recipients`: normalizar para E.164 (apenas dígitos, DDI obrigatório).
- `message_template`: máximo recomendado 1024 chars na Fase 1.
- `country`: `BR` por padrão (expandível).

## Plano de Entrega Fase 1
1. Criar migration SQL.
2. Criar models GORM correspondentes.
3. Criar `ShopeeConnectorService` com interface desacoplada.
4. Expor endpoints `/v1/shopee/*` e `/v1/offers/*`.
5. Integrar botão no `/disparador` para selecionar oferta e preencher template.
6. Registrar logs de disparo em `dispatch_logs`.

## Riscos e Mitigações
- Risco: instabilidade de fonte Shopee.
  Mitigação: camada de conector com fallback e cache curto.
- Risco: bloqueio por cadência agressiva no WhatsApp.
  Mitigação: enforce de delay (`3..1800`) e recomendação por volume.
- Risco: baixa entregabilidade por conteúdo promocional irrelevante.
  Mitigação: usar templates curtos e segmentação mínima por contexto.

## Critérios de Pronto (Fase 1)
- Buscar e salvar ofertas via API.
- Criar campanha por oferta.
- Disparar para lista de contatos com delay validado.
- Log de sucesso/erro por destinatário disponível para consulta.
