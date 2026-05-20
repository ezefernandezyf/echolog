'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { invitationsApi } from '../../core/api-client';
import { mapServerErrors } from '../../shared/lib/map-server-errors';
import type { WorkspaceRole } from '../../../../shared/contracts/index.js';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberFormProps {
  workspaceId: string;
}

export function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const mutation = useMutation({
    mutationFn: (data: InviteFormValues) =>
      invitationsApi.create(workspaceId, { email: data.email, role: data.role }),
    onSuccess: () => {
      toast.success('Invitation sent');
      queryClient.invalidateQueries({ queryKey: ['invitations', workspaceId] });
      reset();
    },
    onError: (error) => {
      const fallback = mapServerErrors(error, setError);
      if (fallback) {
        toast.error(fallback);
      }
    },
  });

  return (
    <form
      className="flex items-end gap-3"
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
    >
      <label className="flex-1 space-y-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email address
        </span>
        <Input
          id="invite-email"
          type="email"
          placeholder="colleague@company.com"
          autoComplete="off"
          aria-describedby={errors.email ? 'invite-email-error' : undefined}
          aria-invalid={errors.email ? true : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p id="invite-email-error" role="alert" className="text-sm text-red-600">
            {errors.email.message}
          </p>
        ) : null}
      </label>

      <label className="w-36 space-y-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</span>
        <select
          id="invite-role"
          className="flex min-h-11 w-full rounded-xl border border-border bg-card px-3 text-base text-foreground shadow-sm shadow-black/[0.02] transition-colors focus-visible:border-zinc-900 dark:focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          {...register('role')}
        >
          <option value="ADMIN">Admin</option>
          <option value="MEMBER">Member</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </label>

      <Button
        type="submit"
        disabled={mutation.isPending || !isDirty}
        className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-400"
      >
        {mutation.isPending ? 'Inviting...' : 'Invite'}
      </Button>
    </form>
  );
}
