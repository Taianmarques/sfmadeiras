-- CreateEnum
CREATE TYPE "NivelFidelidade" AS ENUM ('BRONZE', 'PRATA', 'OURO', 'DIAMANTE');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('COMPRA', 'RESGATE', 'BONUS_INDICACAO', 'EXPIRACAO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "OrigemPontos" AS ENUM ('COMPRA', 'BONUS_INDICACAO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoArquivo" AS ENUM ('IMAGEM', 'PDF');

-- CreateEnum
CREATE TYPE "StatusComprovante" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "StatusIndicacao" AS ENUM ('PENDENTE', 'CONVERTIDA');

-- CreateEnum
CREATE TYPE "TipoUsuarioAuditoria" AS ENUM ('CLIENTE', 'ADMIN', 'SISTEMA');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "qrCodeToken" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "totalGasto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "nivel" "NivelFidelidade" NOT NULL DEFAULT 'BRONZE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "indicadoPorId" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PontosLote" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "pontosOriginais" INTEGER NOT NULL,
    "pontosRestantes" INTEGER NOT NULL,
    "origem" "OrigemPontos" NOT NULL,
    "movimentacaoId" TEXT NOT NULL,
    "dataExpiracao" TIMESTAMP(3) NOT NULL,
    "expirado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PontosLote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoPontos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCompra" DECIMAL(12,2),
    "pontos" INTEGER NOT NULL,
    "multiplicadorAplicado" DECIMAL(4,2),
    "criadoPorAdminId" TEXT,
    "comprovanteId" TEXT,
    "resgateId" TEXT,
    "campanhaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoPontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recompensa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "icone" TEXT NOT NULL DEFAULT '🎁',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recompensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resgate" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "recompensaId" TEXT NOT NULL,
    "pontosGastos" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resgate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprovante" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "valorInformado" DECIMAL(12,2) NOT NULL,
    "descricao" TEXT,
    "arquivoNome" TEXT NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "arquivoTipo" "TipoArquivo" NOT NULL,
    "status" "StatusComprovante" NOT NULL DEFAULT 'PENDENTE',
    "motivoRejeicao" TEXT,
    "analisadoPorAdminId" TEXT,
    "analisadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comprovante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campanha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "multiplicador" DECIMAL(4,2) NOT NULL DEFAULT 2.0,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorAdminId" TEXT,

    CONSTRAINT "Campanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicacao" (
    "id" TEXT NOT NULL,
    "codigoUnico" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "indicadoId" TEXT,
    "status" "StatusIndicacao" NOT NULL DEFAULT 'PENDENTE',
    "pontosBonus" INTEGER NOT NULL DEFAULT 100,
    "convertidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Indicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "usuarioTipo" "TipoUsuarioAuditoria" NOT NULL,
    "usuarioId" TEXT,
    "adminId" TEXT,
    "ip" TEXT,
    "detalhes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpfCnpj_key" ON "Cliente"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_qrCodeToken_key" ON "Cliente"("qrCodeToken");

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "Cliente"("nome");

-- CreateIndex
CREATE INDEX "Cliente_nivel_idx" ON "Cliente"("nivel");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PontosLote_movimentacaoId_key" ON "PontosLote"("movimentacaoId");

-- CreateIndex
CREATE INDEX "PontosLote_clienteId_expirado_dataExpiracao_idx" ON "PontosLote"("clienteId", "expirado", "dataExpiracao");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoPontos_comprovanteId_key" ON "MovimentacaoPontos"("comprovanteId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoPontos_resgateId_key" ON "MovimentacaoPontos"("resgateId");

-- CreateIndex
CREATE INDEX "MovimentacaoPontos_clienteId_criadoEm_idx" ON "MovimentacaoPontos"("clienteId", "criadoEm");

-- CreateIndex
CREATE INDEX "MovimentacaoPontos_tipo_idx" ON "MovimentacaoPontos"("tipo");

-- CreateIndex
CREATE INDEX "Resgate_clienteId_idx" ON "Resgate"("clienteId");

-- CreateIndex
CREATE INDEX "Comprovante_clienteId_status_idx" ON "Comprovante"("clienteId", "status");

-- CreateIndex
CREATE INDEX "Comprovante_status_idx" ON "Comprovante"("status");

-- CreateIndex
CREATE INDEX "Campanha_dataInicio_dataFim_ativo_idx" ON "Campanha"("dataInicio", "dataFim", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Indicacao_codigoUnico_key" ON "Indicacao"("codigoUnico");

-- CreateIndex
CREATE UNIQUE INDEX "Indicacao_indicadoId_key" ON "Indicacao"("indicadoId");

-- CreateIndex
CREATE INDEX "Indicacao_indicadorId_idx" ON "Indicacao"("indicadorId");

-- CreateIndex
CREATE INDEX "LogAuditoria_usuarioTipo_usuarioId_idx" ON "LogAuditoria"("usuarioTipo", "usuarioId");

-- CreateIndex
CREATE INDEX "LogAuditoria_acao_idx" ON "LogAuditoria"("acao");

-- CreateIndex
CREATE INDEX "LogAuditoria_criadoEm_idx" ON "LogAuditoria"("criadoEm");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_indicadoPorId_fkey" FOREIGN KEY ("indicadoPorId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PontosLote" ADD CONSTRAINT "PontosLote_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PontosLote" ADD CONSTRAINT "PontosLote_movimentacaoId_fkey" FOREIGN KEY ("movimentacaoId") REFERENCES "MovimentacaoPontos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoPontos" ADD CONSTRAINT "MovimentacaoPontos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoPontos" ADD CONSTRAINT "MovimentacaoPontos_criadoPorAdminId_fkey" FOREIGN KEY ("criadoPorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoPontos" ADD CONSTRAINT "MovimentacaoPontos_comprovanteId_fkey" FOREIGN KEY ("comprovanteId") REFERENCES "Comprovante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoPontos" ADD CONSTRAINT "MovimentacaoPontos_resgateId_fkey" FOREIGN KEY ("resgateId") REFERENCES "Resgate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoPontos" ADD CONSTRAINT "MovimentacaoPontos_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "Campanha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resgate" ADD CONSTRAINT "Resgate_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resgate" ADD CONSTRAINT "Resgate_recompensaId_fkey" FOREIGN KEY ("recompensaId") REFERENCES "Recompensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprovante" ADD CONSTRAINT "Comprovante_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprovante" ADD CONSTRAINT "Comprovante_analisadoPorAdminId_fkey" FOREIGN KEY ("analisadoPorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_criadoPorAdminId_fkey" FOREIGN KEY ("criadoPorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicacao" ADD CONSTRAINT "Indicacao_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicacao" ADD CONSTRAINT "Indicacao_indicadoId_fkey" FOREIGN KEY ("indicadoId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAuditoria" ADD CONSTRAINT "LogAuditoria_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
