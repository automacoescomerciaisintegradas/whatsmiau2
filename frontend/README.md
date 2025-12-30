# 🚀 WhatsMiau2 Frontend

Frontend moderno em React + TypeScript + Vite para a plataforma multicanal WhatsMiau2.

## 📦 Stack Tecnológica

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **React Query** - Data fetching
- **React Router** - Routing
- **ReactFlow** - Flow builder
- **Recharts** - Charts
- **Socket.IO** - Real-time
- **CSS Modules** - Styling

## 🎨 Design System

Design system premium com:
- Glassmorphism
- Dark theme
- Animações suaves
- CSS Variables
- Componentes reutilizáveis

## 📁 Estrutura

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Button, Input, etc)
│   ├── layout/         # Layout components (Sidebar, Header)
│   └── shared/         # Componentes compartilhados
├── features/           # Features por módulo
│   ├── dashboard/
│   ├── tickets/
│   ├── kanban/
│   ├── contacts/
│   ├── flows/
│   ├── ai-agents/
│   └── ...
├── hooks/              # Custom hooks
├── services/           # API services
├── stores/             # Zustand stores
├── utils/              # Utilities
├── types/              # TypeScript types
├── styles/             # Global styles
├── App.tsx
└── main.tsx
```

## 🚀 Comandos

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint
```

## 🎯 Próximos Passos

1. ✅ Setup inicial
2. ✅ Design system
3. ✅ Componentes UI base
4. ⏳ Layout (Sidebar + Header)
5. ⏳ Routing
6. ⏳ State management
7. ⏳ API integration
8. ⏳ Features (Dashboard, Tickets, etc)

## 📝 Convenções

- **Componentes**: PascalCase (Button.tsx)
- **Hooks**: camelCase com prefixo use (useAuth.ts)
- **Utilities**: camelCase (formatDate.ts)
- **Types**: PascalCase (User.ts)
- **CSS Modules**: Component.module.css

## 🎨 Cores

- **Primary**: Indigo (#6366f1)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Dark (#0f172a)

## 📚 Documentação

Ver [IMPLEMENTATION_PLAN_V2.md](../docs/IMPLEMENTATION_PLAN_V2.md) para detalhes completos.

---

**Versão:** 2.0  
**Última atualização:** 2025-12-28
