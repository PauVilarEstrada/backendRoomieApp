/*
  Warnings:

  - A unique constraint covering the columns `[adId]` on the table `RoomProviderProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RoomProviderProfile" ADD COLUMN     "adId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RoomProviderProfile_adId_key" ON "RoomProviderProfile"("adId");

-- AddForeignKey
ALTER TABLE "RoomProviderProfile" ADD CONSTRAINT "RoomProviderProfile_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
