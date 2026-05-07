# AERO — Plataforma Digital de Conexión Alimentaria

**Universidad de La Sabana · Ingeniería Informática · Capstone 2026-1**

Conecta la oferta alimentaria informal con la demanda estudiantil universitaria en el entorno de la Universidad de La Sabana (Sabana Centro, Cundinamarca, Colombia).

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript strict
- **Estilos**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **Pagos**: Kushki · Nequi · Daviplata
- **Mapas**: Google Maps JS API

## Estructura

```
apps/web/       Next.js 14 — frontend + API routes
supabase/       Migraciones SQL + Edge Functions
plans/          Documentación y planes de implementación
```

## Setup local

```bash
# 1. Clonar e instalar
cd apps/web && npm install

# 2. Variables de entorno
cp .env.example .env.local
# Completar .env.local con las credenciales del dashboard de Supabase

# 3. Tipos TypeScript desde Supabase
npx supabase gen types typescript --project-id vtngzjobuhqjnckuyrsx --schema public > apps/web/types/database.ts

# 4. Dev server
npm run dev
```

## Supabase

- **Project ref**: `vtngzjobuhqjnckuyrsx`
- **URL**: `https://vtngzjobuhqjnckuyrsx.supabase.co`
- Migración inicial: `supabase/migrations/001_initial_schema.sql`

## Equipo

| Integrante | Rol |
|-----------|-----|
| Juan Andrés Lacouture Daza | Análisis y QA |
| Santiago Carrillo Piñeros | UX/UI + Frontend |
| Andrés Felipe Sánchez García | Backend + DB |
| Valentina Alejandra López Romero | Full Stack + Docs |

Ver [plans/master.md](plans/master.md) para la documentación completa del proyecto.
