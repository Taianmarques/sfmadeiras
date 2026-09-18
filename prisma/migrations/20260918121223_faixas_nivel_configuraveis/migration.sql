-- CreateTable
CREATE TABLE "FaixaNivelConfig" (
    "id" TEXT NOT NULL,
    "nivel" "NivelFidelidade" NOT NULL,
    "minimo" DECIMAL(12,2) NOT NULL,
    "maximo" DECIMAL(12,2),
    "multiplicador" DECIMAL(4,2) NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaixaNivelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaixaNivelConfig_nivel_key" ON "FaixaNivelConfig"("nivel");

-- Seed com os valores que já eram hardcoded em lib/pontos.ts, pra não mudar
-- o comportamento do app até um admin editar pela aba Configurações.
INSERT INTO "FaixaNivelConfig" ("id", "nivel", "minimo", "maximo", "multiplicador", "atualizadoEm") VALUES
  (gen_random_uuid()::text, 'BRONZE', 0, 999.99, 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PRATA', 1000, 4999.99, 1.2, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'OURO', 5000, 14999.99, 1.5, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'DIAMANTE', 15000, NULL, 2, CURRENT_TIMESTAMP);
