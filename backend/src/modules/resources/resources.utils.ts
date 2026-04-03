import type { RoleCode } from '../users/users.types';

export interface ResourceVisibilityTarget {
  status: string;
  ownerId?: string;
}

export function canViewResource(
  role: RoleCode,
  resource: ResourceVisibilityTarget,
  currentUserId: string
): boolean {
  if (role === 'admin') {
    return true;
  }

  if (role === 'faculty') {
    return resource.status !== 'archived' && (resource.status === 'published' || resource.ownerId === currentUserId);
  }

  return resource.status === 'published';
}
