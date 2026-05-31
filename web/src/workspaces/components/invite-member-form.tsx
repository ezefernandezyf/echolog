'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { useCreateInvitation } from '../../hooks/use-invitations';
import { mapServerErrors } from '../../shared/lib/map-server-errors';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberFormProps {
  workspaceId: string;
}

export function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
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

  const createInvitationMutation = useCreateInvitation();

  return (
    <form
      className="flex items-end gap-3"
      onSubmit={handleSubmit((data) =>
        createInvitationMutation.mutate(
          { workspaceId, email: data.email, role: data.role },
          {
            onSuccess: () => reset(),
            onError: (error) => {
              const fallback = mapServerErrors(error, setError);
              if (fallback) {
                toast.error(fallback);
              }
            },
          },
        ),
      )}
    >
      <label className="flex-1 space-y-1.5">
        <span className="text-sm font-medium text-secondary-foreground">Email address</span>
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
          <p id="invite-email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </label>

      <label className="w-36 space-y-1.5">
        <span className="text-sm font-medium text-secondary-foreground">Role</span>
        <select
          id="invite-role"
          className="flex min-h-11 w-full rounded-xl border border-border bg-card px-3 text-base text-foreground shadow-sm shadow-black/[0.02] transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          {...register('role')}
        >
          <option value="ADMIN">Admin</option>
          <option value="MEMBER">Member</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </label>

      <Button
        type="submit"
        disabled={createInvitationMutation.isPending || !isDirty}
        className="bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
      >
        {createInvitationMutation.isPending ? 'Inviting...' : 'Invite'}
      </Button>
    </form>
  );
}
