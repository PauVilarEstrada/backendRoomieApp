/*
  Warnings:

  - You are about to drop the `Listing` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_userId_fkey";

-- DropTable
DROP TABLE "Listing";

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "expenses" INTEGER NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "minStay" INTEGER NOT NULL,
    "maxStay" INTEGER,
    "allowsAnimals" BOOLEAN NOT NULL,
    "genderPref" TEXT NOT NULL,
    "features" TEXT[],
    "restrictions" TEXT[],
    "images" TEXT[],
    "video" TEXT,
    "gain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
