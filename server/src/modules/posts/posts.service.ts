import { randomUUID } from 'node:crypto';
import { HttpError } from '../../lib/http.js';
import type { CreatePostDTO, PostDTO } from '../../../../shared/contracts/index.js';

const posts: PostDTO[] = [
  { id: 'post-1', workspaceId: 'workspace-1', boardId: 'board-1', authorId: 'user-1', title: 'Add dark mode', body: 'Please add dark mode', voteCount: 0 },
];

export class PostsService {
  list(boardId: string) {
    return posts.filter((post) => post.boardId === boardId);
  }

  create(boardId: string, input: CreatePostDTO) {
    const post = {
      id: randomUUID(),
      workspaceId: 'workspace-1',
      boardId,
      authorId: 'user-1',
      title: input.title,
      body: input.body,
      voteCount: 0,
    };

    posts.push(post);
    return post;
  }

  vote(postId: string) {
    const post = posts.find((candidate) => candidate.id === postId);
    if (!post) throw new HttpError('Post not found', 404);
    post.voteCount += 1;
    return post;
  }
}

export const postsService = new PostsService();
