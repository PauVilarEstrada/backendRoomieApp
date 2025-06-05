-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileType" TEXT NOT NULL DEFAULT 'busco';

-- CreateTable
CREATE TABLE "RoommateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preferredArea" TEXT NOT NULL,
    "moveInDate" TIMESTAMP(3) NOT NULL,
    "stayDuration" TEXT NOT NULL,
    "genderPref" TEXT NOT NULL,
    "allowsPets" BOOLEAN NOT NULL,
    "profilePhotos" TEXT[],

    CONSTRAINT "RoommateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spaceDesc" TEXT NOT NULL,
    "rent" INTEGER NOT NULL,
    "expenses" INTEGER NOT NULL,
    "area" TEXT NOT NULL,
    "availability" TIMESTAMP(3) NOT NULL,
    "minStay" INTEGER NOT NULL,
    "maxStay" INTEGER,
    "allowsPets" BOOLEAN NOT NULL,
    "features" TEXT[],
    "restrictions" TEXT[],
    "genderPref" TEXT NOT NULL,
    "roomPhotos" TEXT[],
    "profilePhotos" TEXT[],
    "roomVideo" TEXT,

    CONSTRAINT "RoomProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoommateProfile_userId_key" ON "RoommateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomProviderProfile_userId_key" ON "RoomProviderProfile"("userId");

-- AddForeignKey
ALTER TABLE "RoommateProfile" ADD CONSTRAINT "RoommateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomProviderProfile" ADD CONSTRAINT "RoomProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
