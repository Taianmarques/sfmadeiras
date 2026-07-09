# Deploy em VPS (Ubuntu/Debian)

Guia para colocar o sfmadeiras no ar numa VPS própria (DigitalOcean, Hetzner, Contabo, etc.), acessando pelo IP da VPS por enquanto (sem domínio ainda). O banco continua sendo o Supabase — a VPS só roda o Next.js.

Arquivos de apoio usados neste guia estão em [`deploy/`](deploy/):
- `ecosystem.config.js` — config do PM2
- `nginx-sfmadeiras.conf` — reverse proxy
- `deploy.sh` — script de atualização
- `cron-expirar-pontos.sh` — job diário de expiração de pontos

## 1. Preparar a VPS

Conecte por SSH na VPS (`ssh root@SEU_IP`) e instale o necessário:

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# PM2 (mantém o app rodando em background e reinicia sozinho)
sudo npm install -g pm2
```

Crie um usuário não-root pra rodar a aplicação (evite rodar como root):

```bash
sudo adduser sfmadeiras
sudo usermod -aG sudo sfmadeiras   # opcional, se precisar de sudo esse usuário
su - sfmadeiras
```

## 2. Clonar o projeto

```bash
git clone https://github.com/Taianmarques/sfmadeiras.git
cd sfmadeiras
npm ci
```

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Preencha:
- `DATABASE_URL` / `DIRECT_URL` — as mesmas connection strings do Supabase que você já usa localmente (Project Settings → Database)
- `NEXTAUTH_URL` — `http://SEU_IP` (troque pelo domínio depois, quando tiver um)
- `NEXTAUTH_SECRET` — **gere um novo**, diferente do que você usa em dev:
  ```bash
  openssl rand -base64 32
  ```
- `NEXT_PUBLIC_APP_URL` — mesmo valor de `NEXTAUTH_URL`
- `CRON_SECRET` — outro valor aleatório novo (`openssl rand -base64 32`)
- `WHATSAPP_*` — preencha se já tiver a Evolution API/Z-API configurada, senão deixe em branco

> Nunca reaproveite os secrets que você gerou pra rodar localmente — gere valores novos pra produção.

## 4. Aplicar migrations e buildar

```bash
npx prisma migrate deploy   # aplica as migrations já commitadas (não cria novas)
npm run build
```

## 5. Subir com PM2

```bash
pm2 start deploy/ecosystem.config.js
pm2 save            # salva a lista de processos
pm2 startup         # imprime um comando `sudo env PATH=... pm2 startup systemd -u sfmadeiras ...`
                     # copie e rode esse comando (com sudo) pra sobreviver a reboot da VPS
```

Verifique que está no ar localmente na própria VPS:

```bash
curl -I http://127.0.0.1:3000
pm2 logs sfmadeiras --lines 50
```

## 6. Nginx (reverse proxy na porta 80)

Ainda como o usuário `sfmadeiras` (ou com sudo):

```bash
sudo cp deploy/nginx-sfmadeiras.conf /etc/nginx/sites-available/sfmadeiras
sudo ln -s /etc/nginx/sites-available/sfmadeiras /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # remove o site padrão do Nginx
sudo nginx -t                                  # valida a config
sudo systemctl reload nginx
```

## 7. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

**Não libere a porta 3000 no firewall** — o tráfego externo deve passar sempre pelo Nginx (porta 80), nunca direto pro Next.js.

## 8. Testar

Abra `http://SEU_IP` no navegador. Deve aparecer a home do Madeireira Pinheiro.

## 9. Cron de expiração de pontos

```bash
chmod +x deploy/cron-expirar-pontos.sh
crontab -e
```

Adicione (roda todo dia às 3h da manhã):

```
0 3 * * * /home/sfmadeiras/sfmadeiras/deploy/cron-expirar-pontos.sh >> /home/sfmadeiras/cron.log 2>&1
```

(ajuste o caminho pro diretório real onde você clonou o projeto)

## Atualizações futuras

Sempre que fizer push de mudanças pro GitHub, na VPS:

```bash
cd ~/sfmadeiras
chmod +x deploy/deploy.sh   # só na primeira vez
./deploy/deploy.sh
```

Isso puxa o código novo, reinstala dependências, aplica migrations pendentes, builda e reinicia o processo no PM2 sem downtime perceptível.

## Quando tiver um domínio

1. Aponte o registro DNS tipo `A` do domínio pro IP da VPS.
2. Edite `/etc/nginx/sites-available/sfmadeiras`, troque `server_name _;` por `server_name seu-dominio.com;`.
3. Instale certbot e gere HTTPS grátis:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d seu-dominio.com
   ```
   O certbot edita o arquivo do Nginx automaticamente pra servir HTTPS e renovar sozinho.
4. Atualize `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL` no `.env` pra `https://seu-dominio.com` e rode `pm2 restart sfmadeiras --update-env`.
