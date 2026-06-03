import { HttpError } from './http.js';
import { prisma } from './prisma.js';

/**
 * Action-level public access enforcement for service-layer writes.
 *
 * Middleware already blocks READ_ONLY non-members (403). This function
 * enforces INTERACT tier: allows votes + comments, blocks board/post creation.
 * FULL tier allows everything.
 *
 * Only call this when the user is NOT a workspace member (i.e., they're
 * a public visitor on a PUBLIC workspace).
 *
 * @param workspaceId - The workspace being written to
 * @param action - The action being performed ('CREATE_BOARD' | 'CREATE_POST' | 'CREATE_COMMENT' | 'ADD_VOTE')
 * @throws HttpError(403) if the action is blocked by the access level
 */
export async function enforcePublicWriteAccess(
  workspaceId: string,
  action: 'CREATE_BOARD' | 'CREATE_POST' | 'CREATE_COMMENT' | 'ADD_VOTE',
): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { visibility: true, publicAccessLevel: true },
  });

  if (!workspace || workspace.visibility !== 'PUBLIC') {
    // PRIVATE workspaces are already protected by middleware. If we get here
    // somehow, it's fine — the membership check in the service will catch it.
    return;
  }

  // READ_ONLY non-members are already blocked by the middleware (403).
  // INTERACT tier allows votes + comments but blocks board/post creation.
  if (workspace.publicAccessLevel === 'INTERACT') {
    if (action === 'CREATE_BOARD' || action === 'CREATE_POST') {
      throw new HttpError(
        'Forbidden: this workspace requires membership to create boards and posts. Comments and votes are open to all authenticated users.',
        403,
      );
    }
  }

  // FULL: allow everything (no additional restriction)
}
