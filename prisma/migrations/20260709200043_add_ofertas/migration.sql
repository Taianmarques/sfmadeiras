-- CreateTable
CREATE TABLE "Oferta" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "icone" TEXT NOT NULL DEFAULT '🏷️',
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoPorAdminId" TEXT,

    CONSTRAINT "Oferta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Oferta_ativo_dataInicio_dataFim_idx" ON "Oferta"("ativo", "dataInicio", "dataFim");

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_criadoPorAdminId_fkey" FOREIGN KEY ("criadoPorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
