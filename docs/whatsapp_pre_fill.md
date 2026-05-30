# Preenchimento Automático do Cadastro Incorporado (WhatsApp Business API)

## Visão Geral
Esta página descreve como utilizar o recurso **Embedded Signup** do WhatsApp Business API para pré‑popular o formulário de cadastro com dados fornecidos em formato JSON. O objetivo é simplificar a experiência do usuário, reduzindo o número de campos a serem preenchidos manualmente.

## Como funciona
1. **Gerar o JSON de pré‑preenchimento** contendo os campos suportados pelo formulário de cadastro.  
2. **Codificar o JSON** em Base64 (ou URL‑encode) e incluí‑lo como parâmetro `prefill_data` na URL de inscrição.
3. O WhatsApp renderiza o formulário já preenchido com os valores fornecidos.

> **Referência oficial:** https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/pre-filled-data

## Estrutura do JSON
```json
{
  "business_name": "Nome da Empresa",
  "email": "contato@empresa.com",
  "phone_number": "+5511999999999",
  "address": {
    "street": "Rua Exemplo, 123",
    "city": "São Paulo",
    "state": "SP",
    "postal_code": "01000-000",
    "country": "BR"
  },
  "website": "https://www.empresa.com",
  "industry": "retail",
  "description": "Descrição breve da empresa",
  "profile_picture_url": "https://www.empresa.com/logo.png"
}
```

### Campos suportados
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|--------------|-----------|
| `business_name` | string | Sim | Nome da empresa que aparecerá no perfil do WhatsApp. |
| `email` | string | Sim | E‑mail de contato da empresa. |
| `phone_number` | string (E.164) | Sim | Número de telefone comercial. |
| `address.street` | string | Não | Rua e número. |
| `address.city` | string | Não | Cidade. |
| `address.state` | string | Não | Estado/UF. |
| `address.postal_code` | string | Não | CEP. |
| `address.country` | string (ISO 3166‑1 alpha‑2) | Sim | Código do país (ex.: `BR`). |
| `website` | string (URL) | Não | Site institucional. |
| `industry` | string | Não | Categoria de negócio (ex.: `retail`, `ecommerce`, `services`). |
| `description` | string | Não | Texto livre que descreve a empresa. |
| `profile_picture_url` | string (URL) | Não | URL da imagem de perfil a ser exibida. |

## Codificando o JSON
```bash
# Exemplo em bash
JSON='{"business_name":"Minha Loja","email":"contato@minhaloja.com","phone_number":"+5511999999999","address":{"street":"Av. Paulista, 1000","city":"São Paulo","state":"SP","postal_code":"01310-100","country":"BR"},"website":"https://www.minhaloja.com"}'
BASE64=$(echo -n "$JSON" | base64 -w 0)
# URL final
URL="https://wa.me/123456789?prefill_data=$BASE64"
echo $URL
```
> **Obs.:** Em ambientes Windows, pode‑se usar o PowerShell:
```powershell
$Json = '{"business_name":"Minha Loja","email":"contato@minhaloja.com","phone_number":"+5511999999999"}'
$Base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Json))
$Url = "https://wa.me/123456789?prefill_data=$Base64"
Write-Output $Url
```

## Uso na prática
1. **Obtenha o `business_id`** da sua conta WhatsApp Business.
2. Construa a URL conforme o exemplo acima, substituindo o número de telefone de destino (`123456789`) pelo **ID da sua aplicação**.
3. Redirecione o usuário para essa URL (ex.: em um botão "Cadastrar" no seu site).
4. O formulário de cadastro será exibido já preenchido com os valores informados.

## Boas práticas
- Validar todos os campos antes da codificação (formato E.164 para telefone, URL válida, etc.).
- Nunca exponha informações sensíveis como `access_token` no JSON.
- Mantenha o JSON o menor possível – campos vazios podem ser omitidos.
- Teste a URL em ambientes de sandbox antes de enviá‑la para produção.

## Resolução de problemas
| Sintoma | Possível causa | Solução |
|---------|----------------|--------|
| Formulário abre em branco | JSON mal‑formado ou codificação incorreta | Verifique o JSON válido e re‑encode em Base64. |
| Campo não aparece preenchido | Campo não suportado ou nome incorreto | Consulte a lista de campos acima; use apenas os nomes exatos. |
| Erro de URL muito grande | Excedeu o limite de URL do navegador | Reduza o número de campos ou compacte o JSON antes de codificar. |

---
*Documentado em 27 de maio de 2026.*
