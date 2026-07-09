// Config do PM2 — mantém o `next start` rodando em background, reinicia
// sozinho se cair, e sobrevive a reboot da VPS (depois de `pm2 startup` + `pm2 save`).
module.exports = {
  apps: [
    {
      name: "sfmadeiras",
      cwd: __dirname + "/..",
      script: "npm",
      args: "start -- -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      autorestart: true,
      max_restarts: 10,
      instances: 1,
    },
  ],
};
