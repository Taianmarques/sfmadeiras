# Clube de Fidelidade — Madeireira Pinheiro

Sistema fullstack de clube de pontos para a Madeireira Pinheiro: cadastro e login de clientes por CPF/CNPJ, QR Code pessoal, envio e aprovação de comprovantes de compra, catálogo de recompensas, níveis de fidelidade, campanhas de pontos em dobro, indicação de amigos e painel administrativo completo para a loja.

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de dados:** [Supabase](https://supabase.com) (PostgreSQL gerenciado) + Prisma ORM
- **Autenticação:** NextAuth.js (Credentials) — cliente por CPF/CNPJ + senha, admin por e-mail + senha
- **Upload de comprovantes:** armazenamento local em `/uploads` (fora de `/public`, servido por rota autenticada)
- **WhatsApp:** stub estruturado em `lib/whatsapp.ts`, pronto para plugar Evolution API ou Z-API

> O projeto usa o Supabase só como Postgres gerenciado (via Prisma) — não usa Supabase Auth nem Supabase Storage. Login continua sendo NextAuth + Prisma, e os comprovantes continuam salvos em `/uploads`.

## Pré-requisitos

- Node.js 18+
- Uma conta e um projeto criado no [Supabase](https://supabase.com) (tem plano gratuito)

## Como rodar localmente

1. **Instale as dependências**

   ```bash
   npm install
   ```

2. **Crie um projeto no Supabase**

   Em [supabase.com](https://supabase.com) → **New project**. Anote a senha do banco que você definir na criação (vai precisar dela nas connection strings).

3. **Pegue as connection strings do banco**

   No painel do projeto: **Project Settings → Database → Connection string**. O Supabase mostra dois formatos:
   - **Connection pooling** (porta `6543`, modo transaction/pgbouncer) → vai em `DATABASE_URL`
   - **Connection string** direta (porta `5432`) → vai em `DIRECT_URL`

   `DIRECT_URL` é necessária porque `prisma migrate` não funciona através do pgbouncer em modo transaction — só a aplicação em runtime usa a conexão via pool.

4. **Configure as variáveis de ambiente**

   Copie `.env.example` para `.env` e preencha os valores (`DATABASE_URL`, `DIRECT_URL` com os dados do passo anterior, e `NEXTAUTH_SECRET`):

   ```bash
   cp .env.example .env
   ```

   Gere um `NEXTAUTH_SECRET` forte, por exemplo:

   ```bash
   openssl rand -base64 32
   ```

5. **Aplique as migrations no banco do Supabase**

   ```bash
   npx prisma migrate dev --name init
   ```

   Isso cria as tabelas no Postgres do Supabase a partir de `prisma/schema.prisma` (usando `DIRECT_URL`) e já gera o Prisma Client. Depois desse primeiro passo, você também pode conferir as tabelas pela aba **Table Editor** do próprio painel do Supabase.

6. **Popule o banco com dados de exemplo (opcional, mas recomendado)**

   ```bash
   npm run prisma:seed
   ```

   Isso cria:
   - Um admin: `admin@madeireirapinheiro.com.br` / `admin123`
   - 4 clientes de exemplo (Carlos Mendes, Ana Beatriz Souza, Marceneiro João Lima, Construtora Pinheiro), todos com senha `cliente123`
   - Catálogo de recompensas, histórico de compras, um resgate, um comprovante pendente e uma campanha de pontos em dobro ativa

7. **Rode o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

   Acesse:
   - `http://localhost:3000` — página inicial (escolha cliente ou loja)
   - `http://localhost:3000/cliente/login` — app do cliente
   - `http://localhost:3000/admin/login` — painel da loja

## Scripts úteis

| Comando                 | Descrição                                              |
| ------------------------ | ------------------------------------------------------- |
| `npm run dev`             | Sobe o servidor de desenvolvimento                       |
| `npm run build`           | Build de produção                                        |
| `npm run start`           | Roda o build de produção                                 |
| `npm run lint`            | Lint do projeto                                          |
| `npm run prisma:migrate`  | Cria/aplica uma nova migration                            |
| `npm run prisma:studio`   | Abre o Prisma Studio (explorar o banco visualmente)       |
| `npm run prisma:seed`     | Popula o banco com os dados de exemplo                    |

## Estrutura do projeto

```
/app
  /cliente        → páginas do cliente (login, registro, app com abas)
  /admin          → páginas do admin (login, painel com abas)
  /api
    /auth         → NextAuth + registro de cliente
    /cliente      → rotas usadas pelo app do cliente
    /admin        → rotas usadas pelo painel da loja
    /uploads      → serve os arquivos de comprovante (autenticado)
    /cron         → expiração de pontos (chamável por cron externo)
/prisma
  schema.prisma   → modelos do banco
  seed.ts         → dados de exemplo
/components
  /cliente        → componentes específicos do app do cliente
  /admin          → componentes específicos do painel da loja
/lib
  auth.ts         → configuração do NextAuth
  pontos.ts       → regras de negócio: níveis, multiplicadores, cálculo de pontos, expiração
  whatsapp.ts      → stub de notificações WhatsApp (Evolution API / Z-API)
  upload.ts        → salvar/servir comprovantes
  rateLimit.ts      → rate limiting em memória (login e envio de comprovante)
  auditoria.ts      → log de auditoria (ação, usuário, IP, timestamp)
/uploads          → arquivos de comprovante enviados pelos clientes (não versionado)
middleware.ts     → protege rotas de página e de API por papel (cliente/admin)
```

## Regras de negócio implementadas

- **Pontuação:** R$1 gasto = 1 ponto, multiplicado pelo nível do cliente e, se houver, por uma campanha ativa.
- **Níveis** (por total gasto acumulado):
  - Bronze: R$0 – R$999 (1x)
  - Prata: R$1.000 – R$4.999 (1.2x)
  - Ouro: R$5.000 – R$14.999 (1.5x)
  - Diamante: R$15.000+ (2x)
- **Expiração de pontos:** cada crédito de pontos (compra ou bônus) forma um "lote" com validade de 12 meses a partir da data em que foi ganho. Resgates consomem os lotes mais antigos primeiro (FIFO). Um lote não usado até a data de expiração é baixado automaticamente (rota `POST /api/cron/expirar-pontos`, pensada para ser chamada por um agendador externo com o header `x-cron-secret`, ou manualmente por um admin logado).
- **Indicação de amigo:** cada cliente tem um link único (`/cliente/registro?ref=<id>`, reutilizável para quantos amigos quiser). Ao um indicado se cadastrar por esse link, quem indicou ganha 100 pontos de bônus automaticamente.
- **Limite de comprovantes pendentes:** um cliente não pode ter mais de 3 comprovantes aguardando análise ao mesmo tempo.
- **Auditoria:** login (cliente/admin), lançamento de compra, aprovação/rejeição de comprovante, resgate e ajustes ficam registrados em `LogAuditoria` com usuário, IP e timestamp.
- **Rate limiting:** rotas de login (cliente e admin) e de envio de comprovante têm limite de tentativas por IP/cliente numa janela de tempo (implementação em memória — ver nota abaixo).

## Notas sobre produção

- **Rate limiting:** a implementação atual (`lib/rateLimit.ts`) é em memória, válida para uma única instância do processo Node. Para rodar em múltiplas instâncias/serverless, troque por um armazenamento compartilhado (ex: Upstash Redis) — a assinatura da função foi pensada para isso ser um drop-in.
- **Upload de comprovantes:** hoje salva em `/uploads` no disco local do servidor. Para trocar por S3 (ou outro storage), basta reimplementar `salvarComprovante` em `lib/upload.ts` mantendo a mesma assinatura, e ajustar a rota `app/api/uploads/[arquivo]/route.ts` para redirecionar/assinar a URL do bucket em vez de ler do disco.
- **WhatsApp:** enquanto `WHATSAPP_PROVIDER`, `WHATSAPP_API_URL` e `WHATSAPP_API_KEY` não estiverem preenchidos no `.env`, as notificações apenas fazem `console.info` (não quebram o fluxo). Preencha essas variáveis com uma instância da Evolution API ou da Z-API para ativar o envio real.
- **Expiração de pontos:** configure um cron externo (Vercel Cron, GitHub Actions agendado, cron do SO) para chamar `POST /api/cron/expirar-pontos` periodicamente (ex: uma vez por dia) com o header `x-cron-secret: <CRON_SECRET>`.
