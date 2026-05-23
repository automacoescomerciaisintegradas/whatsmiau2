# Sistema de Autenticação - WhatsMiau2

Este documento descreve o sistema de autenticação implementado no projeto WhatsMiau2, incluindo as funcionalidades de login e cadastro de usuários.

## Funcionalidades

### Backend
- Modelo de usuário com campos: ID, Nome, Email e Senha
- Criptografia de senhas usando bcrypt
- Endpoints de autenticação:
  - `POST /v1/auth/register` - Registro de novo usuário
  - `POST /v1/auth/login` - Login de usuário existente
  - `GET /v1/auth/me` - Obter informações do usuário autenticado
- Sistema de autenticação baseado em JWT (JSON Web Tokens)
- Validação de dados de entrada

### Frontend
- Tela de login com validação de formulário
- Tela de cadastro com validação de formulário
- Armazenamento seguro de tokens JWT no localStorage
- Interceptação automática de requisições para adicionar o cabeçalho de autorização
- Rotas protegidas que exigem autenticação
- Redirecionamento automático para login quando o token expira

## Configuração

### Variáveis de Ambiente

Certifique-se de configurar a variável de ambiente JWT_SECRET no arquivo `.env`:

```
JWT_SECRET=sua-chave-secreta-jwt-aqui
```

A chave JWT_SECRET é usada para assinar e validar os tokens JWT. É importante usar uma chave forte e mantê-la segura em produção.

### Banco de Dados

O sistema de autenticação utiliza o mesmo banco de dados configurado para o resto da aplicação. As tabelas necessárias serão criadas automaticamente através das migrações do GORM.

## Uso

### Registro de Usuário

Para registrar um novo usuário, envie uma requisição POST para `/v1/auth/register` com os seguintes dados:

```json
{
  "name": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

### Login

Para fazer login, envie uma requisição POST para `/v1/auth/login` com os seguintes dados:

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

Se as credenciais forem válidas, a resposta incluirá um token JWT:

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Acesso a Recursos Protegidos

Para acessar recursos protegidos, inclua o token JWT no cabeçalho de autorização:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Segurança

- As senhas são armazenadas criptografadas usando bcrypt
- Os tokens JWT têm expiração configurada para 24 horas
- O sistema inclui proteção contra ataques de força bruta (pode ser expandida)
- Todas as rotas sensíveis exigem autenticação JWT válida

## Estrutura de Arquivos

Backend:
- `internal/models/user.go` - Modelo de usuário
- `internal/handlers/auth.go` - Handlers de autenticação
- `internal/middleware/auth.go` - Middleware de autenticação JWT
- `internal/config/config.go` - Configuração JWT

Frontend:
- `src/features/auth/LoginPage.tsx` - Tela de login
- `src/features/auth/RegisterPage.tsx` - Tela de cadastro
- `src/services/api.ts` - Serviço de API com interceptores JWT
- `src/components/ProtectedRoute.tsx` - Componente de rota protegida