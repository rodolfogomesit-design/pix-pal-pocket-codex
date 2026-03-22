# Release Checklist

## Ambientes

- Confirmar `VITE_SUPABASE_URL`
- Confirmar `VITE_SUPABASE_PUBLISHABLE_KEY`
- Confirmar `VITE_SUPABASE_PROJECT_ID`
- Verificar se o ambiente aponta para o projeto Supabase correto

## Banco e backend

- Revisar migrations em `supabase/migrations/`
- Se o projeto estiver vazio, rodar [supabase/bootstrap/minimal-bootstrap.sql](/C:/Users/rodol/Downloads/pix-pal-pocket-main/pix-pal-pocket-main/supabase/bootstrap/minimal-bootstrap.sql)
- Publicar Edge Functions usadas em produção:
- `woovi-balance`
- `woovi-pix`
- `woovi-webhook`
- Confirmar segredos e integrações externas no Supabase

## Validação técnica

- Rodar `npm install`
- Rodar `npm run build`
- Rodar `npm run test:e2e`
- Revisar warnings importantes do build

## Publicação do frontend

- Publicar a pasta `dist/`
- Garantir fallback de SPA para `index.html`
- Validar rotas principais após deploy:
- `/`
- `/login`
- `/cadastro`
- `/dashboard`
- `/crianca`
- `/admin`

## Smoke test pós-release

- Login do responsável
- Cadastro do responsável
- Geração de depósito Pix
- Solicitação de saque
- Login da criança
- Pagamento infantil
- Relatório em configurações
- Acesso ao painel Admin
