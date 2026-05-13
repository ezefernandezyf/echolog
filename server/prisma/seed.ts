import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.workspace.deleteMany({
    where: { slug: 'demo' },
  });

  await prisma.user.deleteMany({
    where: { email: 'demo@echolog.dev' },
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@echolog.dev' },
    update: {},
    create: {
      email: 'demo@echolog.dev',
      name: 'Demo User',
      passwordHash,
    },
  });

  // TEMP DEMO DATA FOR SCREENSHOTS / VIDEO
  // Keep this section isolated so it is easy to revert later.
  const demoUsers = [
    { email: 'nina@echolog.dev', name: 'Nina Carter' },
    { email: 'marco@echolog.dev', name: 'Marco Silva' },
    { email: 'priya@echolog.dev', name: 'Priya Patel' },
  ] as const;

  const [nina, marco, priya] = await Promise.all(
    demoUsers.map(async (demoUser) =>
      prisma.user.upsert({
        where: { email: demoUser.email },
        update: { name: demoUser.name, passwordHash },
        create: {
          email: demoUser.email,
          name: demoUser.name,
          passwordHash,
        },
      }),
    ),
  );

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'northstar-demo' },
    update: { name: 'Northstar' },
    create: {
      name: 'Northstar',
      slug: 'northstar-demo',
    },
  });

  const members = [
    { userId: user.id, role: 'OWNER' as const },
    { userId: nina.id, role: 'ADMIN' as const },
    { userId: marco.id, role: 'MEMBER' as const },
    { userId: priya.id, role: 'MEMBER' as const },
  ];

  await Promise.all(
    members.map((member) =>
      prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: member.userId,
            workspaceId: workspace.id,
          },
        },
        update: { role: member.role },
        create: {
          userId: member.userId,
          workspaceId: workspace.id,
          role: member.role,
        },
      }),
    ),
  );

  const board = await prisma.board.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: 'customer-feedback',
      },
    },
    update: {
      name: 'Customer Feedback',
      description: 'Active customer asks and product ideas from the demo workspace',
    },
    create: {
      workspaceId: workspace.id,
      name: 'Customer Feedback',
      slug: 'customer-feedback',
      description: 'Active customer asks and product ideas from the demo workspace',
    },
  });

  const posts = [
    {
      id: 'cm-demo-dark-mode',
      authorId: nina.id,
      title: 'Dark mode needs better contrast on mobile',
      body: 'The sidebar and board filters blend together on smaller screens. A slightly brighter surface or stronger divider would help a lot.',
      status: 'OPEN' as const,
      comments: [
        {
          id: 'cm-demo-dark-mode-1',
          authorId: user.id,
          body: 'Good call. I am checking the mobile palette and spacing this week.',
        },
        {
          id: 'cm-demo-dark-mode-2',
          authorId: marco.id,
          body: 'I hit the same issue on an iPhone 13 mini — the board tabs are hard to scan.',
        },
      ],
    },
    {
      id: 'cm-demo-search',
      authorId: marco.id,
      title: 'Search should surface posts by title and body',
      body: 'When I search for a customer name, I expect matches in comments and descriptions too. That would make triage feel much faster.',
      status: 'IN_PROGRESS' as const,
      comments: [
        {
          id: 'cm-demo-search-1',
          authorId: priya.id,
          body: 'This would make screenshots nicer too because the empty state disappears quickly.',
        },
      ],
    },
    {
      id: 'cm-demo-comments',
      authorId: priya.id,
      title: 'Comment threads feel lightweight and easy to follow',
      body: 'A short threaded discussion on each post makes it obvious that feedback is moving forward, especially for customer-facing requests.',
      status: 'DONE' as const,
      comments: [
        {
          id: 'cm-demo-comments-1',
          authorId: user.id,
          body: 'Nice, this is exactly the kind of activity we want to show in the demo workspace.',
        },
      ],
    },
    {
      id: 'cm-demo-analytics',
      authorId: user.id,
      title: 'Weekly analytics should highlight top requests',
      body: 'A small trend summary for votes and comments would help the team see what is heating up before the next planning meeting.',
      status: 'PLANNED' as const,
      comments: [],
    },
  ];

  for (const postSeed of posts) {
    const post = await prisma.post.upsert({
      where: { id: postSeed.id },
      update: {
        workspaceId: workspace.id,
        boardId: board.id,
        authorId: postSeed.authorId,
        title: postSeed.title,
        body: postSeed.body,
        status: postSeed.status,
      },
      create: {
        id: postSeed.id,
        workspaceId: workspace.id,
        boardId: board.id,
        authorId: postSeed.authorId,
        title: postSeed.title,
        body: postSeed.body,
        status: postSeed.status,
      },
    });

    await Promise.all(
      postSeed.comments.map((commentSeed) =>
        prisma.comment.upsert({
          where: { id: commentSeed.id },
          update: {
            postId: post.id,
            authorId: commentSeed.authorId,
            body: commentSeed.body,
          },
          create: {
            id: commentSeed.id,
            postId: post.id,
            authorId: commentSeed.authorId,
            body: commentSeed.body,
          },
        }),
      ),
    );
  }

  await Promise.all([
    prisma.vote.upsert({
      where: { postId_userId: { postId: 'cm-demo-dark-mode', userId: user.id } },
      update: {},
      create: { postId: 'cm-demo-dark-mode', userId: user.id },
    }),
    prisma.vote.upsert({
      where: { postId_userId: { postId: 'cm-demo-dark-mode', userId: marco.id } },
      update: {},
      create: { postId: 'cm-demo-dark-mode', userId: marco.id },
    }),
    prisma.vote.upsert({
      where: { postId_userId: { postId: 'cm-demo-search', userId: user.id } },
      update: {},
      create: { postId: 'cm-demo-search', userId: user.id },
    }),
    prisma.vote.upsert({
      where: { postId_userId: { postId: 'cm-demo-search', userId: nina.id } },
      update: {},
      create: { postId: 'cm-demo-search', userId: nina.id },
    }),
  ]);

  console.log('Seed complete!');
  console.log(`  User: demo@echolog.dev / password123`);
  console.log(`  Workspace: ${workspace.slug}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
