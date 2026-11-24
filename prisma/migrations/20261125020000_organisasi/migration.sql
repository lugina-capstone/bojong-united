-- AlterTable
ALTER TABLE "events" ADD COLUMN     "transferredFromId" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "deactivationReason" TEXT;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_transferredFromId_fkey" FOREIGN KEY ("transferredFromId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
