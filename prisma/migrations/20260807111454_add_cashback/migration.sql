-- CreateEnum
CREATE TYPE "TipoMovimentacaoCashback" AS ENUM ('CREDITO_COMPRA', 'RESGATE', 'AJUSTE');

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "saldoCashback" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MovimentacaoCashback" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoMovimentacaoCashback" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCompra" DECIMAL(12,2),
    "valor" DECIMAL(12,2) NOT NULL,
    "taxaAplicada" DECIMAL(5,4),
    "criadoPorAdminId" TEXT,
    "comprovanteId" TEXT,
    "resgateCashbackId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoCashback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResgateCashback" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" "StatusComprovante" NOT NULL DEFAULT 'PENDENTE',
    "motivoRejeicao" TEXT,
    "analisadoPorAdminId" TEXT,
    "analisadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResgateCashback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoCashback_comprovanteId_key" ON "MovimentacaoCashback"("comprovanteId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoCashback_resgateCashbackId_key" ON "MovimentacaoCashback"("resgateCashbackId");

-- CreateIndex
CREATE INDEX "MovimentacaoCashback_clienteId_criadoEm_idx" ON "MovimentacaoCashback"("clienteId", "criadoEm");

-- CreateIndex
CREATE INDEX "MovimentacaoCashback_tipo_idx" ON "MovimentacaoCashback"("tipo");

-- CreateIndex
CREATE INDEX "ResgateCashback_clienteId_status_idx" ON "ResgateCashback"("clienteId", "status");

-- CreateIndex
CREATE INDEX "ResgateCashback_status_idx" ON "ResgateCashback"("status");

-- AddForeignKey
ALTER TABLE "MovimentacaoCashback" ADD CONSTRAINT "MovimentacaoCashback_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoCashback" ADD CONSTRAINT "MovimentacaoCashback_criadoPorAdminId_fkey" FOREIGN KEY ("criadoPorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoCashback" ADD CONSTRAINT "MovimentacaoCashback_comprovanteId_fkey" FOREIGN KEY ("comprovanteId") REFERENCES "Comprovante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoCashback" ADD CONSTRAINT "MovimentacaoCashback_resgateCashbackId_fkey" FOREIGN KEY ("resgateCashbackId") REFERENCES "ResgateCashback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResgateCashback" ADD CONSTRAINT "ResgateCashback_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResgateCashback" ADD CONSTRAINT "ResgateCashback_analisadoPorAdminId_fkey" FOREIGN KEY ("analisadoPorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
