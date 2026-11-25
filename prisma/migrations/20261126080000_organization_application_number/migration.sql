-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "applicationNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_applicationNumber_key" ON "organizations"("applicationNumber");
