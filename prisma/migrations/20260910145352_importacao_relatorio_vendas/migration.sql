-- CreateTable
CREATE TABLE "VendaImportada" (
    "id" TEXT NOT NULL,
    "pedidoExterno" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "valorVenda" DECIMAL(12,2) NOT NULL,
    "movimentacaoId" TEXT NOT NULL,
    "importadoPorAdminId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendaImportada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendaImportada_pedidoExterno_key" ON "VendaImportada"("pedidoExterno");

-- CreateIndex
CREATE UNIQUE INDEX "VendaImportada_movimentacaoId_key" ON "VendaImportada"("movimentacaoId");

-- CreateIndex
CREATE INDEX "VendaImportada_clienteId_idx" ON "VendaImportada"("clienteId");

-- AddForeignKey
ALTER TABLE "VendaImportada" ADD CONSTRAINT "VendaImportada_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaImportada" ADD CONSTRAINT "VendaImportada_movimentacaoId_fkey" FOREIGN KEY ("movimentacaoId") REFERENCES "MovimentacaoPontos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaImportada" ADD CONSTRAINT "VendaImportada_importadoPorAdminId_fkey" FOREIGN KEY ("importadoPorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
