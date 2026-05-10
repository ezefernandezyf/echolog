import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@echolog.dev' },
    update: {},
    create: {
      email: 'demo@echolog.dev',
      name: 'Demo User',
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo',
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'OWNER',
    },
  });

  await prisma.board.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: 'feature-requests',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Feature Requests',
      slug: 'feature-requests',
      description: 'Suggest and vote on new features',
    },
  });

  console.log('Seed complete!');
  console.log(`  User: demo@echolog.dev / password123`);
  console.log(`  Workspace: ${workspace.slug}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
