import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing dynamic data (preserves schema, resets content)
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // ── Users ───────────────────────────────────────────────────────────

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@echolog.dev' },
    update: {},
    create: { email: 'demo@echolog.dev', name: 'Demo User', passwordHash },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@echolog.dev' },
    update: {},
    create: { email: 'alice@echolog.dev', name: 'Alice Johnson', passwordHash },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@echolog.dev' },
    update: {},
    create: { email: 'bob@echolog.dev', name: 'Bob Martinez', passwordHash },
  });

  const users = [demoUser, alice, bob];

  // ── Workspace 1: Product Feedback ───────────────────────────────────

  const w1 = await prisma.workspace.upsert({
    where: { slug: 'product-feedback' },
    update: {},
    create: { name: 'Product Feedback', slug: 'product-feedback' },
  });

  for (const u of users) {
    await prisma.workspaceMember.upsert({
      where: { userId_workspaceId: { userId: u.id, workspaceId: w1.id } },
      update: {},
      create: { userId: u.id, workspaceId: w1.id, role: u.id === demoUser.id ? 'OWNER' : 'MEMBER' },
    });
  }

  const w1Boards = [
    {
      name: 'Feature Requests',
      slug: 'feature-requests',
      description: 'Suggest and vote on new features',
    },
    { name: 'Bug Reports', slug: 'bug-reports', description: "Report issues you've found" },
    {
      name: 'General Discussion',
      slug: 'general-discussion',
      description: 'Open chat about the product',
    },
  ];

  for (const b of w1Boards) {
    await prisma.board.upsert({
      where: { workspaceId_slug: { workspaceId: w1.id, slug: b.slug } },
      update: {},
      create: { workspaceId: w1.id, ...b },
    });
  }

  // ── Workspace 2: Design System ──────────────────────────────────────

  const w2 = await prisma.workspace.upsert({
    where: { slug: 'design-system' },
    update: {},
    create: { name: 'Design System', slug: 'design-system' },
  });

  for (const u of users) {
    await prisma.workspaceMember.upsert({
      where: { userId_workspaceId: { userId: u.id, workspaceId: w2.id } },
      update: {},
      create: { userId: u.id, workspaceId: w2.id, role: u.id === alice.id ? 'OWNER' : 'MEMBER' },
    });
  }

  const w2Boards = [
    { name: 'Components', slug: 'components', description: 'New component proposals' },
    { name: 'Tokens & Themes', slug: 'tokens-themes', description: 'Design token suggestions' },
  ];

  for (const b of w2Boards) {
    await prisma.board.upsert({
      where: { workspaceId_slug: { workspaceId: w2.id, slug: b.slug } },
      update: {},
      create: { workspaceId: w2.id, ...b },
    });
  }

  // ── Workspace 3: Mobile App ─────────────────────────────────────────

  const w3 = await prisma.workspace.upsert({
    where: { slug: 'mobile-app' },
    update: {},
    create: { name: 'Mobile App', slug: 'mobile-app' },
  });

  for (const u of users) {
    await prisma.workspaceMember.upsert({
      where: { userId_workspaceId: { userId: u.id, workspaceId: w3.id } },
      update: {},
      create: { userId: u.id, workspaceId: w3.id, role: u.id === bob.id ? 'OWNER' : 'MEMBER' },
    });
  }

  const w3Boards = [
    { name: 'iOS', slug: 'ios', description: 'iOS-specific feedback' },
    { name: 'Android', slug: 'android', description: 'Android-specific feedback' },
    { name: 'Cross-Platform', slug: 'cross-platform', description: 'Shared mobile concerns' },
  ];

  for (const b of w3Boards) {
    await prisma.board.upsert({
      where: { workspaceId_slug: { workspaceId: w3.id, slug: b.slug } },
      update: {},
      create: { workspaceId: w3.id, ...b },
    });
  }

  // ── Posts ───────────────────────────────────────────────────────────

  const postsData = [
    // Workspace 1 posts
    {
      boardSlug: 'feature-requests',
      wsId: w1.id,
      title: 'Dark mode support',
      body: 'It would be great to have a dark mode for late-night productivity sessions.',
      status: 'DONE',
    },
    {
      boardSlug: 'feature-requests',
      wsId: w1.id,
      title: 'Export data to CSV',
      body: 'Allow users to export their feedback data to CSV for analysis.',
      status: 'PLANNED',
    },
    {
      boardSlug: 'feature-requests',
      wsId: w1.id,
      title: 'Team collaboration spaces',
      body: 'Add the ability to create team-specific spaces within a workspace.',
      status: 'OPEN',
    },
    {
      boardSlug: 'feature-requests',
      wsId: w1.id,
      title: 'API integration with Slack',
      body: 'Send notifications to Slack when new feedback is submitted.',
      status: 'IN_PROGRESS',
    },
    {
      boardSlug: 'bug-reports',
      wsId: w1.id,
      title: 'Notification bell shows wrong count',
      body: 'The badge count on the notification bell sometimes shows stale numbers until page refresh.',
      status: 'OPEN',
    },
    {
      boardSlug: 'bug-reports',
      wsId: w1.id,
      title: 'Markdown rendering in comments',
      body: 'Code blocks inside comments are not rendering properly on mobile.',
      status: 'IN_PROGRESS',
    },
    {
      boardSlug: 'bug-reports',
      wsId: w1.id,
      title: 'Session timeout too aggressive',
      body: 'Getting logged out after only 10 minutes of inactivity.',
      status: 'PLANNED',
    },
    {
      boardSlug: 'general-discussion',
      wsId: w1.id,
      title: 'What features do you use most?',
      body: 'Curious to hear which parts of the product people find most valuable.',
      status: 'OPEN',
    },
    {
      boardSlug: 'general-discussion',
      wsId: w1.id,
      title: 'Q1 2026 roadmap discussion',
      body: "Let's discuss what we should prioritize for the next quarter.",
      status: 'OPEN',
    },

    // Workspace 2 posts
    {
      boardSlug: 'components',
      wsId: w2.id,
      title: 'New DataTable component',
      body: 'We need a sortable, filterable data table component for the admin panel.',
      status: 'PLANNED',
    },
    {
      boardSlug: 'components',
      wsId: w2.id,
      title: 'Toast notification redesign',
      body: 'Current toasts are too subtle. They should be more noticeable for errors.',
      status: 'IN_PROGRESS',
    },
    {
      boardSlug: 'components',
      wsId: w2.id,
      title: 'Bottom sheet component',
      body: 'A reusable bottom sheet for mobile views would be really useful.',
      status: 'OPEN',
    },
    {
      boardSlug: 'components',
      wsId: w2.id,
      title: 'Date picker with range support',
      body: 'Need a date range picker for the analytics dashboard.',
      status: 'OPEN',
    },
    {
      boardSlug: 'tokens-themes',
      wsId: w2.id,
      title: 'Add tertiary color palette',
      body: 'Our current color system needs a tertiary palette for accents and highlights.',
      status: 'DONE',
    },
    {
      boardSlug: 'tokens-themes',
      wsId: w2.id,
      title: 'Spacing scale review',
      body: 'The current spacing scale has gaps between 8px and 16px that we should fill.',
      status: 'IN_PROGRESS',
    },

    // Workspace 3 posts
    {
      boardSlug: 'ios',
      wsId: w3.id,
      title: 'FaceID login support',
      body: 'It would be way more convenient to log in with FaceID instead of typing credentials.',
      status: 'PLANNED',
    },
    {
      boardSlug: 'ios',
      wsId: w3.id,
      title: 'Widget for home screen',
      body: 'An iOS widget showing recent feedback activity would be awesome.',
      status: 'OPEN',
    },
    {
      boardSlug: 'android',
      wsId: w3.id,
      title: 'Material You theming',
      body: 'Support Material You dynamic colors on Android 12+.',
      status: 'OPEN',
    },
    {
      boardSlug: 'android',
      wsId: w3.id,
      title: 'Notification channels support',
      body: 'Let users configure different notification sounds per channel.',
      status: 'PLANNED',
    },
    {
      boardSlug: 'cross-platform',
      wsId: w3.id,
      title: 'Offline mode',
      body: 'Allow browsing and voting on feedback even without internet connection.',
      status: 'OPEN',
    },
    {
      boardSlug: 'cross-platform',
      wsId: w3.id,
      title: 'Push notifications are delayed',
      body: 'Push notifications arrive 5-10 minutes after the event. Needs investigation.',
      status: 'IN_PROGRESS',
    },
    {
      boardSlug: 'cross-platform',
      wsId: w3.id,
      title: 'Sync bookmarks across devices',
      body: 'Bookmarked posts should sync between my phone and laptop.',
      status: 'OPEN',
    },
  ];

  const createdPosts: Array<{ id: string; boardSlug: string; wsId: string }> = [];

  for (const p of postsData) {
    const board = await prisma.board.findUnique({
      where: { workspaceId_slug: { workspaceId: p.wsId, slug: p.boardSlug } },
    });
    if (!board) continue;

    const post = await prisma.post.create({
      data: {
        boardId: board.id,
        workspaceId: p.wsId,
        authorId: users[Math.floor(Math.random() * users.length)].id,
        title: p.title,
        body: p.body,
        status: p.status,
      },
    });
    createdPosts.push({ id: post.id, boardSlug: p.boardSlug, wsId: p.wsId });
  }

  // ── Comments ────────────────────────────────────────────────────────

  const commentTexts = [
    'This is a great idea! I would definitely use this.',
    "We've been asking for this for a while. Hope it gets prioritized.",
    'I have a slightly different take — I think we should approach this differently.',
    '++1 This would be a game changer for our team.',
    'Any updates on when this might be implemented?',
    'I tried a workaround for this, happy to share if anyone needs it.',
    'This should be higher priority IMO.',
    'Great suggestion! Adding it to our roadmap.',
  ];

  for (const post of createdPosts.slice(0, 15)) {
    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: users[Math.floor(Math.random() * users.length)].id,
        body: commentTexts[Math.floor(Math.random() * commentTexts.length)],
      },
    });
  }

  // Add a second comment to some posts
  for (const post of createdPosts.slice(0, 8)) {
    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: users[Math.floor(Math.random() * users.length)].id,
        body: commentTexts[Math.floor(Math.random() * commentTexts.length)],
      },
    });
  }

  // ── Votes ───────────────────────────────────────────────────────────

  for (const post of createdPosts) {
    // Each post gets 1-3 votes from random users
    const voterCount = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(voterCount, shuffled.length); i++) {
      try {
        await prisma.vote.create({
          data: { postId: post.id, userId: shuffled[i].id },
        });
      } catch {
        // vote already exists — skip
      }
    }
  }

  console.log('Seed complete!');
  console.log(`  Users:     demo@echolog.dev / password123`);
  console.log(`            alice@echolog.dev / password123`);
  console.log(`            bob@echolog.dev / password123`);
  console.log(`  Workspaces: product-feedback, design-system, mobile-app`);
  console.log(`  Boards:     ${w1Boards.length + w2Boards.length + w3Boards.length}`);
  console.log(`  Posts:      ${createdPosts.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
