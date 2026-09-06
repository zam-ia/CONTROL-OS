export const PRIMARY_ADMIN_EMAIL = 'admin@crisdalcompany.com';

export function isPrimaryAdministrator(email: string | null | undefined) {
  return email?.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
}

export function canManageClientCredentials({
  email,
  globalRole,
  status,
}: {
  email: string | null | undefined;
  globalRole: string | null | undefined;
  status: string | null | undefined;
}) {
  if (status !== 'ACTIVE') return false;
  return (
    isPrimaryAdministrator(email) ||
    globalRole === 'ADMIN' ||
    globalRole === 'SUPER_ADMIN'
  );
}
