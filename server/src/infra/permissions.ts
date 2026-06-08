const ORDER: Record<string, number> = {
  OWNER: 4,
  NOBODY: 3,
  ADMINS: 2,
  ADMIN: 2,
  MEMBERS: 1,
  MEMBER: 1,
  VIEWER: 0,
};

/**
 * Checks if a user role meets or exceeds the required permission level.
 *
 * OWNER (highest) bypasses all gates including NOBODY.
 * NOBODY blocks everyone except OWNER.
 * ADMINS/ADMIN passes ADMINS, MEMBERS.
 * MEMBERS/MEMBER passes MEMBERS only.
 * VIEWER passes nothing (level 0).
 *
 * @param requiredLevel - The workspace permission field value (OWNER|ADMINS|MEMBERS|NOBODY)
 * @param userRole - The user's workspace role (OWNER|ADMIN|MEMBER|VIEWER)
 * @returns true if userRole meets or exceeds requiredLevel
 */
export function checkPermission(requiredLevel: string, userRole: string): boolean {
  const required = ORDER[requiredLevel];
  const user = ORDER[userRole] ?? 0;

  // Unknown required level → deny (fail-safe)
  if (required === undefined) return false;

  return required <= user;
}
