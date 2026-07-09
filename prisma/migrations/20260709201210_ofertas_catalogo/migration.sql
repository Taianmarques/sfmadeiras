/*
  Warnings:

  - You are about to drop the column `icone` on the `Oferta` table. All the data in the column will be lost.
  - Added the required column `imagemUrl` to the `Oferta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precoNormal` to the `Oferta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precoPromocional` to the `Oferta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Oferta" DROP COLUMN "icone",
ADD COLUMN     "imagemUrl" TEXT NOT NULL,
ADD COLUMN     "precoNormal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "precoPromocional" DECIMAL(12,2) NOT NULL,
ALTER COLUMN "descricao" DROP NOT NULL;
