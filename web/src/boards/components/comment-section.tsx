import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import type { CommentDTO } from '../../../../shared/contracts/index.js';

interface CommentSectionProps {
  postId: string;
  comments: CommentDTO[];
  isLoading: boolean;
}

export function CommentSection({ postId, comments, isLoading }: CommentSectionProps) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const commentMutation = useMutation({
    mutationFn: (body: string) => commentApi.create(postId, { body }),
    onSuccess: () => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setCommentText('');
    },
    onError: () => toast.error('Failed to add comment.'),
  });

  if (isLoading) {
    return (
      <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="space-y-3 py-2" aria-hidden="true">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 size-6 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                {(c.authorName ?? c.authorId).slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-zinc-700 dark:text-zinc-300">{c.body}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-2 text-sm text-zinc-400 dark:text-zinc-500">No comments yet.</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (commentText.trim()) commentMutation.mutate(commentText.trim());
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-card dark:text-foreground dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />
        <Button
          type="submit"
          disabled={!commentText.trim() || commentMutation.isPending}
          className="h-auto px-3 py-1.5 text-xs"
        >
          {commentMutation.isPending ? '...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
