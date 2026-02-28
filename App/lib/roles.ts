export const ADMIN_ROLES = ['admin', 'deputy', 'support'];

export function isAdminRole(role?: string | null) {
  if (!role) return false;
  return ADMIN_ROLES.includes(role);
}

export function canAccess(section: string, user: { role: string; department: string } | null) {
  if (!user) return false;
  if (section === 'inProgress') return true;
  if (section === 'profile') return true;
  if (section === 'paint') return user.department === 'paint' || isAdminRole(user.role);
  if (['orders', 'users', 'completed', 'assortment'].includes(section)) {
    return isAdminRole(user.role);
  }
  return false;
}
