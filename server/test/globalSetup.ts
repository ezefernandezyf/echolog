import { PrismaClient } from '@prisma/client';

export async function setup() {
  const prisma = new PrismaClient();

  try {
    // Delete in reverse dependency order to respect foreign keys
    await prisma.workspaceInvitation.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.board.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
}
