-- CreateTable
CREATE TABLE "DatabaseBootstrap" (
    "id" TEXT NOT NULL,
    "seedMarker" TEXT NOT NULL,
    "serializableCounter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseBootstrap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseBootstrap_seedMarker_key" ON "DatabaseBootstrap"("seedMarker");
