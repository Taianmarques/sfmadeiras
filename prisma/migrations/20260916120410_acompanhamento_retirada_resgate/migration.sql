-- CreateEnum
CREATE TYPE "StatusResgate" AS ENUM ('PENDENTE', 'ENTREGUE', 'CANCELADO');

-- AlterTable
ALTER TABLE "Resgate" ADD COLUMN     "canceladoEm" TIMESTAMP(3),
ADD COLUMN     "canceladoPorAdminId" TEXT,
ADD COLUMN     "entregueEm" TIMESTAMP(3),
ADD COLUMN     "entreguePorAdminId" TEXT,
ADD COLUMN     "motivoCancelamento" TEXT,
ADD COLUMN     "status" "StatusResgate" NOT NULL DEFAULT 'PENDENTE';

-- CreateIndex
CREATE INDEX "Resgate_status_idx" ON "Resgate"("status");

-- AddForeignKey
ALTER TABLE "Resgate" ADD CONSTRAINT "Resgate_entreguePorAdminId_fkey" FOREIGN KEY ("entreguePorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resgate" ADD CONSTRAINT "Resgate_canceladoPorAdminId_fkey" FOREIGN KEY ("canceladoPorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
