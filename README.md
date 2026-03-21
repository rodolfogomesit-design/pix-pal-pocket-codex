# Pix Pal Pocket

Projeto frontend exportado do Lovable e preparado para desenvolvimento local no Codex.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase

## Rodando localmente

1. Instale as dependências:

```sh
npm install
```

2. Crie um arquivo `.env` com base no `.env.example`.

3. Preencha as variáveis do frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

4. Inicie o servidor de desenvolvimento:

```sh
npm run dev
```

5. Para gerar a build de produção:

```sh
npm run build
```

## Testes

- `npm run test`: testes com Vitest
- `npm run test:e2e`: testes end-to-end com Playwright

## Estrutura principal

- `src/app/`: composição dos providers e das rotas principais
- `src/`: aplicação React
- `src/components/`: componentes reutilizáveis e componentes por área
- `src/pages/`: páginas e rotas
- `src/contexts/`: contexto de autenticação e sessão
- `src/hooks/`: hooks customizados
- `src/integrations/supabase/`: cliente e tipos do Supabase
- `supabase/`: migrations e edge functions

## Supabase

Se o projeto Supabase estiver vazio ou sem migrations aplicadas, use o bootstrap em [supabase/bootstrap/minimal-bootstrap.sql](/C:/Users/rodol/Downloads/pix-pal-pocket-main/pix-pal-pocket-main/supabase/bootstrap/minimal-bootstrap.sql).

Esse arquivo cria a base mínima para:

- perfis de responsáveis
- papéis de admin
- trigger de criação de perfil no signup
- busca de email por CPF
- preenchimento de perfis já criados no `auth.users`

Para habilitar o painel administrativo com a estrutura mínima, use também [supabase/bootstrap/admin-bootstrap.sql](/C:/Users/rodol/Downloads/pix-pal-pocket-main/pix-pal-pocket-main/supabase/bootstrap/admin-bootstrap.sql).

Se quiser uma base única mais completa, incluindo dashboard do responsável e bootstrap do admin, use [supabase/bootstrap/full-bootstrap.sql](/C:/Users/rodol/Downloads/pix-pal-pocket-main/pix-pal-pocket-main/supabase/bootstrap/full-bootstrap.sql).

## Deploy

O frontend é um app estático Vite e pode ser publicado em plataformas como Vercel, Netlify, Cloudflare Pages ou qualquer hospedagem que sirva o conteúdo de `dist/`.

Passos mínimos:

1. Configurar as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID` no ambiente de produção.
2. Rodar `npm install`.
3. Rodar `npm run build`.
4. Publicar a pasta `dist/`.
5. Garantir fallback de SPA para `index.html` nas rotas do React Router.

### Vercel

Se você for usar Vercel, este projeto já ficou preparado com [vercel.json](/C:/Users/rodol/Downloads/pix-pal-pocket-main/pix-pal-pocket-main/vercel.json).

Na criação do projeto na Vercel, use:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Variáveis para cadastrar na Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Depois do primeiro deploy, teste ao menos estas rotas:

- `/`
- `/login`
- `/cadastro`
- `/dashboard`
- `/crianca`
- `/admin`

## Checklist de release

Antes de publicar:

- confirmar que o `.env` local não será versionado
- validar `npm run build`
- validar `npm run test:e2e` nas rotas críticas
- revisar URLs e chaves do Supabase do ambiente correto
- revisar Edge Functions e migrations necessárias na pasta `supabase/`
- confirmar fallback de SPA no provedor de hospedagem

## Notas de migração

- O plugin `lovable-tagger` foi removido do build por não ser necessário no desenvolvimento local.
- O README foi trocado para um fluxo local focado em Codex e IDE.
- O `.env` foi colocado no `.gitignore` para evitar commit acidental de configurações locais.
- A configuração de Playwright foi trocada por uma versão padrão, sem dependências do Lovable.
