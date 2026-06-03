-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "PublicAccessLevel" AS ENUM ('READ_ONLY', 'INTERACT', 'FULL');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "publicAccessLevel" "PublicAccessLevel" NOT NULL DEFAULT 'READ_ONLY',
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';
