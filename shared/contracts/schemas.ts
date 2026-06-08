import { z } from 'zod';

// ── Helpers ────────────────────────────────────────────────────────────────

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim().length === 0 ? undefined : value;

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

const optionalText = (schema: z.ZodTypeAny) =>
  z.preprocess(emptyStringToUndefined, schema.nullish());

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug cannot be empty')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .refine((slug) => /[a-z0-9]/.test(slug), 'Slug must include at least one letter or number');

// ── Enums ──────────────────────────────────────────────────────────────────

export const WorkspaceRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export const InvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED']);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const PostStatusSchema = z.enum(['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE']);
export type PostStatus = z.infer<typeof PostStatusSchema>;

export const NotificationTypeSchema = z.enum(['INVITE_SENT', 'ROLE_CHANGED', 'NEW_COMMENT', 'BOARD_REQUEST']);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const VisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);
export type Visibility = z.infer<typeof VisibilitySchema>;

export const PublicAccessLevelSchema = z.enum(['READ_ONLY', 'INTERACT', 'FULL']);
export type PublicAccessLevel = z.infer<typeof PublicAccessLevelSchema>;

export const WorkspacePermissionLevelSchema = z.enum(['OWNER', 'ADMINS', 'MEMBERS', 'NOBODY']);
export type WorkspacePermissionLevel = z.infer<typeof WorkspacePermissionLevelSchema>;

export const BoardCreationPolicySchema = z.enum(['FREE', 'APPROVAL_REQUIRED', 'ADMINS_ONLY']);
export type BoardCreationPolicy = z.infer<typeof BoardCreationPolicySchema>;

export const BoardRequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type BoardRequestStatus = z.infer<typeof BoardRequestStatusSchema>;

// ── Auth DTO Schemas ───────────────────────────────────────────────────────

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  name: z.string().nullable(),
  emailVerified: z.boolean(),
});
export type AuthUserDTO = z.infer<typeof AuthUserSchema>;

export const AuthSessionSchema = z.object({
  user: AuthUserSchema,
});
export type AuthSessionDTO = z.infer<typeof AuthSessionSchema>;

export const AuthRegisterDTOSchema = z.object({
  email: z.string(),
  password: z.string(),
  name: z.string(),
});
export type AuthRegisterDTO = z.infer<typeof AuthRegisterDTOSchema>;

export const AuthLoginDTOSchema = z.object({
  email: z.string(),
  password: z.string(),
});
export type AuthLoginDTO = z.infer<typeof AuthLoginDTOSchema>;

export const UpdateProfileResultSchema = z.object({
  user: AuthUserSchema,
});
export type UpdateProfileResult = z.infer<typeof UpdateProfileResultSchema>;

export const UpdateProfileDTOSchema = z.object({
  name: z.string(),
});
export type UpdateProfileDTO = z.infer<typeof UpdateProfileDTOSchema>;

export const UpdateEmailDTOSchema = z.object({
  email: z.string(),
  currentPassword: z.string(),
});
export type UpdateEmailDTO = z.infer<typeof UpdateEmailDTOSchema>;

export const UpdatePasswordDTOSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
});
export type UpdatePasswordDTO = z.infer<typeof UpdatePasswordDTOSchema>;

// ── Workspace DTO Schemas ──────────────────────────────────────────────────

export const WorkspaceSchema = z.object({
  id: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  name: z.string(),
  slug: z.string(),
  role: WorkspaceRoleSchema,
  visibility: VisibilitySchema,
  publicAccessLevel: PublicAccessLevelSchema,
  adminsCanEditSettings: z.boolean(),
  boardCreation: WorkspacePermissionLevelSchema,
  boardDeletion: WorkspacePermissionLevelSchema,
  commenting: WorkspacePermissionLevelSchema,
  boardCreationPolicy: BoardCreationPolicySchema,
});
export type WorkspaceDTO = z.infer<typeof WorkspaceSchema>;

export const CreateWorkspaceDTOSchema = z.object({
  name: z.string(),
});
export type CreateWorkspaceDTO = z.infer<typeof CreateWorkspaceDTOSchema>;

export const UpdateWorkspaceDTOSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  adminsCanEditSettings: z.boolean().optional(),
  boardCreation: WorkspacePermissionLevelSchema.optional(),
  boardDeletion: WorkspacePermissionLevelSchema.optional(),
  commenting: WorkspacePermissionLevelSchema.optional(),
  boardCreationPolicy: BoardCreationPolicySchema.optional(),
});
export type UpdateWorkspaceDTO = z.infer<typeof UpdateWorkspaceDTOSchema>;

// ── Board DTO Schemas ──────────────────────────────────────────────────────

export const BoardSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  name: z.string(),
  slug: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  description: z.string().nullable(),
});
export type BoardDTO = z.infer<typeof BoardSchema>;

export const CreateBoardDTOSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
});
export type CreateBoardDTO = z.infer<typeof CreateBoardDTOSchema>;

export const UpdateBoardDTOSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
});
export type UpdateBoardDTO = z.infer<typeof UpdateBoardDTOSchema>;

// ── Board Request DTO Schemas ─────────────────────────────────────────────

export const BoardRequestSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  userName: z.string().nullable(),
  /** Plain text — not HTML-safe. React escapes on render. */
  boardName: z.string(),
  boardSlug: z.string(),
  status: BoardRequestStatusSchema,
  createdAt: z.string(),
});
export type BoardRequestDTO = z.infer<typeof BoardRequestSchema>;

export const CreateBoardRequestDTOSchema = z.object({
  boardName: z.string().trim().min(1, 'Board name is required').max(120),
  boardSlug: z
    .string()
    .trim()
    .min(1, 'Slug cannot be empty')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});
export type CreateBoardRequestDTO = z.infer<typeof CreateBoardRequestDTOSchema>;

export const UpdateBoardRequestDTOSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type UpdateBoardRequestDTO = z.infer<typeof UpdateBoardRequestDTOSchema>;

// ── Board Request Validation Schemas ───────────────────────────────────────

export const createBoardRequestSchema = z.object({
  boardName: requiredText('Board name').max(120),
  boardSlug: slugSchema,
});

export const updateBoardRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Status must be APPROVED or REJECTED',
  }),
});

// ── Post DTO Schemas ───────────────────────────────────────────────────────

export const PostSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  boardId: z.string(),
  authorId: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  title: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  body: z.string(),
  status: z.string(),
  voteCount: z.number(),
  commentCount: z.number(),
  authorName: z.string().nullable().optional(),
  isUpvoted: z.boolean().optional(),
});
export type PostDTO = z.infer<typeof PostSchema>;

export const CreatePostDTOSchema = z.object({
  title: z.string(),
  body: z.string(),
});
export type CreatePostDTO = z.infer<typeof CreatePostDTOSchema>;

export const PostListFiltersSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['trending', 'top', 'new']).optional(),
  cursor: z.string().optional(),
  limit: z.number().optional(),
});
export type PostListFilters = z.infer<typeof PostListFiltersSchema>;

export const PostListResponseSchema = z.object({
  posts: z.array(PostSchema),
  nextCursor: z.string().nullable(),
});
export type PostListResponse = z.infer<typeof PostListResponseSchema>;

// ── Vote DTO Schemas ───────────────────────────────────────────────────────

export const VoteSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  voteCount: z.number(),
  voted: z.boolean(),
});
export type VoteDTO = z.infer<typeof VoteSchema>;

// ── Comment DTO Schemas ────────────────────────────────────────────────────

export const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  authorId: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  body: z.string(),
  createdAt: z.string(),
  authorName: z.string().nullable().optional(),
});
export type CommentDTO = z.infer<typeof CommentSchema>;

export const CreateCommentDTOSchema = z.object({
  body: z.string(),
});
export type CreateCommentDTO = z.infer<typeof CreateCommentDTOSchema>;

// ── Member DTO Schemas ─────────────────────────────────────────────────────

export const MemberSchema = z.object({
  userId: z.string(),
  workspaceId: z.string(),
  role: WorkspaceRoleSchema,
  /** Plain text — not HTML-safe. React escapes on render. */
  name: z.string().nullable(),
  email: z.string(),
  joinedAt: z.string(),
});
export type MemberDTO = z.infer<typeof MemberSchema>;

export const ChangeRoleDTOSchema = z.object({
  role: WorkspaceRoleSchema,
});
export type ChangeRoleDTO = z.infer<typeof ChangeRoleDTOSchema>;

// ── Invitation DTO Schemas ─────────────────────────────────────────────────

export const InvitationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  workspaceName: z.string(),
  invitedEmail: z.string(),
  role: WorkspaceRoleSchema,
  status: InvitationStatusSchema,
  token: z.string(),
  expiresAt: z.string(),
});
export type InvitationDTO = z.infer<typeof InvitationSchema>;

export const CreateInvitationDTOSchema = z.object({
  email: z.string(),
  role: WorkspaceRoleSchema.optional(),
});
export type CreateInvitationDTO = z.infer<typeof CreateInvitationDTOSchema>;

// ── Notification DTO Schemas ───────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  /** Plain text — not HTML-safe. React escapes on render. */
  message: z.string(),
  read: z.boolean(),
  link: z.string().nullable(),
  actorId: z.string().nullable(),
  workspaceId: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationDTO = z.infer<typeof NotificationSchema>;

export const UnreadCountSchema = z.object({
  count: z.number(),
});
export type UnreadCountDTO = z.infer<typeof UnreadCountSchema>;

// ── Auth Validation Schemas ────────────────────────────────────────────────

export const authRegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: requiredText('Name').max(120),
});

export const authLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Workspace Validation Schemas ───────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: requiredText('Workspace name').max(120),
});

export const updateWorkspaceSchema = z
  .object({
    name: optionalText(requiredText('Workspace name').max(120)),
    slug: optionalText(slugSchema),
    adminsCanEditSettings: z.boolean().optional(),
    boardCreation: WorkspacePermissionLevelSchema.optional(),
    boardDeletion: WorkspacePermissionLevelSchema.optional(),
    commenting: WorkspacePermissionLevelSchema.optional(),
    boardCreationPolicy: BoardCreationPolicySchema.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.slug !== undefined ||
      data.adminsCanEditSettings !== undefined ||
      data.boardCreation !== undefined ||
      data.boardDeletion !== undefined ||
      data.commenting !== undefined ||
      data.boardCreationPolicy !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

// ── Public Workspace DTO Schemas ───────────────────────────────────────────

export const PublicWorkspaceSchema = z.object({
  id: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  name: z.string(),
  slug: z.string(),
  memberCount: z.number(),
  postCount: z.number(),
  createdAt: z.string(),
});
export type PublicWorkspaceDTO = z.infer<typeof PublicWorkspaceSchema>;

export const PublicWorkspaceListSchema = z.object({
  workspaces: z.array(PublicWorkspaceSchema),
  nextCursor: z.string().nullable(),
});
export type PublicWorkspaceListDTO = z.infer<typeof PublicWorkspaceListSchema>;

export const PublicBoardDTOSchema = z.object({
  id: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  name: z.string(),
  slug: z.string(),
  postCount: z.number(),
});
export type PublicBoardDTO = z.infer<typeof PublicBoardDTOSchema>;

export const PublicWorkspaceDetailDTOSchema = z.object({
  id: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  name: z.string(),
  slug: z.string(),
  memberCount: z.number(),
  postCount: z.number(),
  visibility: VisibilitySchema,
  publicAccessLevel: PublicAccessLevelSchema,
  createdAt: z.string(),
  boards: z.array(PublicBoardDTOSchema),
});
export type PublicWorkspaceDetailDTO = z.infer<typeof PublicWorkspaceDetailDTOSchema>;

export const PublicBoardDetailDTOSchema = z.object({
  id: z.string(),
  /** Plain text — not HTML-safe. React escapes on render. */
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  postCount: z.number(),
  posts: z.array(PostSchema),
  nextCursor: z.string().nullable(),
});
export type PublicBoardDetailDTO = z.infer<typeof PublicBoardDetailDTOSchema>;

export const UpdateVisibilityDTOSchema = z.object({
  visibility: VisibilitySchema,
  publicAccessLevel: PublicAccessLevelSchema.optional(),
});
export type UpdateVisibilityDTO = z.infer<typeof UpdateVisibilityDTOSchema>;

// ── Board Validation Schemas ───────────────────────────────────────────────

export const createBoardSchema = z.object({
  name: requiredText('Board name').max(120),
  description: optionalText(
    z.string().trim().max(500, 'Description must be at most 500 characters'),
  ),
});

export const updateBoardSchema = z
  .object({
    name: optionalText(requiredText('Board name').max(120)),
    slug: optionalText(slugSchema),
    description: optionalText(
      z.string().trim().max(500, 'Description must be at most 500 characters'),
    ),
  })
  .refine(
    (data) => data.name !== undefined || data.slug !== undefined || data.description !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

// ── Post Validation Schemas ────────────────────────────────────────────────

export const createPostSchema = z.object({
  title: requiredText('Title').max(120),
  body: requiredText('Body'),
});

export const updatePostStatusSchema = z.object({
  status: PostStatusSchema,
});

// ── Comment Validation Schemas ─────────────────────────────────────────────

export const createCommentSchema = z.object({
  body: requiredText('Comment body').max(500, 'Comment must be at most 500 characters'),
});

// ── User Settings Validation Schemas ───────────────────────────────────────

export const updateProfileSchema = z.object({
  name: requiredText('Name').max(120),
});

export const updateEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// ── Invitation Validation Schemas ──────────────────────────────────────────

export const createInvitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export const changeRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});
