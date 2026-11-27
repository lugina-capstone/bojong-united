-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarFileId" TEXT;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "revisionNote" TEXT;

-- AlterTable
ALTER TABLE "revision_requests" ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "focusPoints" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "submission_files" (
    "submissionId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "submission_files_pkey" PRIMARY KEY ("submissionId","fileId")
);

-- CreateTable
CREATE TABLE "submission_drafts" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "link" TEXT,
    "text" TEXT,
    "revisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_draft_files" (
    "draftId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "submission_draft_files_pkey" PRIMARY KEY ("draftId","fileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "submission_files_fileId_key" ON "submission_files"("fileId");

-- CreateIndex
CREATE INDEX "submission_files_submissionId_position_idx" ON "submission_files"("submissionId", "position");

-- CreateIndex
CREATE INDEX "submission_drafts_userId_idx" ON "submission_drafts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_drafts_milestoneId_userId_key" ON "submission_drafts"("milestoneId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_draft_files_fileId_key" ON "submission_draft_files"("fileId");

-- CreateIndex
CREATE INDEX "submission_draft_files_draftId_position_idx" ON "submission_draft_files"("draftId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatarFileId_key" ON "users"("avatarFileId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_drafts" ADD CONSTRAINT "submission_drafts_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_drafts" ADD CONSTRAINT "submission_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_draft_files" ADD CONSTRAINT "submission_draft_files_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "submission_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_draft_files" ADD CONSTRAINT "submission_draft_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
