-- CreateEnum
CREATE TYPE "WorkspacePermissionLevel" AS ENUM ('OWNER', 'ADMINS', 'MEMBERS', 'NOBODY');

-- CreateEnum
CREATE TYPE "BoardCreationPolicy" AS ENUM ('FREE', 'APPROVAL_REQUIRED', 'ADMINS_ONLY');

-- CreateEnum
CREATE TYPE "BoardRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BOARD_REQUEST';

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "boardCreation" "WorkspacePermissionLevel" NOT NULL DEFAULT 'MEMBERS',
ADD COLUMN     "boardCreationPolicy" "BoardCreationPolicy" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "boardDeletion" "WorkspacePermissionLevel" NOT NULL DEFAULT 'ADMINS',
ADD COLUMN     "commenting" "WorkspacePermissionLevel" NOT NULL DEFAULT 'MEMBERS';

-- CreateTable
CREATE TABLE "BoardRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boardName" TEXT NOT NULL,
    "boardSlug" TEXT NOT NULL,
    "status" "BoardRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardRequest_workspaceId_idx" ON "BoardRequest"("workspaceId");

-- CreateIndex
CREATE INDEX "BoardRequest_userId_idx" ON "BoardRequest"("userId");

-- AddForeignKey
ALTER TABLE "BoardRequest" ADD CONSTRAINT "BoardRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardRequest" ADD CONSTRAINT "BoardRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
